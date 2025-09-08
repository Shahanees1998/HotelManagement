import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createSuspensionSchema = z.object({
  hotelId: z.string(),
  reason: z.string().min(1, 'Reason is required'),
  type: z.enum(['temporary', 'permanent', 'payment_issue', 'violation', 'other']),
  duration: z.number().optional(), // Duration in days for temporary suspensions
  notes: z.string().optional()
})

const liftSuspensionSchema = z.object({
  reason: z.string().min(1, 'Reason for lifting suspension is required'),
  notes: z.string().optional()
})

// GET - List all suspensions
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
    const status = searchParams.get('status')

    const suspensions = await prisma.hotelSuspension.findMany({
      where: {
        ...(hotelId && { hotelId }),
        ...(status && { status })
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ suspensions })

  } catch (error) {
    console.error('Error fetching suspensions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new suspension
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
    const validatedData = createSuspensionSchema.parse(body)

    // Get hotel details
    const hotel = await prisma.hotel.findUnique({
      where: { id: validatedData.hotelId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Check if hotel is already suspended
    const activeSuspension = await prisma.hotelSuspension.findFirst({
      where: {
        hotelId: validatedData.hotelId,
        status: 'active'
      }
    })

    if (activeSuspension) {
      return NextResponse.json(
        { error: 'Hotel is already suspended' },
        { status: 400 }
      )
    }

    // Calculate expiration date for temporary suspensions
    let expiresAt: Date | undefined
    if (validatedData.type === 'temporary' && validatedData.duration) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + validatedData.duration)
    }

    // Create suspension record
    const suspension = await prisma.hotelSuspension.create({
      data: {
        hotelId: validatedData.hotelId,
        reason: validatedData.reason,
        type: validatedData.type,
        status: 'active',
        duration: validatedData.duration,
        suspendedBy: session.user.id,
        expiresAt,
        notes: validatedData.notes
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        }
      }
    })

    // Deactivate hotel
    await prisma.hotel.update({
      where: { id: validatedData.hotelId },
      data: { isActive: false }
    })

    // Send notification email to hotel
    try {
      await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'HOTEL_SUSPENDED',
          to: hotel.email,
          subject: `Account Suspended - ${hotel.name}`,
          data: {
            hotelName: hotel.name,
            reason: validatedData.reason,
            type: validatedData.type,
            duration: validatedData.duration,
            expiresAt: expiresAt?.toISOString(),
            suspensionId: suspension.id
          }
        })
      })
    } catch (emailError) {
      console.error('Error sending suspension notification email:', emailError)
    }

    return NextResponse.json({
      message: 'Hotel suspended successfully',
      suspension
    })

  } catch (error) {
    console.error('Error creating suspension:', error)
    
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

// PUT - Lift suspension
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
    const { suspensionId, ...liftData } = body
    const validatedData = liftSuspensionSchema.parse(liftData)

    if (!suspensionId) {
      return NextResponse.json(
        { error: 'Suspension ID is required' },
        { status: 400 }
      )
    }

    // Get suspension details
    const suspension = await prisma.hotelSuspension.findUnique({
      where: { id: suspensionId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!suspension) {
      return NextResponse.json(
        { error: 'Suspension not found' },
        { status: 404 }
      )
    }

    if (suspension.status !== 'active') {
      return NextResponse.json(
        { error: 'Suspension is not active' },
        { status: 400 }
      )
    }

    // Update suspension status
    const updatedSuspension = await prisma.hotelSuspension.update({
      where: { id: suspensionId },
      data: {
        status: 'lifted',
        liftedAt: new Date(),
        liftedBy: session.user.id,
        notes: validatedData.notes
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Reactivate hotel
    await prisma.hotel.update({
      where: { id: suspension.hotelId },
      data: { isActive: true }
    })

    // Send notification email to hotel
    try {
      await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'HOTEL_UNSUSPENDED',
          to: suspension.hotel.email,
          subject: `Account Reactivated - ${suspension.hotel.name}`,
          data: {
            hotelName: suspension.hotel.name,
            reason: validatedData.reason,
            suspensionId: suspension.id
          }
        })
      })
    } catch (emailError) {
      console.error('Error sending unsuspension notification email:', emailError)
    }

    return NextResponse.json({
      message: 'Suspension lifted successfully',
      suspension: updatedSuspension
    })

  } catch (error) {
    console.error('Error lifting suspension:', error)
    
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
