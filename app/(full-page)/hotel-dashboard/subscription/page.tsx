import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SubscriptionManagement from '@/components/SubscriptionManagement'

const prisma = new PrismaClient()

export default async function SubscriptionPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch hotel subscription data
  const hotelData = await prisma.hotel.findUnique({
    where: { id: session.user.hotelId },
    select: {
      id: true,
      name: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionId: true,
      subscriptionStart: true,
      subscriptionEnd: true,
      subscription: {
        select: {
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          plan: true,
          status: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true
        }
      }
    }
  })

  if (!hotelData) {
    return <div>Hotel not found</div>
  }

  // Transform data to match expected types (convert null to undefined)
  const hotel = {
    ...hotelData,
    subscriptionPlan: hotelData.subscriptionPlan ?? undefined,
    subscriptionId: hotelData.subscriptionId ?? undefined,
    subscriptionStart: hotelData.subscriptionStart?.toISOString(),
    subscriptionEnd: hotelData.subscriptionEnd?.toISOString(),
    subscription: hotelData.subscription ? {
      ...hotelData.subscription,
      stripeSubscriptionId: hotelData.subscription.stripeSubscriptionId ?? '',
      currentPeriodStart: hotelData.subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: hotelData.subscription.currentPeriodEnd.toISOString()
    } : undefined
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Subscription Management Component */}
      <SubscriptionManagement hotel={hotel} />
    </div>
  )
}
