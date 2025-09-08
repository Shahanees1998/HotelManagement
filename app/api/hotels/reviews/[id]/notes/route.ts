import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updateNotesSchema = z.object({
  adminNotes: z.string().optional()
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
    const validatedData = updateNotesSchema.parse(body)
    const { id } = params

    // Verify review belongs to hotel
    const review = await prisma.review.findFirst({
      where: {
        id,
        hotelId: session.user.hotelId
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update admin notes
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { 
        adminNotes: validatedData.adminNotes,
        adminId: session.user.id
      },
      select: {
        id: true,
        adminNotes: true
      }
    })

    return NextResponse.json({
      message: 'Admin notes updated successfully',
      review: updatedReview
    })

  } catch (error) {
    console.error('Error updating admin notes:', error)
    
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
