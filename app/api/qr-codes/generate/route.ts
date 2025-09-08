import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import { z } from 'zod'

const prisma = new PrismaClient()

const generateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  formId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = generateSchema.parse(body)
    
    const hotelId = session.user.hotelId
    if (!hotelId) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 400 }
      )
    }

    // Generate unique URL for the QR code
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const qrUrl = `${baseUrl}/feedback/${session.user.hotel?.slug}`
    
    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // Save QR code to database
    const qrCode = await prisma.qrCode.create({
      data: {
        hotelId: hotelId,
        name: validatedData.name,
        description: validatedData.description,
        url: qrUrl,
        imageUrl: qrCodeImage,
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'QR code generated successfully',
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        url: qrCode.url,
        imageUrl: qrCode.imageUrl
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    
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
