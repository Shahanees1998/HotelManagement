import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/subscription - Get hotel subscription details
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel with subscription details
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: {
          id: true,
          name: true,
          subscriptionStatus: true,
          currentPlan: true,
          trialEndsAt: true,
          subscriptionEndsAt: true,
          subscriptionId: true,
          createdAt: true,
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Calculate trial days remaining
      const now = new Date();
      const trialEndsAt = hotel.trialEndsAt;
      const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

      // Get subscription statistics
      const stats = await prisma.review.groupBy({
        by: ['hotelId'],
        where: { hotelId: hotel.id },
        _count: { id: true },
        _avg: { overallRating: true },
      });

      const subscriptionData = {
        hotel: {
          id: hotel.id,
          name: hotel.name,
          subscriptionStatus: hotel.subscriptionStatus,
          currentPlan: hotel.currentPlan || 'basic',
          trialEndsAt: hotel.trialEndsAt?.toISOString(),
          subscriptionEndsAt: hotel.subscriptionEndsAt?.toISOString(),
          subscriptionId: hotel.subscriptionId,
          createdAt: hotel.createdAt.toISOString(),
        },
        trial: {
          daysRemaining,
          isActive: hotel.subscriptionStatus === 'TRIAL',
        },
        stats: {
          totalReviews: stats[0]?._count.id || 0,
          averageRating: stats[0]?._avg.overallRating || 0,
        },
        plans: [
          {
            id: 'basic',
            name: 'Basic Plan',
            price: 29,
            currency: 'USD',
            interval: 'month',
            features: [
              'Up to 100 reviews per month',
              'Basic analytics',
              'QR code generation',
              'Basic Feedback Form',
            ],
          },
          {
            id: 'professional',
            name: 'Professional Plan',
            price: 79,
            currency: 'USD',
            interval: 'month',
            features: [
              'Up to 500 reviews per month',
              'Advanced analytics',
              'QR code generation',
              'Customized Star Rating Questions',
            ],
          },
          {
            id: 'enterprise',
            name: 'Enterprise Plan',
            price: 199,
            currency: 'USD',
            interval: 'month',
            features: [
              'Unlimited reviews',
              'Full analytics suite',
              'QR code generation',
              'All type of questions',
            ],
          },
        ],
      };

      return NextResponse.json({ data: subscriptionData });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription details' },
        { status: 500 }
      );
    }
  });
}

// POST /api/hotel/subscription - Update subscription (upgrade/downgrade)
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { planId, action } = body;

      if (!planId || !action) {
        return NextResponse.json(
          { error: 'Plan ID and action are required' },
          { status: 400 }
        );
      }

      // Get hotel
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true, subscriptionStatus: true, currentPlan: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // For now, simulate subscription changes (in real app, integrate with Stripe)
      let newStatus = hotel.subscriptionStatus;
      let subscriptionEndsAt = null;
      let planName = '';

      if (action === 'upgrade') {
        newStatus = 'ACTIVE';
        subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        
        // Map plan ID to plan name for display
        const planMap: { [key: string]: string } = {
          'basic': 'Basic Plan',
          'professional': 'Professional Plan', 
          'enterprise': 'Enterprise Plan'
        };
        planName = planMap[planId] || 'Unknown Plan';
      } else if (action === 'cancel') {
        newStatus = 'CANCELLED';
      }

      // Update hotel subscription
      const updatedHotel = await prisma.hotels.update({
        where: { id: hotel.id },
        data: {
          subscriptionStatus: newStatus,
          currentPlan: planId,
          subscriptionEndsAt: subscriptionEndsAt,
          subscriptionId: `sub_${Date.now()}`, // Mock subscription ID
        },
      });

      return NextResponse.json({
        message: `Successfully ${action === 'upgrade' ? 'upgraded to' : 'cancelled'} ${planName || 'subscription'}`,
        data: {
          subscriptionStatus: updatedHotel.subscriptionStatus,
          subscriptionEndsAt: updatedHotel.subscriptionEndsAt?.toISOString(),
          planName: planName,
        },
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }
  });
}
