import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (authenticatedReq.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const url = new URL(request.url);
      const timeRange = url.searchParams.get('timeRange') || '30';
      const metric = url.searchParams.get('metric') || 'overview';

      // Get analytics data based on time range
      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [
        totalHotels,
        totalReviews,
        activeSubscriptions,
        newHotels,
        newReviews,
      ] = await Promise.all([
        prisma.hotel.count(),
        prisma.review.count(),
        prisma.hotel.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        prisma.hotel.count({
          where: {
            createdAt: { gte: startDate },
          },
        }),
        prisma.review.count({
          where: {
            submittedAt: { gte: startDate },
          },
        }),
      ]);

      // Calculate total earnings based on active subscriptions
      const totalEarnings = activeSubscriptions * 99.99;

      const analytics = {
        totalHotels,
        totalReviews,
        totalEarnings,
        activeSubscriptions,
        newHotels,
        newReviews,
        timeRange: days,
        metric,
      };

      return NextResponse.json({ data: analytics });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  });
}
