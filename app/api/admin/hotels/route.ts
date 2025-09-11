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

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const subscription = searchParams.get('subscription');
      const search = searchParams.get('search');

      // Build where clause for filtering
      const where: any = {};
      
      if (status) {
        where.isActive = status === 'true';
      }
      
      if (subscription) {
        where.subscriptionStatus = subscription;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { owner: { firstName: { contains: search, mode: 'insensitive' } } },
          { owner: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const hotels = await prisma.hotel.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
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
      const transformedHotels = hotels.map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        slug: hotel.slug,
        email: hotel.email,
        phone: hotel.phone,
        city: hotel.city,
        country: hotel.country,
        subscriptionStatus: hotel.subscriptionStatus,
        isActive: hotel.isActive,
        totalReviews: hotel._count.reviews,
        averageRating: 4.2, // This would need to be calculated from actual reviews
        createdAt: hotel.createdAt.toISOString(),
        owner: {
          firstName: hotel.owner.firstName,
          lastName: hotel.owner.lastName,
          email: hotel.owner.email,
        },
      }));

      return NextResponse.json({ data: transformedHotels });
    } catch (error) {
      console.error('Error fetching hotels:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotels' },
        { status: 500 }
      );
    }
  });
}
