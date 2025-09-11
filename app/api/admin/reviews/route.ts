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
      const rating = searchParams.get('rating');
      const hotel = searchParams.get('hotel');
      const search = searchParams.get('search');

      // Build where clause for filtering
      const where: any = {};
      
      if (status) {
        where.status = status;
      }
      
      if (rating) {
        where.overallRating = parseInt(rating);
      }
      
      if (hotel) {
        where.hotel = {
          name: hotel
        };
      }
      
      if (search) {
        where.OR = [
          { guestName: { contains: search, mode: 'insensitive' } },
          { guestEmail: { contains: search, mode: 'insensitive' } },
          { hotel: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const reviews = await prisma.review.findMany({
        where,
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          form: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      });

      // Transform the data to match the expected interface
      const transformedReviews = reviews.map(review => ({
        id: review.id,
        hotelName: review.hotel.name,
        hotelSlug: review.hotel.slug,
        guestName: review.guestName,
        guestEmail: review.guestEmail,
        overallRating: review.overallRating,
        status: review.status,
        isPublic: review.isPublic,
        isShared: review.isShared,
        formTitle: review.form.title,
        submittedAt: review.submittedAt.toISOString(),
        publishedAt: review.publishedAt?.toISOString(),
      }));

      return NextResponse.json({ data: transformedReviews });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
  });
}
