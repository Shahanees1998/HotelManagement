import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

const prisma = new PrismaClient()

export default async function AnalyticsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch basic analytics data
  const [
    totalReviews,
    averageRating,
    reviewsThisMonth,
    reviewsLastMonth
  ] = await Promise.all([
    prisma.review.count({
      where: { hotelId: session.user.hotelId }
    }),
    prisma.review.aggregate({
      where: {
        hotelId: session.user.hotelId,
        overallRating: { not: null }
      },
      _avg: {
        overallRating: true
      }
    }),
    prisma.review.count({
      where: {
        hotelId: session.user.hotelId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    }),
    prisma.review.count({
      where: {
        hotelId: session.user.hotelId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })
  ])

  const analyticsData = {
    totalReviews,
    averageRating: averageRating._avg.overallRating || 0,
    reviewsThisMonth,
    reviewsLastMonth,
    monthOverMonthGrowth: reviewsLastMonth > 0 
      ? Math.round(((reviewsThisMonth - reviewsLastMonth) / reviewsLastMonth) * 100)
      : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">
          Track your guest feedback performance and insights
        </p>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard initialData={analyticsData} hotelId={session.user.hotelId} />
    </div>
  )
}
