import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: session.user.hotelId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ hotel })

  } catch (error) {
    console.error('Error fetching current hotel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
