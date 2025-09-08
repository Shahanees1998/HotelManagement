import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SuperAdminStats from '@/components/SuperAdminStats'
import RecentHotels from '@/components/RecentHotels'
import SystemOverview from '@/components/SystemOverview'

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
    subscriptionStats
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
    })
  ])

  const stats = {
    totalHotels,
    activeHotels,
    totalUsers,
    totalReviews,
    inactiveHotels: totalHotels - activeHotels
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
    </div>
  )
}
