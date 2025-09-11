import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/reviews - Get hotel's reviews
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Get reviews for this hotel
      const reviews = await prisma.review.findMany({
        where: { hotelId: hotel.id },
        include: {
          form: {
            select: { title: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      const formattedReviews = reviews.map(review => ({
        id: review.id,
        guestName: review.guestName,
        guestEmail: review.guestEmail,
        overallRating: review.overallRating,
        status: review.status,
        isPublic: review.isPublic,
        isShared: review.isShared,
        submittedAt: review.submittedAt.toISOString(),
        publishedAt: review.publishedAt?.toISOString(),
        formTitle: review.form?.title || 'Unknown Form',
      }));

      return NextResponse.json({ data: formattedReviews });
    } catch (error) {
      console.error('Error fetching hotel reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
  });
}
