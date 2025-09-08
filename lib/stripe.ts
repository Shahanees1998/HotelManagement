import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const STRIPE_CONFIG = {
  plans: {
    basic: {
      name: 'Basic',
      price: 2900, // $29.00 in cents
      interval: 'month',
      features: [
        'Up to 100 reviews/month',
        'QR code generation',
        'Basic analytics',
        'Email support'
      ]
    },
    premium: {
      name: 'Premium',
      price: 7900, // $79.00 in cents
      interval: 'month',
      features: [
        'Up to 500 reviews/month',
        'Custom forms',
        'Advanced analytics',
        'External sharing',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      price: 19900, // $199.00 in cents
      interval: 'month',
      features: [
        'Unlimited reviews',
        'White-label options',
        'Custom integrations',
        'Dedicated support',
        'API access'
      ]
    }
  }
}

export async function createStripeCustomer(hotel: {
  name: string
  email: string
  address: string
  city: string
  state: string
  country: string
  zipCode?: string
}) {
  return await stripe.customers.create({
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
      hotelName: hotel.name,
    },
  })
}

export async function createStripeSubscription(
  customerId: string,
  priceId: string,
  hotelId: string
) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      hotelId,
    },
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  hotelId: string,
  successUrl: string,
  cancelUrl: string
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      hotelId,
    },
  })
}
