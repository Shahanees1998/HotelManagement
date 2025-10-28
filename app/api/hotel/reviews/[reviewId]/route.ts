import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { reviewId } = params;
      const { user } = authenticatedReq;

      // Get the review with all related data
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          hotel: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
          form: {
            select: {
              title: true,
              description: true,
              layout: true,
              predefinedQuestions: {
                include: {
                  customRatingItems: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  question: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      if (!review) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }

      // Check if user has access to this review
      if (user?.role === 'HOTEL_OWNER' && review.hotel.ownerId !== user?.userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Format the response
      const feedbackDetails = {
        id: review.id,
        guestName: review.guestName,
        guestEmail: review.guestEmail,
        guestPhone: review.guestPhone,
        roomNumber: review.roomNumber,
        overallRating: review.overallRating,
        status: review.status,
        submittedAt: review.submittedAt.toISOString(),
        isPublic: review.isPublic,
        isChecked: review.isChecked ?? false,
        isUrgent: review.isUrgent ?? false,
        isReplied: review.isReplied ?? false,
        isDeleted: review.isDeleted ?? false,
        form: {
          title: review.form.title,
          description: review.form.description,
          layout: review.form.layout,
          predefinedQuestions: review.form.predefinedQuestions ? {
            hasRateUs: review.form.predefinedQuestions.hasRateUs,
            hasCustomRating: review.form.predefinedQuestions.hasCustomRating,
            hasFeedback: review.form.predefinedQuestions.hasFeedback,
            customRatingItems: review.form.predefinedQuestions.customRatingItems || []
          } : null,
        },
        predefinedAnswers: review.predefinedAnswers,
        answers: review.answers.map(qa => ({
          id: qa.id,
          question: {
            id: qa.questionId,
            question: qa.question.question,
            type: qa.question.type,
            isRequired: false, // Default value
            options: [], // Default value
          },
          answer: qa.answer,
        })),
      };

      return NextResponse.json({ data: feedbackDetails });
    } catch (error) {
      console.error('Error fetching review details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch review details' },
        { status: 500 }
      );
    }
  });
}