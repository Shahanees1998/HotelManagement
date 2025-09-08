import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const prisma = new PrismaClient()

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  hotelName: z.string().min(1, 'Hotel name is required'),
  hotelEmail: z.string().email('Invalid hotel email address'),
  hotelPhone: z.string().optional(),
  hotelAddress: z.string().min(1, 'Hotel address is required'),
  hotelCity: z.string().min(1, 'City is required'),
  hotelState: z.string().min(1, 'State is required'),
  hotelCountry: z.string().min(1, 'Country is required'),
  hotelZipCode: z.string().optional(),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Check if hotel email already exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { email: validatedData.hotelEmail }
    })
    
    if (existingHotel) {
      return NextResponse.json(
        { error: 'Hotel with this email already exists' },
        { status: 400 }
      )
    }
    
    // Generate hotel slug
    const hotelSlug = validatedData.hotelName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    // Check if slug already exists
    let finalSlug = hotelSlug
    let counter = 1
    while (await prisma.hotel.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${hotelSlug}-${counter}`
      counter++
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Create hotel and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create hotel
      const hotel = await tx.hotel.create({
        data: {
          name: validatedData.hotelName,
          slug: finalSlug,
          email: validatedData.hotelEmail,
          phone: validatedData.hotelPhone,
          address: validatedData.hotelAddress,
          city: validatedData.hotelCity,
          state: validatedData.hotelState,
          country: validatedData.hotelCountry,
          zipCode: validatedData.hotelZipCode,
          subscriptionPlan: validatedData.subscriptionPlan,
          subscriptionStatus: 'INACTIVE', // Will be activated after payment
        }
      })
      
      // Create user
      const user = await tx.user.create({
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: hashedPassword,
          role: 'HOTEL_ADMIN',
          hotelId: hotel.id,
        }
      })
      
      // Create default form for the hotel
      await tx.form.create({
        data: {
          hotelId: hotel.id,
          name: 'Default Feedback Form',
          description: 'Standard guest feedback form',
          isDefault: true,
          isActive: true,
          fields: {
            create: [
              {
                label: 'Overall Rating',
                type: 'RATING',
                required: true,
                order: 1,
              },
              {
                label: 'How was your stay?',
                type: 'TEXTAREA',
                required: true,
                placeholder: 'Tell us about your experience...',
                order: 2,
              },
              {
                label: 'What did you like most?',
                type: 'TEXT',
                required: false,
                placeholder: 'Your favorite aspects...',
                order: 3,
              },
              {
                label: 'What could we improve?',
                type: 'TEXT',
                required: false,
                placeholder: 'Suggestions for improvement...',
                order: 4,
              },
              {
                label: 'Would you recommend us?',
                type: 'SINGLE_CHOICE',
                required: true,
                options: ['Yes', 'No', 'Maybe'],
                order: 5,
              },
            ]
          }
        }
      })
      
      return { hotel, user }
    })
    
    // Send welcome email
    try {
      const { sendEmail, emailTemplates } = await import('@/lib/email')
      const emailTemplate = emailTemplates.welcome(
        result.hotel.name,
        `${result.user.firstName} ${result.user.lastName}`
      )
      
      await sendEmail({
        to: result.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails
    }
    
    return NextResponse.json({
      message: 'Registration successful',
      hotel: {
        id: result.hotel.id,
        name: result.hotel.name,
        slug: result.hotel.slug,
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
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
