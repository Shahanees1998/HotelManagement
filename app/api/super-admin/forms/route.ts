import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createFormSchema = z.object({
  hotelId: z.string(),
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(z.object({
    label: z.string().min(1, 'Field label is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'RATING', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'EMAIL', 'PHONE', 'FILE_UPLOAD']),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number().min(1)
  })).min(1, 'At least one field is required')
})

const updateFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(z.object({
    label: z.string().min(1, 'Field label is required'),
    type: z.enum(['TEXT', 'TEXTAREA', 'RATING', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'EMAIL', 'PHONE', 'FILE_UPLOAD']),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
    order: z.number().min(1)
  }))
})

// GET - List all forms across all hotels
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')

    const forms = await prisma.form.findMany({
      where: hotelId ? { hotelId } : {},
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true
          }
        },
        fields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { reviews: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ forms })

  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create form for any hotel (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createFormSchema.parse(body)

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: validatedData.hotelId },
      select: { id: true, name: true }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Create form with fields in a transaction
    const form = await prisma.$transaction(async (tx) => {
      // Create the form
      const newForm = await tx.form.create({
        data: {
          hotelId: validatedData.hotelId,
          name: validatedData.name,
          description: validatedData.description,
          isActive: true
        }
      })

      // Create form fields
      const fields = await Promise.all(
        validatedData.fields.map(field =>
          tx.formField.create({
            data: {
              formId: newForm.id,
              label: field.label,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder,
              options: field.options || [],
              order: field.order
            }
          })
        )
      )

      return { ...newForm, fields }
    })

    return NextResponse.json({
      message: 'Form created successfully',
      form
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

// PUT - Update any form (Super Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { formId, ...formData } = body
    const validatedData = updateFormSchema.parse(formData)

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const existingForm = await prisma.form.findUnique({
      where: { id: formId },
      include: { hotel: { select: { name: true } } }
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Update form
    const updatedForm = await prisma.form.update({
      where: { id: formId },
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
        },
        hotel: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true
          }
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

// DELETE - Delete any form (Super Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')

    if (!formId) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const existingForm = await prisma.form.findUnique({
      where: { id: formId },
      include: { hotel: { select: { name: true } } }
    })

    if (!existingForm) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Delete form (cascade will delete fields and reviews)
    await prisma.form.delete({
      where: { id: formId }
    })

    return NextResponse.json({
      message: 'Form deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
