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
        questions: {
          orderBy: { order: 'asc' },
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

    const formData = {
      id: form.id,
      title: form.title,
      description: form.description,
      layout: form.layout || 'basic',
      hotelName: form.hotel.name,
      hotelSlug: form.hotel.slug,
      questions: form.questions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        isRequired: q.isRequired,
        options: q.options,
      })),
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
