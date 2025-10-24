import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params;
    
    console.log('Fetching review:', reviewId);

    // Simple query first - just get basic review info
    const review = await prisma.review.findFirst({
      where: { id: reviewId },
      select: {
        id: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        overallRating: true,
        status: true,
        submittedAt: true,
        isPublic: true,
        predefinedAnswers: true,
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Get question answers separately
    const answers = await prisma.questionAnswer.findMany({
      where: { reviewId: reviewId },
      include: {
        question: {
          select: {
            question: true,
            type: true,
          },
        },
      },
    });

    // Format the response
    const feedbackDetails = {
      id: review.id,
      guestName: review.guestName,
      guestEmail: review.guestEmail,
      guestPhone: review.guestPhone,
      overallRating: review.overallRating,
      status: review.status,
      submittedAt: review.submittedAt.toISOString(),
      isPublic: review.isPublic,
      predefinedAnswers: review.predefinedAnswers,
      questionAnswers: answers.map(qa => ({
        questionId: qa.questionId,
        answer: qa.answer,
        question: qa.question,
      })),
    };

    return NextResponse.json({ data: feedbackDetails });
  } catch (error) {
    console.error('Error fetching review details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch review details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
