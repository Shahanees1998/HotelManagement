import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createCheckoutSession, stripe } from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const createCheckoutSchema = z.object({
  plan: z.enum(['basic', 'premium', 'enterprise'])
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
    const validatedData = createCheckoutSchema.parse(body)
    
    const hotel = await prisma.hotel.findUnique({
      where: { id: session.user.hotelId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        city: true,
        state: true,
        country: true,
        zipCode: true,
        subscriptionId: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Check if hotel already has an active subscription
    if (hotel.subscriptionId) {
      return NextResponse.json(
        { error: 'Hotel already has an active subscription' },
        { status: 400 }
      )
    }

    // Create Stripe customer if not exists
    let customerId: string
    try {
      const customer = await prisma.subscription.findFirst({
        where: { hotelId: hotel.id },
        select: { stripeCustomerId: true }
      })

      if (customer?.stripeCustomerId) {
        customerId = customer.stripeCustomerId
      } else {
        const stripeCustomer = await stripe.customers.create({
          name: hotel.name,
          email: hotel.email,
          address: {
            line1: hotel.address,
            city: hotel.city,
            state: hotel.state,
            country: hotel.country,
            postal_code: hotel.zipCode,
          },
          metadata: {
            hotelId: hotel.id,
          },
        })
        customerId = stripeCustomer.id
      }
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    // Create checkout session
    const checkoutSession = await createCheckoutSession(
      customerId,
      getPriceId(validatedData.plan),
      hotel.id,
      `${process.env.APP_URL}/hotel-dashboard?payment=success`,
      `${process.env.APP_URL}/hotel-dashboard?payment=cancelled`
    )

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    
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

function getPriceId(plan: string): string {
  // In production, you would use actual Stripe price IDs
  // For now, we'll use placeholder IDs
  const priceIds = {
    basic: 'price_basic_monthly',
    premium: 'price_premium_monthly',
    enterprise: 'price_enterprise_monthly'
  }
  
  return priceIds[plan as keyof typeof priceIds]
}
