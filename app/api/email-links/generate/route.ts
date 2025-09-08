import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const generateEmailLinkSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  email: z.string().email('Valid email is required'),
  subject: z.string().optional(),
  message: z.string().optional()
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
    const validatedData = generateEmailLinkSchema.parse(body)
    
    const hotelId = session.user.hotelId
    if (!hotelId) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 400 }
      )
    }

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: { slug: true, name: true }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Generate email link
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const feedbackUrl = `${baseUrl}/feedback/${hotel.slug}`
    
    // Create email template
    const emailSubject = validatedData.subject || `Feedback Request - ${hotel.name}`
    const emailMessage = validatedData.message || 
      `Dear Guest,\n\nWe hope you enjoyed your stay at ${hotel.name}!\n\nWe would love to hear about your experience. Please take a moment to share your feedback with us:\n\n${feedbackUrl}\n\nYour feedback helps us improve our services and helps other travelers discover our wonderful property.\n\nThank you for choosing ${hotel.name}!\n\nBest regards,\nThe ${hotel.name} Team`

    // Generate mailto link
    const mailtoLink = `mailto:${validatedData.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`

    return NextResponse.json({
      message: 'Email link generated successfully',
      emailLink: {
        name: validatedData.name,
        email: validatedData.email,
        subject: emailSubject,
        message: emailMessage,
        mailtoLink: mailtoLink,
        feedbackUrl: feedbackUrl
      }
    })

  } catch (error) {
    console.error('Error generating email link:', error)
    
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
