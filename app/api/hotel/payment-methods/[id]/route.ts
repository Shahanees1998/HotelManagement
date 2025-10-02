import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const paymentMethodId = params.id;

      // Get user's hotel
      const hotel = await prisma.hotels.findFirst({
        where: {
          ownerId: user.userId
        }
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Check if payment method belongs to the hotel
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          hotelId: hotel.id
        }
      });

      if (!paymentMethod) {
        return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
      }

      // Delete payment method
      await prisma.paymentMethod.delete({
        where: {
          id: paymentMethodId
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment method deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
