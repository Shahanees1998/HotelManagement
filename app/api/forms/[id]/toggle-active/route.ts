import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const toggleActiveSchema = z.object({
  isActive: z.boolean()
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
    const validatedData = toggleActiveSchema.parse(body)
    const { id } = params

    // Verify form belongs to hotel
    const form = await prisma.form.findFirst({
      where: {
        id,
        hotelId: session.user.hotelId
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Update form active status
    const updatedForm = await prisma.form.update({
      where: { id },
      data: { isActive: validatedData.isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })

    return NextResponse.json({
      message: `Form ${validatedData.isActive ? 'activated' : 'deactivated'} successfully`,
      form: updatedForm
    })

  } catch (error) {
    console.error('Error toggling form active status:', error)
    
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
