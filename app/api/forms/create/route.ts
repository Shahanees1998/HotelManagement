import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { STRIPE_CONFIG } from '@/lib/stripe'

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
    
    // Get hotel subscription plan to enforce restrictions
    const hotel = await prisma.hotel.findUnique({
      where: { id: session.user.hotelId },
      select: { subscriptionPlan: true }
    })
    
    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }
    
    // Enforce plan-based restrictions
    const planConfig = STRIPE_CONFIG.plans[hotel.subscriptionPlan as keyof typeof STRIPE_CONFIG.plans] || STRIPE_CONFIG.plans.basic
    
    // Check field count limit
    if (validatedData.fields.length > planConfig.maxFields) {
      return NextResponse.json(
        { error: `Your plan allows maximum ${planConfig.maxFields} fields. You have ${validatedData.fields.length} fields.` },
        { status: 400 }
      )
    }
    
    // Check allowed field types
    const invalidFieldTypes = validatedData.fields.filter(field => 
      !planConfig.allowedFieldTypes.includes(field.type)
    )
    
    if (invalidFieldTypes.length > 0) {
      return NextResponse.json(
        { error: `Your plan doesn't support these field types: ${invalidFieldTypes.map(f => f.type).join(', ')}` },
        { status: 400 }
      )
    }
    
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
