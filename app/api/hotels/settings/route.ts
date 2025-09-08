import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const updateSettingsSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  googleReviewUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  zipCode: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Primary color must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Secondary color must be a valid hex color'),
  allowExternalSharing: z.boolean(),
  autoApproveReviews: z.boolean()
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Check if email is already taken by another hotel
    const existingHotel = await prisma.hotel.findFirst({
      where: {
        email: validatedData.email,
        id: { not: session.user.hotelId }
      }
    })

    if (existingHotel) {
      return NextResponse.json(
        { error: 'Email is already taken by another hotel' },
        { status: 400 }
      )
    }

    // Update hotel settings
    const updatedHotel = await prisma.hotel.update({
      where: { id: session.user.hotelId },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        googleReviewUrl: validatedData.googleReviewUrl || null,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        zipCode: validatedData.zipCode || null,
        description: validatedData.description || null,
        logo: validatedData.logo || null,
        primaryColor: validatedData.primaryColor,
        secondaryColor: validatedData.secondaryColor,
        allowExternalSharing: validatedData.allowExternalSharing,
        autoApproveReviews: validatedData.autoApproveReviews
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        googleReviewUrl: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        description: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        allowExternalSharing: true,
        autoApproveReviews: true
      }
    })

    return NextResponse.json({
      message: 'Hotel settings updated successfully',
      hotel: updatedHotel
    })

  } catch (error) {
    console.error('Error updating hotel settings:', error)
    
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
