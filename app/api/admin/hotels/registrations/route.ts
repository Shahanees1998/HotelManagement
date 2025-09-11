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
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to match the expected interface
      const registrations = hotels.map(hotel => ({
        id: hotel.id,
        hotelName: hotel.name,
        slug: hotel.slug,
        ownerName: `${hotel.owner.firstName} ${hotel.owner.lastName}`,
        ownerEmail: hotel.owner.email,
        phone: hotel.phone,
        city: hotel.city,
        country: hotel.country,
        status: hotel.isActive ? 'APPROVED' : 'PENDING',
        subscriptionStatus: hotel.subscriptionStatus,
        createdAt: hotel.createdAt.toISOString(),
        approvedAt: hotel.isActive ? hotel.createdAt.toISOString() : null,
        rejectedAt: hotel.subscriptionStatus === 'CANCELLED' ? hotel.updatedAt.toISOString() : null,
        rejectionReason: hotel.subscriptionStatus === 'CANCELLED' ? 'Subscription cancelled' : null,
      }));

      return NextResponse.json({ data: registrations });
    } catch (error) {
      console.error('Error fetching hotel registrations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotel registrations' },
        { status: 500 }
      );
    }
  });
}
