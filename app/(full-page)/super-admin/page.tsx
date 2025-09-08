import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SuperAdminStats from '@/components/SuperAdminStats'
import RecentHotels from '@/components/RecentHotels'
import SystemOverview from '@/components/SystemOverview'
import HotelsWithReviews from '@/components/HotelsWithReviews'

const prisma = new PrismaClient()

export default async function SuperAdminDashboard() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch system-wide data
  const [
    totalHotels,
    activeHotels,
    totalUsers,
    totalReviews,
    recentHotels,
    subscriptionStats,
    totalRevenue,
    hotelsWithReviewCounts,
    monthlyRevenue
  ] = await Promise.all([
    prisma.hotel.count(),
    prisma.hotel.count({ where: { isActive: true } }),
    prisma.user.count(),
    prisma.review.count(),
    prisma.hotel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        users: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }),
    prisma.hotel.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true
      }
    }),
    // Calculate total revenue from active subscriptions
    prisma.subscription.aggregate({
      where: { status: 'ACTIVE' },
      _sum: {
        // We'll need to calculate based on plan prices
      }
    }),
    // Get hotels with their review counts
    prisma.hotel.findMany({
      include: {
        _count: {
          select: {
            reviews: true,
            users: true
          }
        },
        subscription: {
          select: {
            plan: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    // Calculate monthly revenue
    prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        plan: true,
        currentPeriodStart: true,
        currentPeriodEnd: true
      }
    })
  ])

  // Calculate total revenue based on subscription plans
  const planPrices = {
    basic: 29,
    premium: 79,
    enterprise: 199
  }

  const totalRevenueAmount = hotelsWithReviewCounts.reduce((total, hotel) => {
    if (hotel.subscription && hotel.subscription.status === 'ACTIVE') {
      const planPrice = planPrices[hotel.subscription.plan as keyof typeof planPrices] || 0
      return total + planPrice
    }
    return total
  }, 0)

  // Calculate monthly revenue
  const currentMonthRevenue = monthlyRevenue.reduce((total, sub) => {
    const planPrice = planPrices[sub.plan as keyof typeof planPrices] || 0
    return total + planPrice
  }, 0)

  const stats = {
    totalHotels,
    activeHotels,
    totalUsers,
    totalReviews,
    inactiveHotels: totalHotels - activeHotels,
    totalRevenue: totalRevenueAmount,
    monthlyRevenue: currentMonthRevenue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          System overview and management panel
        </p>
      </div>

      {/* Stats Cards */}
      <SuperAdminStats stats={stats} />

      {/* System Overview */}
      <SystemOverview subscriptionStats={subscriptionStats} />

      {/* Recent Hotels */}
      <RecentHotels hotels={recentHotels} />

      {/* Hotels with Review Counts */}
      <HotelsWithReviews hotels={hotelsWithReviewCounts} />
    </div>
  )
}
