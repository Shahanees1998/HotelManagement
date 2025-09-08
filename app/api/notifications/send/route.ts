import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/lib/email'
import { z } from 'zod'

const prisma = new PrismaClient()

const sendNotificationSchema = z.object({
  type: z.enum(['welcome', 'newReview', 'subscriptionActivated', 'subscriptionCancelled']),
  hotelId: z.string(),
  data: z.record(z.any())
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Allow super admin or hotel admin to send notifications
    if (!session || !['SUPER_ADMIN', 'HOTEL_ADMIN'].includes(session.user?.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = sendNotificationSchema.parse(body)
    
    // Get hotel and admin details
    const hotel = await prisma.hotel.findUnique({
      where: { id: validatedData.hotelId },
      include: {
        users: {
          where: { role: 'HOTEL_ADMIN' },
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    const admin = hotel.users[0]
    if (!admin) {
      return NextResponse.json(
        { error: 'No admin found for hotel' },
        { status: 404 }
      )
    }

    // Generate email based on type
    let emailTemplate
    switch (validatedData.type) {
      case 'welcome':
        emailTemplate = emailTemplates.welcome(
          hotel.name,
          `${admin.firstName} ${admin.lastName}`
        )
        break
      
      case 'newReview':
        emailTemplate = emailTemplates.newReview(
          hotel.name,
          validatedData.data.guestName,
          validatedData.data.rating
        )
        break
      
      case 'subscriptionActivated':
        emailTemplate = emailTemplates.subscriptionActivated(
          hotel.name,
          validatedData.data.plan
        )
        break
      
      case 'subscriptionCancelled':
        emailTemplate = emailTemplates.subscriptionCancelled(hotel.name)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    // Send email
    const result = await sendEmail({
      to: admin.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    })

    if (result.success) {
      // Create notification record
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: emailTemplate.subject,
          message: `Email sent to ${admin.email}`,
          type: 'info',
          data: {
            emailSent: true,
            messageId: result.messageId,
            notificationType: validatedData.type
          }
        }
      })

      return NextResponse.json({
        message: 'Notification sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error sending notification:', error)
    
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
