import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { formId } = params;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Get form with questions
      const form = await prisma.feedbackForm.findFirst({
        where: {
          id: formId,
          hotelId: hotel.id,
        },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          reviews: {
            select: { id: true },
          },
        },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      const formData = {
        id: form.id,
        title: form.title,
        description: form.description,
        isActive: form.isActive,
        isPublic: form.isPublic,
        layout: form.layout || 'basic',
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
        totalResponses: form.reviews.length,
        questions: form.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          isRequired: q.isRequired,
          order: q.order,
          options: q.options,
          validation: q.validation,
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
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { formId } = params;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { title, description, isActive, isPublic, layout, questions } = body;

      // Get hotel
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Check if form exists and belongs to hotel
      const existingForm = await prisma.feedbackForm.findFirst({
        where: {
          id: formId,
          hotelId: hotel.id,
        },
      });

      if (!existingForm) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      // Validate questions if provided
      if (questions && Array.isArray(questions)) {
        for (const question of questions) {
          if (!question.question || !question.type) {
            return NextResponse.json(
              { error: 'Each question must have text and type' },
              { status: 400 }
            );
          }

          if ((question.type === 'MULTIPLE_CHOICE_SINGLE' || question.type === 'MULTIPLE_CHOICE_MULTIPLE') && 
              (!question.options || question.options.length < 2)) {
            return NextResponse.json(
              { error: 'Multiple choice questions must have at least 2 options' },
              { status: 400 }
            );
          }
        }
      }

      // Update form and questions in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update form
        const updatedForm = await tx.feedbackForm.update({
          where: { id: formId },
          data: {
            title: title || existingForm.title,
            description: description !== undefined ? description : existingForm.description,
            isActive: isActive !== undefined ? isActive : existingForm.isActive,
            isPublic: isPublic !== undefined ? isPublic : existingForm.isPublic,
            layout: layout || existingForm.layout,
          },
        });

        // Update questions if provided
        if (questions && Array.isArray(questions)) {
          // Delete existing questions
          await tx.formQuestion.deleteMany({
            where: { formId: formId },
          });

          // Create new questions
          const questionsData = questions.map((q: any, index: number) => ({
            formId: formId,
            question: q.question,
            type: q.type,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            order: index + 1,
            options: q.options || [],
            validation: q.validation || null,
          }));

          await tx.formQuestion.createMany({
            data: questionsData,
          });
        }

        return updatedForm;
      });

      return NextResponse.json({
        message: 'Form updated successfully',
        data: { formId: result.id },
      });
    } catch (error) {
      console.error('Error updating form:', error);
      return NextResponse.json(
        { error: 'Failed to update form' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { formId } = params;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Check if form exists and belongs to hotel
      const existingForm = await prisma.feedbackForm.findFirst({
        where: {
          id: formId,
          hotelId: hotel.id,
        },
      });

      if (!existingForm) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      // Delete form (cascade will delete questions and reviews)
      await prisma.feedbackForm.delete({
        where: { id: formId },
      });

      return NextResponse.json({
        message: 'Form deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting form:', error);
      return NextResponse.json(
        { error: 'Failed to delete form' },
        { status: 500 }
      );
    }
  });
}
