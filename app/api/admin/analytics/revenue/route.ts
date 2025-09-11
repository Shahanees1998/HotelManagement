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
      const chartType = url.searchParams.get('chartType') || 'revenue';

      const days = parseInt(timeRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get revenue data
      const activeSubscriptions = await prisma.hotel.count({
        where: { subscriptionStatus: 'ACTIVE' },
      });

      const totalHotels = await prisma.hotel.count();
      
      // Calculate revenue metrics
      const monthlyRecurringRevenue = activeSubscriptions * 99.99;
      const totalRevenue = activeSubscriptions * 99.99;
      const averageRevenuePerUser = totalHotels > 0 ? totalRevenue / totalHotels : 0;
      const churnRate = 2.1; // This would be calculated from actual churn data

      const revenueData = {
        totalRevenue,
        monthlyRecurringRevenue,
        averageRevenuePerUser,
        churnRate,
        timeRange: days,
        chartType,
      };

      return NextResponse.json({ data: revenueData });
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch revenue analytics' },
        { status: 500 }
      );
    }
  });
}
