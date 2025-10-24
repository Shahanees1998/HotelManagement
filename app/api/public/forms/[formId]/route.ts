import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const { formId } = params;

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
            name: true,
            slug: true,
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

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      layout: form.layout || 'basic',
      hotelName: form.hotel.name,
      hotelSlug: form.hotel.slug,
      questions: allQuestions,
      predefinedQuestions: form.predefinedQuestions,
    };

    return NextResponse.json({ data: formData });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}
