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
      const hotel = searchParams.get('hotel');
      const status = searchParams.get('status');
      const search = searchParams.get('search');

      // Build where clause for filtering
      const where: any = {};
      
      if (status) {
        where.isActive = status === 'true';
      }
      
      if (hotel) {
        where.hotel = {
          name: hotel
        };
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { hotel: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const forms = await prisma.feedbackForm.findMany({
        where,
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              questions: true,
              reviews: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to match the expected interface
      const transformedForms = forms.map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        hotelName: form.hotel.name,
        hotelSlug: form.hotel.slug,
        isActive: form.isActive,
        isPublic: form.isPublic,
        questionCount: form._count.questions,
        responseCount: form._count.reviews,
        averageRating: 4.2, // This would need to be calculated from actual reviews
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
      }));

      return NextResponse.json({ data: transformedForms });
    } catch (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      );
    }
  });
}
