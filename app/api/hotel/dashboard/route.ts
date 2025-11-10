import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

// Helper function to get rate-us rating from predefined answers
function getRateUsRating(predefinedAnswers: string | null): number | null {
  if (!predefinedAnswers) return null;
  
  try {
    const parsed = JSON.parse(predefinedAnswers);
    return parsed['rate-us'] || null;
  } catch {
    return null;
  }
}

// Helper function to get effective rating (rate-us or overall)
function getEffectiveRating(review: any): number {
  const rateUsRating = getRateUsRating(review.predefinedAnswers);
  return rateUsRating !== null ? rateUsRating : review.overallRating;
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const searchParams = request.nextUrl.searchParams;
      const startDate = parseDateParam(searchParams.get('startDate'));
      const endDate = parseDateParam(searchParams.get('endDate'));
      const dateRange: DateRange = { startDate, endDate };

      // Get hotel data
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        include: {
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

      const submittedAtFilter: Record<string, Date> = {};
      if (startDate) {
        submittedAtFilter.gte = startDate;
      }
      if (endDate) {
        submittedAtFilter.lte = endDate;
      }

      const reviewWhereClause = {
        hotelId: hotel.id,
        ...(startDate || endDate ? { submittedAt: submittedAtFilter } : {}),
      };

      const reviews = await prisma.review.findMany({
        where: reviewWhereClause,
        select: {
          id: true,
          guestName: true,
          guestEmail: true,
          overallRating: true,
          predefinedAnswers: true,
          submittedAt: true,
          status: true,
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Calculate dashboard stats
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + getEffectiveRating(review), 0) / totalReviews 
        : 0;
      
      const positiveReviews = reviews.filter(review => getEffectiveRating(review) >= 4).length;
      const negativeReviews = reviews.filter(review => getEffectiveRating(review) <= 2).length;
      
      // Calculate response rate (reviews with responses)
      const reviewsWithResponses = reviews.filter(review => review.status === 'APPROVED').length;
      const responseRate = totalReviews > 0 ? (reviewsWithResponses / totalReviews) * 100 : 0;

      // Recent reviews (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentReviewsCount = reviews.filter(review => 
        new Date(review.submittedAt) >= sevenDaysAgo
      ).length;

      // Generate chart data (respecting filters)
      const chartData = await generateChartData(hotel.id, dateRange);

      const dashboardData = {
        stats: {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          positiveReviews,
          negativeReviews,
          responseRate: Math.round(responseRate * 10) / 10,
          recentReviews: recentReviewsCount,
        },
        recentReviews: reviews.slice(0, 5).map(review => ({
          id: review.id,
          guestName: review.guestName,
          guestEmail: review.guestEmail,
          overallRating: getEffectiveRating(review),
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

async function generateChartData(hotelId: string, dateRange: DateRange) {
  const now = new Date();
  const defaultStart = new Date();
  defaultStart.setMonth(defaultStart.getMonth() - 6);

  let rangeStart = dateRange.startDate ? new Date(dateRange.startDate) : defaultStart;
  let rangeEnd = dateRange.endDate ? new Date(dateRange.endDate) : now;

  if (rangeStart > rangeEnd) {
    const temp = rangeStart;
    rangeStart = rangeEnd;
    rangeEnd = temp;
  }

  const submittedAt: Record<string, Date> = {};
  if (rangeStart) {
    submittedAt.gte = rangeStart;
  }
  if (rangeEnd) {
    submittedAt.lte = rangeEnd;
  }

  const reviews = await prisma.review.findMany({
    where: {
      hotelId,
      submittedAt,
    },
    select: {
      overallRating: true,
      predefinedAnswers: true,
      submittedAt: true,
    },
    orderBy: { submittedAt: 'asc' },
  });

  const monthlyData: { [key: string]: { reviews: number; ratings: number[] } } = {};
  
  reviews.forEach(review => {
    const month = review.submittedAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { reviews: 0, ratings: [] };
    }
    monthlyData[month].reviews++;
    monthlyData[month].ratings.push(getEffectiveRating(review));
  });

  const labels: string[] = [];
  const reviewCounts: number[] = [];
  const avgRatings: number[] = [];

  const labelStart = new Date(rangeStart);
  labelStart.setHours(0, 0, 0, 0);
  const labelEnd = new Date(rangeEnd);
  labelEnd.setHours(0, 0, 0, 0);

  const totalMonths =
    (labelEnd.getFullYear() - labelStart.getFullYear()) * 12 +
    (labelEnd.getMonth() - labelStart.getMonth());

  const monthsToIterate = Math.max(totalMonths, 0);

  for (let i = 0; i <= monthsToIterate; i++) {
    const current = new Date(labelStart);
    current.setMonth(labelStart.getMonth() + i);
    const monthKey = current.toISOString().substring(0, 7);
    const monthName = current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
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
