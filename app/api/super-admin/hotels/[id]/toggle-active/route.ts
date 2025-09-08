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
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = toggleActiveSchema.parse(body)
    const { id } = params

    // Update hotel active status
    const hotel = await prisma.hotel.update({
      where: { id },
      data: { isActive: validatedData.isActive },
      select: {
        id: true,
        name: true,
        isActive: true
      }
    })

    return NextResponse.json({
      message: `Hotel ${validatedData.isActive ? 'activated' : 'deactivated'} successfully`,
      hotel
    })

  } catch (error) {
    console.error('Error toggling hotel active status:', error)
    
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
