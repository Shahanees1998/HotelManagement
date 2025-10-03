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
      const hotel = await prisma.hotels.findUnique({
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
          predefinedQuestions: {
            include: {
              customRatingItems: {
                orderBy: { order: 'asc' },
              },
            },
          },
          customQuestions: {
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
        questionsCount: (form.predefinedQuestions ? 1 : 0) + (form.customQuestions?.length || 0),
        totalResponses: form.reviews.length,
        predefinedQuestions: form.predefinedQuestions ? {
          hasRateUs: form.predefinedQuestions.hasRateUs,
          hasCustomRating: form.predefinedQuestions.hasCustomRating,
          hasFeedback: form.predefinedQuestions.hasFeedback,
          customRatingItems: form.predefinedQuestions.customRatingItems.map(item => ({
            id: item.id,
            label: item.label,
            order: item.order,
            isActive: item.isActive,
          })),
        } : null,
        customQuestions: form.customQuestions?.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          isRequired: q.isRequired,
          order: q.order,
          options: q.options,
          validation: q.validation,
          section: q.section,
        })) || [],
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
      const { title, description, isActive, isPublic, layout, predefinedSection, customQuestions } = body;

      // Validate required fields
      if (!title) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      // Get hotel
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Validate custom questions if provided
      if (customQuestions && Array.isArray(customQuestions)) {
        for (const question of customQuestions) {
          if (!question.question || !question.type) {
            return NextResponse.json(
              { error: 'Each custom question must have text and type' },
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

        // Create predefined questions section if provided
        if (predefinedSection) {
          const predefinedSectionData = await tx.predefinedQuestionSection.create({
            data: {
              formId: form.id,
              hasRateUs: predefinedSection.hasRateUs || false,
              hasCustomRating: predefinedSection.hasCustomRating || false,
              hasFeedback: predefinedSection.hasFeedback || false,
            },
          });

          // Create custom rating items if custom rating is enabled
          if (predefinedSection.hasCustomRating && predefinedSection.customRatingItems) {
            const customRatingItemsData = predefinedSection.customRatingItems.map((item: any, index: number) => ({
              predefinedSectionId: predefinedSectionData.id,
              label: item.label,
              order: item.order || index,
              isActive: item.isActive !== undefined ? item.isActive : true,
            }));

            await tx.customRatingItem.createMany({
              data: customRatingItemsData,
            });
          }
        }

        // Create custom questions if provided
        if (customQuestions && customQuestions.length > 0) {
          const customQuestionsData = customQuestions.map((q: any, index: number) => ({
            formId: form.id,
            question: q.question,
            type: q.type,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            order: q.order || index,
            options: q.options || [],
            validation: q.validation || null,
            section: 'CUSTOM',
          }));

          await tx.formQuestion.createMany({
            data: customQuestionsData,
          });
        }

        return form;
      });

      // Send notification to admins about new form creation
      try {
        const { NotificationCreators } = await import('@/lib/notificationService');
        
        // Get hotel info for notification
        const hotel = await prisma.hotels.findUnique({
          where: { ownerId: user.userId },
          select: { id: true, name: true },
        });

        if (hotel) {
          await NotificationCreators.newFormCreated(hotel.id, hotel.name, title);
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