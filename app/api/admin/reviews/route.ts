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
      const ratings = searchParams.get('ratings');
      const hotel = searchParams.get('hotel');
      const search = searchParams.get('search');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};
      
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
      
      if (hotel) {
        where.hotelId = hotel;
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
          { hotel: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      // Get total count and paginated data in parallel
      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where,
          skip,
          take: limit,
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
        }),
        prisma.review.count({ where })
      ]);

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
        predefinedAnswers: review.predefinedAnswers,
      }));

      return NextResponse.json({ 
        data: transformedReviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
  });
}
