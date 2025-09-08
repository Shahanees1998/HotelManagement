import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/lib/email'
import { z } from 'zod'

const prisma = new PrismaClient()

const respondSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  response: z.string().min(1, 'Response is required'),
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed'])
})

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
    const validatedData = respondSchema.parse(body)

    // Get the contact form
    const contactForm = await prisma.supportMessage.findUnique({
      where: { id: validatedData.messageId },
      include: {
        hotel: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!contactForm) {
      return NextResponse.json(
        { error: 'Contact form not found' },
        { status: 404 }
      )
    }

    // Update the contact form with admin response
    const updatedForm = await prisma.supportMessage.update({
      where: { id: validatedData.messageId },
      data: {
        adminResponse: validatedData.response,
        status: validatedData.status,
        adminId: session.user.id,
        respondedAt: new Date()
      }
    })

    // Send response email to hotel
    try {
      const responseEmailTemplate = {
        subject: `Response to your inquiry: ${contactForm.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 2rem; text-align: center;">
              <h1 style="margin: 0; font-size: 2rem;">Response to Your Inquiry</h1>
            </div>
            <div style="padding: 2rem; background: white;">
              <h2 style="color: #1F2937;">Hello ${contactForm.hotelName} Team,</h2>
              <p style="color: #6B7280; line-height: 1.6;">
                Thank you for contacting us. Here is our response to your inquiry:
              </p>
              <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                <p style="color: #1F2937; margin: 0; font-weight: bold;">Original Subject:</p>
                <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${contactForm.subject}</p>
              </div>
              <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                <p style="color: #1F2937; margin: 0; font-weight: bold;">Our Response:</p>
                <p style="color: #6B7280; margin: 0.5rem 0 0 0; white-space: pre-wrap;">${validatedData.response}</p>
              </div>
              <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
                <p style="color: #1F2937; margin: 0; font-weight: bold;">Status:</p>
                <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${validatedData.status.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div style="text-align: center; margin: 2rem 0;">
                <a href="${process.env.APP_URL}/hotel-dashboard/contact" 
                   style="background: #3B82F6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
                  View Contact Forms
                </a>
              </div>
              <p style="color: #6B7280; line-height: 1.6;">
                If you have any further questions, please don't hesitate to contact us.
              </p>
              <p style="color: #6B7280; line-height: 1.6;">
                Best regards,<br>
                The Hotel Feedback SaaS Support Team
              </p>
            </div>
          </div>
        `
      }

      await sendEmail({
        to: contactForm.hotelEmail,
        subject: responseEmailTemplate.subject,
        html: responseEmailTemplate.html
      })
    } catch (emailError) {
      console.error('Failed to send response email:', emailError)
      // Don't fail the response if email fails
    }

    return NextResponse.json({
      message: 'Response sent successfully',
      contactForm: updatedForm
    })

  } catch (error) {
    console.error('Error responding to contact form:', error)
    
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
