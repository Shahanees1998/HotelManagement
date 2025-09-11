import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
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

      // Get forms with questions
      const forms = await prisma.feedbackForm.findMany({
        where: { hotelId: hotel.id },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          reviews: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formsWithStats = forms.map(form => ({
        id: form.id,
        title: form.title,
        description: form.description,
        isActive: form.isActive,
        isPublic: form.isPublic,
        layout: form.layout || 'basic',
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
        questionsCount: form.questions.length,
        totalResponses: form.reviews.length,
        questions: form.questions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          isRequired: q.isRequired,
          order: q.order,
          options: q.options,
          validation: q.validation,
          isDefault: q.isDefault || false,
        })),
      }));

      return NextResponse.json({ data: formsWithStats });
    } catch (error) {
      console.error('Error fetching forms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch forms' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { title, description, isActive, isPublic, layout, questions } = body;

      // Validate required fields
      if (!title || !questions || !Array.isArray(questions)) {
        return NextResponse.json(
          { error: 'Title and questions are required' },
          { status: 400 }
        );
      }

      // Get hotel
      const hotel = await prisma.hotel.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Validate questions
      for (const question of questions) {
        if (!question.question || !question.type) {
          return NextResponse.json(
            { error: 'Each question must have text and type' },
            { status: 400 }
          );
        }

        // Validate options for multiple choice questions
        if ((question.type === 'MULTIPLE_CHOICE_SINGLE' || question.type === 'MULTIPLE_CHOICE_MULTIPLE') && 
            (!question.options || question.options.length < 2)) {
          return NextResponse.json(
            { error: 'Multiple choice questions must have at least 2 options' },
            { status: 400 }
          );
        }
      }

      // Create form with questions in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create form
        const form = await tx.feedbackForm.create({
          data: {
            title,
            description: description || null,
            isActive: isActive !== undefined ? isActive : true,
            isPublic: isPublic !== undefined ? isPublic : true,
            layout: layout || 'basic',
            hotelId: hotel.id,
          },
        });

        // Create default rating question first (order 0)
        const defaultRatingQuestion = {
          formId: form.id,
          question: "How do you rate us?",
          type: "STAR_RATING",
          isRequired: true,
          order: 0,
          options: [],
          validation: null,
          isDefault: true, // Mark as default question
        };

        // Create custom questions (starting from order 1)
        const customQuestionsData = questions.map((q: any, index: number) => ({
          formId: form.id,
          question: q.question,
          type: q.type,
          isRequired: q.isRequired !== undefined ? q.isRequired : true,
          order: index + 1,
          options: q.options || [],
          validation: q.validation || null,
          isDefault: false,
        }));

        // Create all questions (default + custom)
        await tx.formQuestion.createMany({
          data: [defaultRatingQuestion, ...customQuestionsData],
        });

        return form;
      });

      // Send notification to admins about new form creation
      try {
        const { sendAdminNotification, NotificationTemplates } = await import('@/lib/notificationService');
        
        // Get hotel info for notification
        const hotel = await prisma.hotel.findUnique({
          where: { id: user.hotelId },
          select: { name: true },
        });

        if (hotel) {
          await sendAdminNotification(
            NotificationTemplates.formCreated(hotel.name, formData.title, result.id)
          );
        }
      } catch (notificationError) {
        console.error('Error sending form creation notification:', notificationError);
        // Don't fail the form creation if notifications fail
      }

      return NextResponse.json({
        message: 'Form created successfully',
        data: { formId: result.id },
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating form:', error);
      return NextResponse.json(
        { error: 'Failed to create form' },
        { status: 500 }
      );
    }
  });
}