import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import DashboardStats from '@/components/DashboardStats'
import RecentReviews from '@/components/RecentReviews'
import QuickActions from '@/components/QuickActions'

const prisma = new PrismaClient()

export default async function HotelDashboard() {
  const session = await getServerSession()
  
  if (!session?.user?.hotelId) {
    return <div>No hotel found</div>
  }

  // Fetch dashboard data
  const [
    totalReviews,
    pendingReviews,
    approvedReviews,
    recentReviews,
    qrCodes
  ] = await Promise.all([
    prisma.review.count({
      where: { hotelId: session.user.hotelId }
    }),
    prisma.review.count({
      where: { 
        hotelId: session.user.hotelId,
        status: 'PENDING'
      }
    }),
    prisma.review.count({
      where: { 
        hotelId: session.user.hotelId,
        status: 'APPROVED'
      }
    }),
    prisma.review.findMany({
      where: { hotelId: session.user.hotelId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        form: true
      }
    }),
    prisma.qrCode.findMany({
      where: { 
        hotelId: session.user.hotelId,
        isActive: true
      }
    })
  ])

  const stats = {
    totalReviews,
    pendingReviews,
    approvedReviews,
    averageRating: 4.2, // TODO: Calculate from reviews
    responseRate: 78 // TODO: Calculate from reviews
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening with your guest feedback.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Quick Actions */}
      <QuickActions qrCodes={qrCodes} />

      {/* Recent Reviews */}
      <RecentReviews reviews={recentReviews} />

      {/* Additional sections can be added here */}
    </div>
  )
}
