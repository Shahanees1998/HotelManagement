import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || session.user?.hotelId !== params.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get unread notifications for the hotel
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || session.user?.hotelId !== params.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { notificationIds } = await request.json()

    // Mark notifications as read
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id
      },
      data: { isRead: true }
    })

    return NextResponse.json({ message: 'Notifications marked as read' })

  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
