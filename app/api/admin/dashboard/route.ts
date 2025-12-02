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

      // Get dashboard statistics
      const [
        totalHotels,
        totalSubscribedHotels,
        totalReviews,
        totalEarnings,
        pendingApprovals,
        supportRequests,
        trialAccounts,
        basicPlanAccounts,
        professionalPlanAccounts,
        enterprisePlanAccounts,
      ] = await Promise.all([
        prisma.hotels.count(),
        prisma.hotels.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        prisma.review.count(),
        // Calculate total earnings based on active subscriptions
        prisma.hotels.count({ where: { subscriptionStatus: 'ACTIVE' } }),
        prisma.user.count({ where: { status: 'PENDING' } }),
        prisma.supportRequest.count({ where: { status: 'OPEN' } }),
        // Count by subscription plans
        prisma.hotels.count({ where: { subscriptionStatus: 'TRIAL' } }),
        prisma.hotels.count({ where: { currentPlan: 'basic' } }),
        prisma.hotels.count({ where: { currentPlan: 'professional' } }),
        prisma.hotels.count({ where: { currentPlan: 'enterprise' } }),
      ]);

      // Get recent activity - mix of users, hotels, and reviews
      const [recentUsers, recentHotels, recentReviews] = await Promise.all([
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            status: true,
            role: true,
          },
        }),
        prisma.hotels.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            subscriptionStatus: true,
            owner: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
        prisma.review.findMany({
          take: 5,
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            overallRating: true,
            submittedAt: true,
            status: true,
            hotel: {
              select: {
                name: true,
                slug: true,
              },
            },
            guestName: true,
            guestEmail: true,
          },
        }),
      ]);

      // Transform recent activity
      const transformedActivity = [
        ...recentUsers.map((user) => ({
          id: user.id,
          type: 'USER_REGISTRATION',
          description: `New ${user.role.toLowerCase()} registration: ${user.firstName} ${user.lastName}`,
          timestamp: user.createdAt.toISOString(),
          user: user.email,
          status: user.status,
        })),
        ...recentHotels.map((hotel) => ({
          id: hotel.id,
          type: 'HOTEL_REGISTRATION',
          description: `New hotel registered: ${hotel.name}`,
          timestamp: hotel.createdAt.toISOString(),
          user: hotel.owner.email,
          status: hotel.subscriptionStatus,
        })),
        ...recentReviews.map((review) => ({
          id: review.id,
          type: 'NEW_REVIEW',
          description: `New ${review.overallRating}-star review for ${review.hotel.name}`,
          timestamp: review.submittedAt.toISOString(),
          user: review.guestEmail || 'Anonymous',
          status: review.status,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Get growth data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyData = [];
      const labels = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const [newHotels, deactivatedHotels, newReviews, monthlyEarnings] = await Promise.all([
          prisma.hotels.count({
            where: {
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }),
          prisma.hotels.count({
            where: {
              isActive: false,
              updatedAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }),
          prisma.review.count({
            where: {
              submittedAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }),
          // Calculate monthly earnings based on active subscriptions
          prisma.hotels.count({
            where: {
              subscriptionStatus: 'ACTIVE',
              createdAt: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
          }), // Count of active subscriptions
        ]);

        monthlyData.push({ newHotels, deactivatedHotels, newReviews, monthlyEarnings });
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      }

      const growthData = {
        labels,
        newHotels: monthlyData.map(d => d.newHotels),
        deactivatedHotels: monthlyData.map(d => d.deactivatedHotels),
        newReviews: monthlyData.map(d => d.newReviews),
        earnings: monthlyData.map(d => d.monthlyEarnings * 99.99),
      };

      // Calculate total earnings
      const calculatedTotalEarnings = totalSubscribedHotels * 99.99;

      return NextResponse.json({
        stats: {
          totalHotels,
          totalSubscribedHotels,
          totalReviews,
          totalEarnings: calculatedTotalEarnings,
          pendingApprovals,
          supportRequests,
          trialAccounts,
          basicPlanAccounts,
          professionalPlanAccounts,
          enterprisePlanAccounts,
        },
        recentActivity: transformedActivity,
        growthData,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }
  });
} 