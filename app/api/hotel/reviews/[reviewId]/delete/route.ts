import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { reviewId } = params;
      const { user } = authenticatedReq;

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

      // Check if already deleted
      if (review.isDeleted) {
        return NextResponse.json(
          { error: 'Review already deleted' },
          { status: 400 }
        );
      }

      // Soft delete the review
      await prisma.review.update({
        where: { id: reviewId },
        data: { isDeleted: true },
      });

      return NextResponse.json({ 
        message: 'Review deleted successfully',
        isDeleted: true
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }
  });
}
