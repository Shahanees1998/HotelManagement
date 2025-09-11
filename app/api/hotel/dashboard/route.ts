import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel data
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        include: {
          reviews: {
            select: {
              id: true,
              overallRating: true,
              submittedAt: true,
              status: true,
            },
            orderBy: { submittedAt: 'desc' },
            take: 10,
          },
          feedbackForms: {
            select: {
              id: true,
              title: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          qrCodes: {
            select: {
              id: true,
              scanCount: true,
              isActive: true,
            },
          },
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Calculate dashboard stats
      const totalReviews = hotel.reviews.length;
      const averageRating = totalReviews > 0 
        ? hotel.reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews 
        : 0;
      
      const positiveReviews = hotel.reviews.filter(review => review.overallRating >= 4).length;
      const negativeReviews = hotel.reviews.filter(review => review.overallRating <= 2).length;
      
      // Calculate response rate (reviews with responses)
      const reviewsWithResponses = hotel.reviews.filter(review => review.status === 'APPROVED').length;
      const responseRate = totalReviews > 0 ? (reviewsWithResponses / totalReviews) * 100 : 0;

      // Recent reviews (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentReviews = hotel.reviews.filter(review => 
        new Date(review.submittedAt) >= sevenDaysAgo
      ).length;

      // Generate chart data (last 6 months)
      const chartData = await generateChartData(hotel.id);

      const dashboardData = {
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          positiveReviews,
          negativeReviews,
          responseRate: Math.round(responseRate * 10) / 10,
          recentReviews,
        },
        recentReviews: hotel.reviews.slice(0, 5).map(review => ({
          id: review.id,
          overallRating: review.overallRating,
          submittedAt: review.submittedAt.toISOString(),
          status: review.status,
        })),
        chartData,
        totalForms: hotel.feedbackForms.length,
        activeForms: hotel.feedbackForms.filter(form => form.isActive).length,
        totalQRCodes: hotel.qrCodes.length,
        activeQRCodes: hotel.qrCodes.filter(qr => qr.isActive).length,
        totalScans: hotel.qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0),
      };

      return NextResponse.json({ data: dashboardData });
    } catch (error) {
      console.error('Error fetching hotel dashboard data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }
  });
}

async function generateChartData(hotelId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const reviews = await prisma.review.findMany({
    where: {
      hotelId,
      submittedAt: {
        gte: sixMonthsAgo,
      },
    },
    select: {
      overallRating: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: 'asc' },
  });

  // Group by month
  const monthlyData: { [key: string]: { reviews: number; ratings: number[] } } = {};
  
  reviews.forEach(review => {
    const month = review.submittedAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { reviews: 0, ratings: [] };
    }
    monthlyData[month].reviews++;
    monthlyData[month].ratings.push(review.overallRating);
  });

  // Generate labels for last 6 months
  const labels: string[] = [];
  const reviewCounts: number[] = [];
  const avgRatings: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = date.toISOString().substring(0, 7);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    labels.push(monthName);
    
    if (monthlyData[monthKey]) {
      reviewCounts.push(monthlyData[monthKey].reviews);
      const avgRating = monthlyData[monthKey].ratings.reduce((sum, rating) => sum + rating, 0) / monthlyData[monthKey].ratings.length;
      avgRatings.push(Math.round(avgRating * 10) / 10);
    } else {
      reviewCounts.push(0);
      avgRatings.push(0);
    }
  }

  return {
    labels,
    datasets: [
      {
        label: 'Reviews',
        data: reviewCounts,
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Average Rating',
        data: avgRatings,
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };
}
