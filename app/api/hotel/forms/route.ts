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

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortField = searchParams.get('sortField') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { 
        hotelId: hotel.id,
        isDeleted: false, // Exclude soft-deleted forms
      };
      
      if (status) {
        where.isActive = status === 'true';
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      if (sortField === 'title') {
        orderBy.title = sortOrder;
      } else if (sortField === 'questionsCount') {
        // We'll need to handle this differently since it's a computed field
        orderBy.createdAt = 'desc'; // Fallback to createdAt
      } else if (sortField === 'totalResponses') {
        // We'll need to handle this differently since it's a computed field
        orderBy.createdAt = 'desc'; // Fallback to createdAt
      } else {
        orderBy[sortField] = sortOrder;
      }

      // Get total count and paginated data in parallel
      const [forms, total] = await Promise.all([
        prisma.feedbackForm.findMany({
          where,
          skip,
          take: limit,
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
          orderBy,
        }),
        prisma.feedbackForm.count({ where })
      ]);

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

      return NextResponse.json({ 
        data: formsWithStats,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
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

      // Get hotel with subscription status
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { 
          id: true, 
          subscriptionStatus: true,
          currentPlan: true,
          trialEndsAt: true,
          subscriptionEndsAt: true
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Check subscription status - block form creation for cancelled/expired subscriptions
      if (hotel.subscriptionStatus === 'CANCELLED' || hotel.subscriptionStatus === 'EXPIRED') {
        return NextResponse.json(
          { 
            error: 'Form creation is not available. Your subscription has been cancelled or expired. Please reactivate your subscription to create forms.',
            subscriptionStatus: hotel.subscriptionStatus
          },
          { status: 403 }
        );
      }

      // Check if trial has expired
      if (hotel.subscriptionStatus === 'TRIAL' && hotel.trialEndsAt) {
        const now = new Date();
        if (now > hotel.trialEndsAt) {
          return NextResponse.json(
            { 
              error: 'Your trial period has expired. Please upgrade your subscription to continue creating forms.',
              subscriptionStatus: hotel.subscriptionStatus,
              trialEndsAt: hotel.trialEndsAt.toISOString()
            },
            { status: 403 }
          );
        }
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
            section: 'CUSTOM' as const,
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
          await NotificationCreators.newFormCreated(result.id, hotel.id, hotel.name, title);
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