import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/analytics - Get hotel analytics data
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        console.log('Analytics API: Invalid user or role:', user?.role);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      console.log('Analytics API: User authenticated:', user.userId, user.role);

      const { searchParams } = new URL(request.url);
      const timeRange = searchParams.get('timeRange') || '30';
      const days = parseInt(timeRange);

      // Get hotel data
      const hotel = await prisma.hotels.findFirst({
        where: {
          ownerId: user.userId,
        },
      });

      if (!hotel) {
        console.log('Analytics API: Hotel not found for user:', user.userId);
        
        // Return empty analytics data instead of error for hotel users without hotel records
        return NextResponse.json({
          success: true,
          data: {
            statsCards: [
              {
                title: "Total Reviews",
                value: "0",
                change: "+0%",
                changeType: "positive",
                icon: "pi pi-comments",
              },
              {
                title: "Average Rating",
                value: "0.0",
                change: "+0.0",
                changeType: "positive",
                icon: "pi pi-star",
              },
              {
                title: "Response Rate",
                value: "0.0%",
                change: "+0.0%",
                changeType: "positive",
                icon: "pi pi-percentage",
              },
              {
                title: "Satisfaction Score",
                value: "0.0%",
                change: "+0.0%",
                changeType: "positive",
                icon: "pi pi-thumbs-up",
              },
            ],
            charts: {
              satisfaction: {
                labels: [],
                datasets: [{ label: 'Average Rating', data: [], borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', tension: 0.4 }],
              },
              reviews: {
                labels: [],
                datasets: [
                  { label: 'Total Reviews', data: [], borderColor: '#2196F3', backgroundColor: 'rgba(33, 150, 243, 0.1)', tension: 0.4 },
                  { label: 'Positive Reviews (4-5 stars)', data: [], borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', tension: 0.4 },
                ],
              },
              ratingDistribution: {
                labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
                datasets: [{ data: [0, 0, 0, 0, 0], backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'] }],
              },
            },
            reviews: [],
          },
        });
      }
      
      console.log('Analytics API: Hotel found:', hotel.id, hotel.name);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get reviews data
      const reviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          submittedAt: {
            gte: startDate,
          },
        },
        include: {
          form: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      // Calculate statistics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.overallRating, 0) / totalReviews 
        : 0;
      
      const positiveReviews = reviews.filter(review => review.overallRating >= 4).length;
      const responseRate = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;
      const satisfactionScore = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

      // Rating distribution
      const ratingDistribution = {
        '5': reviews.filter(r => r.overallRating === 5).length,
        '4': reviews.filter(r => r.overallRating === 4).length,
        '3': reviews.filter(r => r.overallRating === 3).length,
        '2': reviews.filter(r => r.overallRating === 2).length,
        '1': reviews.filter(r => r.overallRating === 1).length,
      };

      // Monthly data for charts
      const monthlyData: Record<string, { reviews: number; averageRating: number; positiveReviews: number }> = {};
      const currentDate = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const dayReviews = reviews.filter(review => 
          review.submittedAt.toISOString().split('T')[0] === dateKey
        );
        
        monthlyData[dateKey] = {
          reviews: dayReviews.length,
          averageRating: dayReviews.length > 0 
            ? dayReviews.reduce((sum, r) => sum + r.overallRating, 0) / dayReviews.length 
            : 0,
          positiveReviews: dayReviews.filter(r => r.overallRating >= 4).length,
        };
      }

      // Convert to chart format
      const chartLabels = Object.keys(monthlyData).map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const satisfactionData = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Average Rating',
            data: Object.values(monthlyData).map((data: any) => data.averageRating),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
          },
        ],
      };

      const reviewsData = {
        labels: chartLabels,
        datasets: [
          {
            label: 'Total Reviews',
            data: Object.values(monthlyData).map((data: any) => data.reviews),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Positive Reviews (4-5 stars)',
            data: Object.values(monthlyData).map((data: any) => data.positiveReviews),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
          },
        ],
      };

      const ratingDistributionData = {
        labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
        datasets: [
          {
            data: [
              ratingDistribution['5'],
              ratingDistribution['4'],
              ratingDistribution['3'],
              ratingDistribution['2'],
              ratingDistribution['1'],
            ],
            backgroundColor: [
              '#4CAF50',
              '#8BC34A',
              '#FFC107',
              '#FF9800',
              '#F44336',
            ],
          },
        ],
      };

      // Calculate changes from previous period
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      
      const previousReviews = await prisma.review.findMany({
        where: {
          hotelId: hotel.id,
          submittedAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      });

      const previousTotalReviews = previousReviews.length;
      const previousAverageRating = previousTotalReviews > 0 
        ? previousReviews.reduce((sum, review) => sum + review.overallRating, 0) / previousTotalReviews 
        : 0;
      
      const previousPositiveReviews = previousReviews.filter(review => review.overallRating >= 4).length;
      const previousResponseRate = previousTotalReviews > 0 ? (previousPositiveReviews / previousTotalReviews) * 100 : 0;
      const previousSatisfactionScore = previousTotalReviews > 0 ? (previousPositiveReviews / previousTotalReviews) * 100 : 0;

      const statsCards = [
        {
          title: "Total Reviews",
          value: totalReviews.toString(),
          change: previousTotalReviews > 0 
            ? `+${Math.round(((totalReviews - previousTotalReviews) / previousTotalReviews) * 100)}%`
            : "+0%",
          changeType: totalReviews >= previousTotalReviews ? "positive" : "negative",
          icon: "pi pi-comments",
        },
        {
          title: "Average Rating",
          value: averageRating.toFixed(1),
          change: previousAverageRating > 0 
            ? `+${(averageRating - previousAverageRating).toFixed(1)}`
            : "+0.0",
          changeType: averageRating >= previousAverageRating ? "positive" : "negative",
          icon: "pi pi-star",
        },
        {
          title: "Response Rate",
          value: `${responseRate.toFixed(1)}%`,
          change: previousResponseRate > 0 
            ? `+${(responseRate - previousResponseRate).toFixed(1)}%`
            : "+0.0%",
          changeType: responseRate >= previousResponseRate ? "positive" : "negative",
          icon: "pi pi-percentage",
        },
        {
          title: "Satisfaction Score",
          value: `${satisfactionScore.toFixed(1)}%`,
          change: previousSatisfactionScore > 0 
            ? `+${(satisfactionScore - previousSatisfactionScore).toFixed(1)}%`
            : "+0.0%",
          changeType: satisfactionScore >= previousSatisfactionScore ? "positive" : "negative",
          icon: "pi pi-thumbs-up",
        },
      ];

      return NextResponse.json({
        success: true,
        data: {
          statsCards,
          charts: {
            satisfaction: satisfactionData,
            reviews: reviewsData,
            ratingDistribution: ratingDistributionData,
          },
          reviews: reviews.slice(0, 10).map(review => ({
            id: review.id,
            rating: review.overallRating,
            comment: '', // Reviews don't have comments in the current schema
            createdAt: review.submittedAt.toISOString(),
            form: review.form,
          })), // Latest 10 reviews
        },
      });

    } catch (error) {
      console.error('Error fetching hotel analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics data' },
        { status: 500 }
      );
    }
  });
}