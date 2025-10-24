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
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const ratings = searchParams.get('ratings');
      const search = searchParams.get('search');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortField = searchParams.get('sortField') || 'submittedAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { hotelId: hotel.id };
      
      if (status) {
        where.status = status;
      }
      
      // Handle multiple star ratings
      if (ratings) {
        const ratingArray = ratings.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
        if (ratingArray.length > 0) {
          where.overallRating = { in: ratingArray };
        }
      }
      
      // Handle date range filter
      if (startDate || endDate) {
        where.submittedAt = {};
        if (startDate) {
          where.submittedAt.gte = new Date(startDate);
        }
        if (endDate) {
          // Set end date to end of day
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          where.submittedAt.lte = endDateTime;
        }
      }
      
      if (search) {
        where.OR = [
          { guestName: { contains: search, mode: 'insensitive' } },
          { guestEmail: { contains: search, mode: 'insensitive' } },
          { form: { title: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      if (sortField === 'guestName') {
        orderBy.guestName = sortOrder;
      } else if (sortField === 'overallRating') {
        orderBy.overallRating = sortOrder;
      } else if (sortField === 'status') {
        orderBy.status = sortOrder;
      } else {
        orderBy[sortField] = sortOrder;
      }

      // Get total count and paginated data in parallel
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: limit,
          include: {
            form: {
              select: { title: true },
            },
          },
          orderBy,
        }),
        prisma.review.count({ where })
      ]);

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

      return NextResponse.json({ 
        data: formattedReviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching hotel reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
  });
}
