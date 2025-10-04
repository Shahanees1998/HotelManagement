import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/feedback/[hotelSlug]/[formId] - Get public feedback form
export async function GET(
  request: NextRequest,
  { params }: { params: { hotelSlug: string; formId: string } }
) {
  try {
    const { hotelSlug, formId } = params;

    // Find hotel by slug
    const hotel = await prisma.hotels.findUnique({
      where: { slug: hotelSlug },
      select: {
        id: true,
        name: true,
        logo: true,
        isActive: true,
      },
    });

    if (!hotel || !hotel.isActive) {
      return NextResponse.json(
        { error: 'Hotel not found or inactive' },
        { status: 404 }
      );
    }

    // Find the feedback form
    const form = await prisma.feedbackForm.findFirst({
      where: {
        id: formId,
        hotelId: hotel.id,
        isActive: true,
        isPublic: true,
      },
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
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Feedback form not found' },
        { status: 404 }
      );
    }

    // Generate predefined questions based on flags
    const predefinedQuestions = [];
    
    if (form.predefinedQuestions?.hasRateUs) {
      predefinedQuestions.push({
        id: 'rate-us',
        question: 'How do you rate us?',
        type: 'STAR_RATING',
        isRequired: true,
        options: [],
        isDefault: true,
      });
    }
    
    if (form.predefinedQuestions?.hasCustomRating && form.predefinedQuestions.customRatingItems.length > 0) {
      predefinedQuestions.push({
        id: 'custom-rating',
        question: 'Custom Rating',
        type: 'CUSTOM_RATING',
        isRequired: true,
        options: [],
        isDefault: true,
        customRatingItems: form.predefinedQuestions.customRatingItems.map(item => ({
          id: item.id,
          label: item.label,
          order: item.order,
        })),
      });
    }
    
    if (form.predefinedQuestions?.hasFeedback) {
      predefinedQuestions.push({
        id: 'feedback',
        question: 'Please give us your honest feedback?',
        type: 'LONG_TEXT',
        isRequired: true,
        options: [],
        isDefault: true,
      });
    }

    // Combine predefined and custom questions
    const allQuestions = [
      ...predefinedQuestions,
      ...form.customQuestions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        isRequired: q.isRequired,
        options: q.options,
        isDefault: false,
      })),
    ];

    return NextResponse.json({
      id: form.id,
      title: form.title,
      description: form.description,
      questions: allQuestions,
      hotel: {
        name: hotel.name,
        logo: hotel.logo,
      },
    });
  } catch (error) {
    console.error('Get feedback form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/public/feedback/[hotelSlug]/[formId]/submit - Submit feedback
export async function POST(
  request: NextRequest,
  { params }: { params: { hotelSlug: string; formId: string } }
) {
  try {
    const { hotelSlug, formId } = params;
    const body = await request.json();
    const { guestInfo, answers } = body;

    // Find hotel by slug
    const hotel = await prisma.hotels.findUnique({
      where: { slug: hotelSlug },
      select: { id: true, name: true, isActive: true },
    });

    if (!hotel || !hotel.isActive) {
      return NextResponse.json(
        { error: 'Hotel not found or inactive' },
        { status: 404 }
      );
    }

    // Find the feedback form
    const form = await prisma.feedbackForm.findFirst({
      where: {
        id: formId,
        hotelId: hotel.id,
        isActive: true,
        isPublic: true,
      },
    });

    if (!form) {
      return NextResponse.json(
        { error: 'Feedback form not found' },
        { status: 404 }
      );
    }

    // Calculate overall rating from star rating questions
    const starQuestions = Object.keys(answers).filter(key => {
      const question = answers[key];
      return typeof question === 'number' && question >= 1 && question <= 5;
    });
    
    const overallRating = starQuestions.length > 0 
      ? Math.round(starQuestions.reduce((sum, key) => sum + answers[key], 0) / starQuestions.length)
      : 3; // Default to 3 if no star ratings

    // Create the review
    const review = await prisma.review.create({
      data: {
        hotelId: hotel.id,
        formId: form.id,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        overallRating,
        isPublic: overallRating >= 4, // 4-5 stars can be public
        status: overallRating >= 4 ? 'APPROVED' : 'PENDING',
        publishedAt: overallRating >= 4 ? new Date() : null,
      },
    });

    // Create question answers
    const questionAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      reviewId: review.id,
      questionId,
      answer: JSON.stringify(answer),
    }));

    await prisma.questionAnswer.createMany({
      data: questionAnswers,
    });

    // TODO: Send email notifications
    // TODO: Send real-time notifications via Pusher
    // TODO: If 4-5 stars, prompt for Google/TripAdvisor sharing

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      reviewId: review.id,
      overallRating,
      isPublic: review.isPublic,
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
