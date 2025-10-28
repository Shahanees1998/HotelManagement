import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// Migration script to update existing forms to have 6 custom rating items instead of 5
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: { id: true, name: true },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Find all forms with custom rating that have less than 6 items
      const formsToUpdate = await prisma.feedbackForm.findMany({
        where: {
          hotelId: hotel.id,
          isDeleted: false,
          layout: { in: ['good', 'excellent'] }, // Only update good/excellent layout forms
        },
        include: {
          predefinedQuestions: {
            include: {
              customRatingItems: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });

      const updatedForms = [];
      const defaultItems = [
        { label: "Location Experience", order: 0 },
        { label: "Staff Service", order: 1 },
        { label: "Amenities", order: 2 },
        { label: "Ambiance", order: 3 },
        { label: "Food", order: 4 },
        { label: "Cleanliness", order: 5 },
      ];

      for (const form of formsToUpdate) {
        if (form.predefinedQuestions?.hasCustomRating && 
            form.predefinedQuestions.customRatingItems.length < 6) {
          
          const existingItems = form.predefinedQuestions.customRatingItems;
          const existingLabels = existingItems.map(item => item.label);
          
          // Find missing items
          const missingItems = defaultItems.filter(item => 
            !existingLabels.includes(item.label)
          );

          if (missingItems.length > 0) {
            // Add missing items
            const itemsToCreate = missingItems.map(item => ({
              predefinedSectionId: form.predefinedQuestions!.id,
              label: item.label,
              order: item.order,
              isActive: true,
            }));

            await prisma.customRatingItem.createMany({
              data: itemsToCreate,
            });

            updatedForms.push({
              formId: form.id,
              formTitle: form.title,
              addedItems: missingItems.map(item => item.label),
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${updatedForms.length} forms`,
        data: {
          updatedForms,
          totalFormsChecked: formsToUpdate.length,
        },
      });
    } catch (error) {
      console.error('Error migrating custom rating items:', error);
      return NextResponse.json(
        { error: 'Failed to migrate custom rating items' },
        { status: 500 }
      );
    }
  });
}
