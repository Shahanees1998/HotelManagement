import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SHARED_EXTERNALLY'])
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
    const validatedData = updateStatusSchema.parse(body)
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

    // Update review status
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { 
        status: validatedData.status,
        adminId: session.user.id
      },
      select: {
        id: true,
        status: true,
        guestName: true
      }
    })

    return NextResponse.json({
      message: 'Review status updated successfully',
      review: updatedReview
    })

  } catch (error) {
    console.error('Error updating review status:', error)
    
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
