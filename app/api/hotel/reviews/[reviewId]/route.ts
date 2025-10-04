import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/reviews/[reviewId] - Get complete review details
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { reviewId } = params;
      
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

      // Get review with complete details
      const review = await prisma.review.findFirst({
        where: { 
          id: reviewId,
          hotelId: hotel.id 
        },
        include: {
          form: {
            select: { 
              title: true,
              description: true,
              layout: true,
            },
          },
          answers: {
            include: {
              question: {
                select: {
                  id: true,
                  question: true,
                  type: true,
                  isRequired: true,
                  options: true,
                },
              },
            },
          },
        },
      });

      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }

      // Get form with predefined questions to reconstruct the complete feedback
      const formWithPredefined = await prisma.feedbackForm.findFirst({
        where: { id: review.formId },
        include: {
          predefinedQuestions: {
            include: {
              customRatingItems: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      // Parse stored predefined answers
      let storedPredefinedAnswers: Record<string, any> = {};
      if (review.predefinedAnswers) {
        try {
          const predefinedAnswersArray = JSON.parse(review.predefinedAnswers);
          storedPredefinedAnswers = Object.fromEntries(predefinedAnswersArray);
        } catch (error) {
          console.error('Error parsing predefined answers:', error);
        }
      }

      // Generate predefined questions based on form configuration and stored answers
      const predefinedQuestions = [];
      
      if (formWithPredefined?.predefinedQuestions?.hasRateUs) {
        predefinedQuestions.push({
          id: 'rate-us',
          question: 'How do you rate us?',
          type: 'STAR_RATING',
          isRequired: true,
          options: [],
          isDefault: true,
          answer: storedPredefinedAnswers['rate-us'] || review.overallRating,
        });
      }
      
      if (formWithPredefined?.predefinedQuestions?.hasCustomRating && formWithPredefined.predefinedQuestions.customRatingItems.length > 0) {
        predefinedQuestions.push({
          id: 'custom-rating',
          question: 'Custom Rating',
          type: 'CUSTOM_RATING',
          isRequired: true,
          options: [],
          isDefault: true,
          customRatingItems: formWithPredefined.predefinedQuestions.customRatingItems.map(item => ({
            id: item.id,
            label: item.label,
            order: item.order,
            rating: storedPredefinedAnswers[`custom-rating-${item.id}`] || 0,
          })),
          answer: 'Custom rating items with individual ratings',
        });
      }
      
      if (formWithPredefined?.predefinedQuestions?.hasFeedback) {
        predefinedQuestions.push({
          id: 'feedback',
          question: 'Please give us your honest feedback?',
          type: 'LONG_TEXT',
          isRequired: true,
          options: [],
          isDefault: true,
          answer: storedPredefinedAnswers['feedback'] || 'No feedback provided',
        });
      }

      // Format the review data
      const formattedReview = {
        id: review.id,
        guestName: review.guestName,
        guestEmail: review.guestEmail,
        guestPhone: review.guestPhone,
        overallRating: review.overallRating,
        status: review.status,
        isPublic: review.isPublic,
        isShared: review.isShared,
        submittedAt: review.submittedAt.toISOString(),
        publishedAt: review.publishedAt?.toISOString(),
        form: {
          title: review.form?.title || 'Unknown Form',
          description: review.form?.description,
          layout: review.form?.layout || 'basic',
        },
        answers: [
          // Include predefined questions first
          ...predefinedQuestions.map(q => ({
            id: q.id,
            question: {
              id: q.id,
              question: q.question,
              type: q.type,
              isRequired: q.isRequired,
              options: q.options,
            },
            answer: q.answer,
            customRatingItems: q.customRatingItems,
          })),
          // Then include custom question answers
          ...review.answers.map(answer => ({
            id: answer.id,
            question: {
              id: answer.question.id,
              question: answer.question.question,
              type: answer.question.type,
              isRequired: answer.question.isRequired,
              options: answer.question.options,
            },
            answer: JSON.parse(answer.answer),
          })),
        ],
      };

      return NextResponse.json({ data: formattedReview });
    } catch (error) {
      console.error('Error fetching review details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch review details' },
        { status: 500 }
      );
    }
  });
}
