import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const prisma = new PrismaClient()

const createRefundSchema = z.object({
  hotelId: z.string(),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional()
})

// GET - List all refunds
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const hotelId = searchParams.get('hotelId')
    const status = searchParams.get('status')

    const refunds = await prisma.refund.findMany({
      where: {
        ...(hotelId && { hotelId }),
        ...(status && { status })
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            stripeSubscriptionId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ refunds })

  } catch (error) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new refund
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
    const validatedData = createRefundSchema.parse(body)

    // Get hotel and subscription details
    const hotel = await prisma.hotel.findUnique({
      where: { id: validatedData.hotelId },
      include: {
        subscription: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    if (!hotel.subscription) {
      return NextResponse.json(
        { error: 'Hotel has no active subscription' },
        { status: 400 }
      )
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        hotelId: validatedData.hotelId,
        subscriptionId: hotel.subscription.id,
        amount: validatedData.amount,
        reason: validatedData.reason,
        status: 'pending',
        processedBy: session.user.id,
        notes: validatedData.notes
      },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscription: {
          select: {
            id: true,
            plan: true,
            stripeSubscriptionId: true
          }
        }
      }
    })

    // Process refund with Stripe
    try {
      if (hotel.subscription.stripeSubscriptionId) {
        // Get the latest invoice for the subscription
        const invoices = await stripe.invoices.list({
          subscription: hotel.subscription.stripeSubscriptionId,
          limit: 1
        })

        if (invoices.data.length > 0) {
          const latestInvoice = invoices.data[0]
          
          // Create refund in Stripe
          const stripeRefund = await stripe.refunds.create({
            payment_intent: latestInvoice.payment_intent as string,
            amount: Math.round(validatedData.amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              hotelId: validatedData.hotelId,
              refundId: refund.id,
              reason: validatedData.reason
            }
          })

          // Update refund with Stripe ID
          await prisma.refund.update({
            where: { id: refund.id },
            data: {
              stripeRefundId: stripeRefund.id,
              status: stripeRefund.status === 'succeeded' ? 'completed' : 'processing',
              processedAt: new Date()
            }
          })

          // Send notification email to hotel
          try {
            await fetch(`${process.env.APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'REFUND_PROCESSED',
                to: hotel.email,
                subject: `Refund Processed - ${hotel.name}`,
                data: {
                  hotelName: hotel.name,
                  amount: validatedData.amount,
                  reason: validatedData.reason,
                  refundId: refund.id,
                  stripeRefundId: stripeRefund.id
                }
              })
            })
          } catch (emailError) {
            console.error('Error sending refund notification email:', emailError)
          }
        }
      }
    } catch (stripeError) {
      console.error('Stripe refund error:', stripeError)
      
      // Update refund status to failed
      await prisma.refund.update({
        where: { id: refund.id },
        data: {
          status: 'failed',
          notes: `Stripe error: ${stripeError instanceof Error ? stripeError.message : 'Unknown error'}`
        }
      })

      return NextResponse.json(
        { error: 'Failed to process refund with Stripe', details: stripeError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Refund created and processed successfully',
      refund
    })

  } catch (error) {
    console.error('Error creating refund:', error)
    
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
