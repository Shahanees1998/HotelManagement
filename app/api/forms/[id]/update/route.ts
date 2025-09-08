import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  fields: z.array(z.object({
    id: z.string().optional(),
    label: z.string().min(1, 'Label is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'RATING', 'MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'EMAIL', 'PHONE', 'FILE_UPLOAD']),
    required: z.boolean(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number()
  }))
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateFormSchema.parse(body)
    const { id } = params

    // Verify form belongs to hotel
    const existingForm = await prisma.form.findFirst({
      where: {
        id,
        hotelId: session.user.hotelId
      }
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Update form
    const updatedForm = await prisma.form.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        fields: {
          deleteMany: {}, // Delete all existing fields
          create: validatedData.fields.map(field => ({
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options,
            order: field.order
          }))
        }
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({
      message: 'Form updated successfully',
      form: updatedForm
    })

  } catch (error) {
    console.error('Error updating form:', error)
    
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
