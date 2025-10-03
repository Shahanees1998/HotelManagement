import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

      // Get payment methods for the hotel
      const paymentMethods = await prisma.paymentMethod.findMany({
        where: {
          hotelId: hotel.id
        },
        orderBy: {
          isDefault: 'desc'
        }
      });

      return NextResponse.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { type, cardNumber, expiryMonth, expiryYear, cvv, cardholderName, brand, bankName, accountNumber, routingNumber, accountType } = body;

      // Get user's hotel
      const hotel = await prisma.hotels.findFirst({
        where: {
          ownerId: user.userId
        }
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Create payment method
      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          hotelId: hotel.id,
          type: type.toUpperCase() as 'CARD' | 'BANK',
          last4: type === 'card' ? cardNumber.slice(-4) : accountNumber.slice(-4),
          brand: type === 'card' ? brand : null,
          expiryMonth: type === 'card' ? parseInt(expiryMonth) : null,
          expiryYear: type === 'card' ? parseInt(expiryYear) : null,
          bankName: type === 'bank' ? bankName : null,
          accountType: type === 'bank' ? accountType : null,
          isDefault: false, // New payment methods are not default by default
          // In a real app, you would store encrypted card details here
          encryptedData: JSON.stringify({
            cardNumber: type === 'card' ? cardNumber : null,
            cvv: type === 'card' ? cvv : null,
            accountNumber: type === 'bank' ? accountNumber : null,
            routingNumber: type === 'bank' ? routingNumber : null,
          })
        }
      });

      // Send notification to admins
      try {
        const { NotificationCreators } = await import('@/lib/notificationService');
        await NotificationCreators.paymentMethodAdded(hotel.id, hotel.name);
        console.log('Payment method notification sent successfully');
      } catch (notificationError) {
        console.error('Error sending payment method notification:', notificationError);
        // Don't fail the creation if notifications fail
      }

      return NextResponse.json({
        success: true,
        data: paymentMethod
      });
    } catch (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
