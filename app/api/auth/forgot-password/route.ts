import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendEmail, emailTemplates } from '@/lib/email'
import { z } from 'zod'
import crypto from 'crypto'

const prisma = new PrismaClient()

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with that email exists, we have sent a password reset link.'
      })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // We'll need to add these fields to the User model
        resetToken: resetToken,
        resetTokenExpiry: resetTokenExpiry
      }
    })

    // Generate reset link
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

    // Send reset email
    const emailTemplate = emailTemplates.forgotPassword(
      `${user.firstName} ${user.lastName}`,
      resetLink
    )

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    })

    return NextResponse.json({
      message: 'If an account with that email exists, we have sent a password reset link.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    
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
