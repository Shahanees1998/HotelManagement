import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session || session.user?.role !== 'HOTEL_ADMIN' || session.user?.hotelId !== params.hotelId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { hotelId } = params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get analytics data
    const [
      totalReviews,
      reviewsInPeriod,
      averageRating,
      ratingDistribution,
      reviewsByStatus,
      reviewsByForm,
      monthlyTrends,
      responseRate,
      topForms
    ] = await Promise.all([
      // Total reviews
      prisma.review.count({
        where: { hotelId }
      }),

      // Reviews in period
      prisma.review.count({
        where: {
          hotelId,
          createdAt: { gte: startDate }
        }
      }),

      // Average rating
      prisma.review.aggregate({
        where: {
          hotelId,
          overallRating: { not: null }
        },
        _avg: {
          overallRating: true
        }
      }),

      // Rating distribution
      prisma.review.groupBy({
        by: ['overallRating'],
        where: {
          hotelId,
          overallRating: { not: null }
        },
        _count: {
          overallRating: true
        }
      }),

      // Reviews by status
      prisma.review.groupBy({
        by: ['status'],
        where: { hotelId },
        _count: {
          status: true
        }
      }),

      // Reviews by form
      prisma.review.groupBy({
        by: ['formId'],
        where: { hotelId },
        _count: {
          formId: true
        }
      }),

      // Monthly trends (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "createdAt") as month,
          COUNT(*) as count,
          AVG("overallRating") as avg_rating
        FROM "Review" 
        WHERE "hotelId" = ${hotelId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month ASC
      `,

      // Response rate (reviews with responses)
      prisma.review.count({
        where: {
          hotelId,
          adminNotes: { not: null }
        }
      }),

      // Top forms
      prisma.form.findMany({
        where: { hotelId },
        include: {
          _count: {
            select: { reviews: true }
          }
        },
        orderBy: {
          reviews: { _count: 'desc' }
        },
        take: 5
      })
    ])

    // Calculate response rate percentage
    const responseRatePercentage = totalReviews > 0 
      ? Math.round((responseRate / totalReviews) * 100) 
      : 0

    // Format rating distribution
    const ratingDist = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1
      const count = ratingDistribution.find(r => r.overallRating === rating)?._count.overallRating || 0
      return { rating, count }
    })

    // Format monthly trends
    const monthlyTrendsFormatted = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      // Find matching data from query result
      const monthData = (monthlyTrends as any[]).find(m => 
        m.month.toISOString().startsWith(monthKey)
      )
      
      return {
        month: monthKey,
        count: monthData?.count || 0,
        avgRating: monthData?.avg_rating ? parseFloat(monthData.avg_rating) : 0
      }
    })

    return NextResponse.json({
      overview: {
        totalReviews,
        reviewsInPeriod,
        averageRating: averageRating._avg.overallRating || 0,
        responseRate: responseRatePercentage
      },
      ratingDistribution: ratingDist,
      reviewsByStatus: reviewsByStatus.map(r => ({
        status: r.status,
        count: r._count.status
      })),
      monthlyTrends: monthlyTrendsFormatted,
      topForms: topForms.map(form => ({
        id: form.id,
        name: form.name,
        reviewCount: form._count.reviews
      }))
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
