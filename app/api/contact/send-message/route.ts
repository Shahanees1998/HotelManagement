import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const sendMessageSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  category: z.string().min(1, 'Category is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  hotelId: z.string(),
  hotelName: z.string(),
  hotelEmail: z.string().email(),
  hotelPhone: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = sendMessageSchema.parse(body)

    // Verify hotel belongs to user
    if (validatedData.hotelId !== session.user.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create support message
    const supportMessage = await prisma.supportMessage.create({
      data: {
        hotelId: validatedData.hotelId,
        subject: validatedData.subject,
        category: validatedData.category,
        message: validatedData.message,
        priority: validatedData.priority,
        status: 'PENDING',
        hotelName: validatedData.hotelName,
        hotelEmail: validatedData.hotelEmail,
        hotelPhone: validatedData.hotelPhone
      }
    })

    // Send email notifications
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email')
      
      // Send email to hotel admin
      const hotelEmailTemplate = emailTemplates.contactFormSubmission(
        validatedData.hotelName,
        validatedData.subject,
        validatedData.message,
        validatedData.hotelEmail
      )

      await sendEmail({
        to: validatedData.hotelEmail,
        subject: hotelEmailTemplate.subject,
        html: hotelEmailTemplate.html
      })

      // Send email to super admin
      const superAdminEmailTemplate = emailTemplates.superAdminContactForm(
        validatedData.hotelName,
        validatedData.subject,
        validatedData.message,
        validatedData.hotelEmail,
        validatedData.hotelEmail
      )

      await sendEmail({
        to: process.env.SUPER_ADMIN_EMAIL || 'admin@hotelfeedback.com',
        subject: superAdminEmailTemplate.subject,
        html: superAdminEmailTemplate.html
      })

      // Create notification for super admin
      const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true }
      })

      if (superAdmin) {
        await prisma.notification.create({
          data: {
            userId: superAdmin.id,
            title: 'New Contact Form Submission',
            message: `${validatedData.hotelName} submitted a contact form`,
            type: validatedData.priority === 'urgent' ? 'error' : 'info',
            data: {
              hotelName: validatedData.hotelName,
              subject: validatedData.subject,
              category: validatedData.category,
              priority: validatedData.priority,
              messageId: supportMessage.id
            }
          }
        })

        // Trigger real-time notification for super admin
        const { triggerNotification, CHANNELS, EVENTS } = await import('@/lib/pusher')
        await triggerNotification(
          CHANNELS.SUPER_ADMIN_NOTIFICATIONS,
          EVENTS.NEW_CONTACT_FORM,
          {
            messageId: supportMessage.id,
            hotelName: validatedData.hotelName,
            subject: validatedData.subject,
            category: validatedData.category,
            priority: validatedData.priority,
            timestamp: new Date().toISOString()
          }
        )
      }
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError)
    }

    return NextResponse.json({
      message: 'Support message sent successfully',
      messageId: supportMessage.id
    })

  } catch (error) {
    console.error('Error sending support message:', error)
    
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
