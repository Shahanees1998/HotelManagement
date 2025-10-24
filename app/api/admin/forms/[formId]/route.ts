import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (authenticatedReq.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { formId } = params;

      // Get form with all details
      const form = await prisma.feedbackForm.findUnique({
        where: { id: formId },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          customQuestions: {
            orderBy: { order: 'asc' },
          },
          predefinedQuestions: {
            include: {
              customRatingItems: {
                orderBy: { order: 'asc' },
              },
            },
          },
          reviews: {
            select: {
              id: true,
              overallRating: true,
            },
          },
        },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      // Calculate average rating
      const ratings = form.reviews.map(r => r.overallRating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;

      const formData = {
        id: form.id,
        title: form.title,
        description: form.description,
        layout: form.layout,
        isActive: form.isActive,
        isPublic: form.isPublic,
        hotel: form.hotel,
        customQuestions: form.customQuestions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options,
          section: q.section,
          order: q.order,
        })),
        predefinedQuestions: form.predefinedQuestions,
        questionCount: form.customQuestions.length,
        responseCount: form.reviews.length,
        averageRating: averageRating,
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
      };

      return NextResponse.json({ data: formData });
    } catch (error) {
      console.error('Error fetching form details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch form details' },
        { status: 500 }
      );
    }
  });
}



