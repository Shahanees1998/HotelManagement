import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Hotel access only' }, { status: 403 });
      }

      const paymentMethodId = params.id;

      // MongoDB ObjectID must be 24 hex characters
      if (!/^[a-f0-9]{24}$/i.test(paymentMethodId)) {
        return NextResponse.json(
          { error: 'Invalid payment method id' },
          { status: 400 }
        );
      }

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

      // First, set all payment methods for this hotel to not default
      await prisma.paymentMethod.updateMany({
        where: {
          hotelId: hotel.id
        },
        data: {
          isDefault: false
        }
      });

      // Then set the selected payment method as default
      await prisma.paymentMethod.update({
        where: {
          id: paymentMethodId
        },
        data: {
          isDefault: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Default payment method updated successfully'
      });
    } catch (error) {
      console.error('Error updating default payment method:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
