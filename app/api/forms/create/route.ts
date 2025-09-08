import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(z.object({
    label: z.string().min(1, 'Field label is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'RATING', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'EMAIL', 'PHONE']),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number().min(1)
  })).min(1, 'At least one field is required')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createFormSchema.parse(body)
    
    // Create form with fields in a transaction
    const form = await prisma.$transaction(async (tx) => {
      // Create the form
      const newForm = await tx.form.create({
        data: {
          hotelId: session.user.hotelId!,
          name: validatedData.name,
          description: validatedData.description,
          isActive: true,
          isDefault: false
        }
      })

      // Create form fields
      const fields = await Promise.all(
        validatedData.fields.map(fieldData =>
          tx.formField.create({
            data: {
              formId: newForm.id,
              label: fieldData.label,
              type: fieldData.type,
              required: fieldData.required,
              placeholder: fieldData.placeholder,
              options: fieldData.options || [],
              order: fieldData.order
            }
          })
        )
      )

      return { ...newForm, fields }
    })

    return NextResponse.json({
      message: 'Form created successfully',
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: form.fields
      }
    })

  } catch (error) {
    console.error('Error creating form:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
