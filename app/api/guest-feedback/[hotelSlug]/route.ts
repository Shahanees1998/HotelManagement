import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelSlug: string } }
) {
  try {
    const { hotelSlug } = params

    // Find hotel by slug
    const hotel = await prisma.hotel.findUnique({
      where: { slug: hotelSlug },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        logo: true,
        isActive: true
      }
    })

    if (!hotel || !hotel.isActive) {
      return NextResponse.json(
        { error: 'Hotel not found or inactive' },
        { status: 404 }
      )
    }

    // Find active form for the hotel
    const form = await prisma.form.findFirst({
      where: {
        hotelId: hotel.id,
        isActive: true
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'No active form found for this hotel' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      hotel,
      form: {
        id: form.id,
        name: form.name,
        description: form.description,
        fields: form.fields.map(field => ({
          id: field.id,
          label: field.label,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder,
          options: field.options,
          order: field.order
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching guest feedback form:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
