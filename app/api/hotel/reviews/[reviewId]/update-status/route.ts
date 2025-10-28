import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { reviewId } = params;
      const { user } = authenticatedReq;
      const body = await request.json();
      const { isChecked, isUrgent, isReplied } = body;

      // Get the review and verify ownership
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          hotel: {
            select: {
              ownerId: true,
            },
          },
        },
      });

      if (!review) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }

      // Check if user has access to this review
      if (user?.role === 'HOTEL_OWNER' && review.hotel.ownerId !== user?.userId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      // Update the review
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(isChecked !== undefined && { isChecked }),
          ...(isUrgent !== undefined && { isUrgent }),
          ...(isReplied !== undefined && { isReplied }),
        },
      });

      return NextResponse.json({ 
        data: {
          id: updatedReview.id,
          isChecked: updatedReview.isChecked,
          isUrgent: updatedReview.isUrgent,
          isReplied: updatedReview.isReplied,
        }
      });
    } catch (error) {
      console.error('Error updating review status:', error);
      return NextResponse.json(
        { error: 'Failed to update review status' },
        { status: 500 }
      );
    }
  });
}
