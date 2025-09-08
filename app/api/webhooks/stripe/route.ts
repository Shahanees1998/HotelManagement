import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const hotelId = subscription.metadata.hotelId
  
  if (!hotelId) {
    console.error('No hotelId in subscription metadata')
    return
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionId: subscription.id,
      subscriptionStart: new Date(subscription.current_period_start * 1000),
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  // Create subscription record
  await prisma.subscription.create({
    data: {
      hotelId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      plan: subscription.items.data[0].price.nickname || 'premium',
      status: 'ACTIVE',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Subscription created for hotel ${hotelId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const hotelId = subscription.metadata.hotelId
  
  if (!hotelId) {
    console.error('No hotelId in subscription metadata')
    return
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      subscriptionStatus: subscription.status.toUpperCase() as any,
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })

  console.log(`Subscription updated for hotel ${hotelId}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const hotelId = subscription.metadata.hotelId
  
  if (!hotelId) {
    console.error('No hotelId in subscription metadata')
    return
  }

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      subscriptionStatus: 'CANCELLED',
    },
  })

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELLED',
    },
  })

  console.log(`Subscription cancelled for hotel ${hotelId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    const hotelId = subscription.metadata.hotelId

    if (hotelId) {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: {
          subscriptionStatus: 'ACTIVE',
        },
      })
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string
    )
    const hotelId = subscription.metadata.hotelId

    if (hotelId) {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: {
          subscriptionStatus: 'PAST_DUE',
        },
      })
    }
  }
}
