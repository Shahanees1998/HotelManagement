import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;
    const body = await request.json();
    const { guestName, guestEmail, guestPhone, answers } = body;

    // Validate required fields
    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      );
    }

    // Get form with questions
    const form = await prisma.feedbackForm.findUnique({
      where: { id: formId },
      include: {
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
        hotel: {
          select: {
            id: true,
            name: true,
            slug: true,
            ownerId: true,
          },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.isActive || !form.isPublic) {
      return NextResponse.json({ error: 'Form is not available' }, { status: 403 });
    }

    // Generate predefined questions for validation
    const predefinedQuestions = [];
    
    if (form.predefinedQuestions?.hasRateUs) {
      predefinedQuestions.push({
        id: 'rate-us',
        question: 'How do you rate us?',
        type: 'STAR_RATING',
        isRequired: true,
      });
    }
    
    if (form.predefinedQuestions?.hasCustomRating && form.predefinedQuestions.customRatingItems.length > 0) {
      predefinedQuestions.push({
        id: 'custom-rating',
        question: 'Custom Rating',
        type: 'CUSTOM_RATING',
        isRequired: true,
      });
    }
    
    if (form.predefinedQuestions?.hasFeedback) {
      predefinedQuestions.push({
        id: 'feedback',
        question: 'Please give us honest feedback?',
        type: 'LONG_TEXT',
        isRequired: true,
      });
    }

    // Combine all questions for validation
    const allQuestions = [...predefinedQuestions, ...form.customQuestions];

    // Validate required questions
    for (const question of allQuestions) {
      if (question.isRequired) {
        if (question.type === 'CUSTOM_RATING') {
          // For custom rating, check if at least one rating item has been answered
          const hasAnyRating = form.predefinedQuestions?.customRatingItems?.some(item => 
            answers[`${question.id}-${item.id}`]
          );
          if (!hasAnyRating) {
            return NextResponse.json(
              { error: `Question "${question.question}" is required` },
              { status: 400 }
            );
          }
        } else if (!answers[question.id]) {
          return NextResponse.json(
            { error: `Question "${question.question}" is required` },
            { status: 400 }
          );
        }
      }
    }

    // Calculate overall rating from star rating questions
    let overallRating = 0;
    let ratingCount = 0;
    
    for (const question of allQuestions) {
      if (question.type === 'STAR_RATING' && answers[question.id]) {
        overallRating += answers[question.id];
        ratingCount++;
      }
    }
    
    const finalRating = ratingCount > 0 ? Math.round(overallRating / ratingCount) : 0;

    // Create review and answers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create review
      const review = await tx.review.create({
        data: {
          hotelId: form.hotel.id,
          formId: form.id,
          guestName: guestName || null,
          guestEmail: guestEmail || null,
          guestPhone: guestPhone || null,
          overallRating: finalRating,
          isPublic: finalRating >= 4, // Auto-publish 4-5 star reviews
          status: finalRating >= 4 ? 'APPROVED' : 'PENDING',
          submittedAt: new Date(),
        },
      });

      // Create question answers (only for custom questions, not predefined ones)
      const customQuestionIds = form.customQuestions.map(q => q.id);
      const predefinedQuestionIds = ['rate-us', 'custom-rating', 'feedback'];
      
      const answersData = Object.entries(answers)
        .filter(([questionId, answer]) => {
          // Only include custom questions (not predefined ones)
          if (customQuestionIds.includes(questionId)) {
            return true;
          }
          // Filter out predefined question IDs and their sub-answers
          if (predefinedQuestionIds.includes(questionId) || 
              predefinedQuestionIds.some(predefinedId => questionId.startsWith(predefinedId + '-'))) {
            return false;
          }
          return true;
        })
        .map(([questionId, answer]) => ({
          reviewId: review.id,
          questionId: questionId,
          answer: JSON.stringify(answer),
        }));

      if (answersData.length > 0) {
        await tx.questionAnswer.createMany({
          data: answersData,
        });
      }

      // Store predefined question answers in the review's metadata
      const predefinedAnswers = Object.entries(answers)
        .filter(([questionId, answer]) => 
          predefinedQuestionIds.includes(questionId) || 
          predefinedQuestionIds.some(predefinedId => questionId.startsWith(predefinedId + '-'))
        );

      if (predefinedAnswers.length > 0) {
        // Store predefined answers as JSON in the predefinedAnswers field
        await tx.review.update({
          where: { id: review.id },
          data: {
            predefinedAnswers: JSON.stringify(predefinedAnswers)
          }
        });
      }

      return review;
    });

    // Send notifications
    try {
      const { NotificationCreators } = await import('@/lib/notificationService');
      
      // Send notification to hotel owner
      await NotificationCreators.newFeedback(
        form.hotel.id,
        guestName || 'Anonymous',
        finalRating
      );

      // Send notification to admins about new review
      await NotificationCreators.newReview(
        form.hotel.id,
        form.hotel.name,
        finalRating
      );

      console.log('Feedback notifications sent successfully');
    } catch (notificationError) {
      console.error('Error sending feedback notifications:', notificationError);
      // Don't fail the submission if notifications fail
    }

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      data: { reviewId: result.id },
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting form:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
