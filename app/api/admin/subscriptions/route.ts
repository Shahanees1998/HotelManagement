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
      const plan = searchParams.get('plan');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};
      
      if (status) {
        where.subscriptionStatus = status;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { owner: { firstName: { contains: search, mode: 'insensitive' } } },
          { owner: { lastName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get total count and paginated data in parallel
      const [hotels, total] = await Promise.all([
        prisma.hotels.findMany({
          where,
          skip,
          take: limit,
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.hotels.count({ where })
      ]);

      // Transform the data to match the expected interface
      let subscriptions = hotels.map(hotel => ({
        id: hotel.id,
        hotelName: hotel.name,
        hotelSlug: hotel.slug,
        ownerName: `${hotel.owner.firstName} ${hotel.owner.lastName}`,
        ownerEmail: hotel.owner.email,
        subscriptionId: hotel.subscriptionId || 'N/A',
        status: hotel.subscriptionStatus,
        planName: hotel.subscriptionStatus === 'ACTIVE' ? 'Professional Plan' : 
                 hotel.subscriptionStatus === 'TRIAL' ? 'Trial Plan' : 'No Plan',
        amount: hotel.subscriptionStatus === 'ACTIVE' ? 99.99 : 
                hotel.subscriptionStatus === 'TRIAL' ? 0 : 0,
        currency: 'USD',
        subscriptionEndsAt: hotel.subscriptionEndsAt?.toISOString(),
        createdAt: hotel.createdAt.toISOString(),
        lastPaymentAt: hotel.subscriptionStatus === 'ACTIVE' ? hotel.createdAt.toISOString() : null,
        nextPaymentAt: hotel.subscriptionEndsAt?.toISOString(),
      }));

      // Apply plan filter if specified
      if (plan) {
        subscriptions = subscriptions.filter(sub => sub.planName === plan);
      }

      return NextResponse.json({ 
        data: subscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }
  });
}
