import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const submitSchema = z.object({
  formId: z.string(),
  responses: z.record(z.any())
})

export async function POST(
  request: NextRequest,
  { params }: { params: { hotelSlug: string } }
) {
  try {
    const { hotelSlug } = params
    const body = await request.json()
    
    // Validate input
    const validatedData = submitSchema.parse(body)
    
    // Find hotel by slug
    const hotel = await prisma.hotel.findUnique({
      where: { slug: hotelSlug },
      select: { id: true, isActive: true }
    })

    if (!hotel || !hotel.isActive) {
      return NextResponse.json(
        { error: 'Hotel not found or inactive' },
        { status: 404 }
      )
    }

    // Verify form belongs to hotel
    const form = await prisma.form.findFirst({
      where: {
        id: validatedData.formId,
        hotelId: hotel.id,
        isActive: true
      },
      include: {
        fields: true
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found or inactive' },
        { status: 404 }
      )
    }

    // Extract guest information if provided
    const guestName = validatedData.responses[form.fields.find(f => f.label.toLowerCase().includes('name'))?.id || '']
    const guestEmail = validatedData.responses[form.fields.find(f => f.type === 'EMAIL')?.id || '']
    const guestPhone = validatedData.responses[form.fields.find(f => f.label.toLowerCase().includes('phone'))?.id || '']
    
    // Calculate overall rating if rating field exists
    const ratingField = form.fields.find(f => f.type === 'RATING')
    const overallRating = ratingField ? validatedData.responses[ratingField.id] : null

    // Determine review status based on rating
    let status = 'PENDING'
    if (overallRating && overallRating >= 4) {
      status = 'APPROVED' // High ratings are approved for potential external sharing
    } else if (overallRating && overallRating <= 2) {
      status = 'PENDING' // Low ratings stay private for internal review
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        hotelId: hotel.id,
        formId: form.id,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        responses: validatedData.responses,
        overallRating: overallRating || null,
        status: status as any
      }
    })

    // Update QR code scan count if accessed via QR code
    const referer = request.headers.get('referer')
    if (referer && referer.includes('qr')) {
      // TODO: Update QR code scan count
    }

    // Send notification email for new review
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email')
      const emailTemplate = emailTemplates.newReview(
        hotel.name,
        guestName || 'Anonymous Guest',
        overallRating || 0
      )
      
      // Get hotel admin email
      const hotelAdmin = await prisma.user.findFirst({
        where: { hotelId: hotel.id, role: 'HOTEL_ADMIN' },
        select: { email: true, id: true }
      })
      
      if (hotelAdmin) {
        await sendEmail({
          to: hotelAdmin.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html
        })

        // Create dashboard notification
        await prisma.notification.create({
          data: {
            userId: hotelAdmin.id,
            title: 'New Guest Review',
            message: `${guestName || 'Anonymous Guest'} left a ${overallRating || 0}-star review`,
            type: overallRating && overallRating >= 4 ? 'success' : 'info',
            data: {
              reviewId: review.id,
              rating: overallRating,
              guestName: guestName || 'Anonymous Guest'
            }
          }
        })
      }
    } catch (emailError) {
      console.error('Failed to send review notification email:', emailError)
      // Don't fail review submission if email fails
    }

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      reviewId: review.id,
      status: review.status,
      overallRating: review.overallRating
    })

  } catch (error) {
    console.error('Error submitting feedback:', error)
    
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
