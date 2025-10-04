import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/hotel/qr-codes/by-form/[formId] - Get QR code for a specific form
export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const token = AuthService.getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await AuthService.verifyToken(token);
    if (payload.role !== 'HOTEL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { formId } = params;

    // Verify form exists and belongs to hotel
    const form = await prisma.feedbackForm.findFirst({
      where: {
        id: formId,
        hotelId: payload.hotelId,
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Feedback form not found' }, { status: 404 });
    }

    // Get QR code for this form
    const qrCode = await prisma.qRCode.findFirst({
      where: {
        hotelId: payload.hotelId,
        formId: formId,
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found for this form' }, { status: 404 });
    }

    return NextResponse.json({
      id: qrCode.id,
      code: qrCode.code,
      url: qrCode.url,
      formId: qrCode.formId,
      scanCount: qrCode.scanCount,
      isActive: qrCode.isActive,
      createdAt: qrCode.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get QR code by form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

