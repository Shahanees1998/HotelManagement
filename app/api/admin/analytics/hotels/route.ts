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

      const hotels = await prisma.hotel.findMany({
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to match the expected interface
      const hotelPerformance = hotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        owner: `${hotel.owner.firstName} ${hotel.owner.lastName}`,
        subscription: hotel.subscriptionStatus === 'ACTIVE' ? 'Professional Plan' : 
                    hotel.subscriptionStatus === 'TRIAL' ? 'Trial Plan' : 'No Plan',
        totalReviews: hotel._count.reviews,
        averageRating: 4.2, // This would need to be calculated from actual reviews
        responseRate: 85.5, // This would need to be calculated
        monthlyRevenue: hotel.subscriptionStatus === 'ACTIVE' ? 99.99 : 0,
        growthRate: 12.5, // This would need to be calculated
        lastActivity: hotel.updatedAt.toISOString(),
        status: hotel.isActive ? 'ACTIVE' : 'INACTIVE',
      }));

      return NextResponse.json({ data: hotelPerformance });
    } catch (error) {
      console.error('Error fetching hotel performance:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotel performance' },
        { status: 500 }
      );
    }
  });
}
