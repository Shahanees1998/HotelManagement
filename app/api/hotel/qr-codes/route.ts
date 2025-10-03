import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService } from '@/lib/auth';

// GET /api/hotel/qr-codes - Get hotel's QR codes
export async function GET(request: NextRequest) {
  try {
    const token = AuthService.getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await AuthService.verifyToken(token);
    if (payload.role !== 'HOTEL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Verify hotel ownership
    const hotel = await prisma.hotels.findFirst({
      where: {
        id: hotelId,
        ownerId: payload.userId,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const qrCodes = await prisma.qRCode.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'desc' },
    });

    // Get form titles for QR codes that have formId
    const formIds = qrCodes.filter(qr => qr.formId).map(qr => qr.formId).filter((id): id is string => id !== null);
    const forms = formIds.length > 0 ? await prisma.feedbackForm.findMany({
      where: { id: { in: formIds } },
      select: { id: true, title: true },
    }) : [];

    const formMap = new Map(forms.map(form => [form.id, form.title]));

    const formattedQrCodes = qrCodes.map(qr => ({
      id: qr.id,
      code: qr.code,
      url: qr.url,
      formId: qr.formId,
      formTitle: qr.formId ? formMap.get(qr.formId) : null,
      scanCount: qr.scanCount,
      isActive: qr.isActive,
      createdAt: qr.createdAt.toISOString(),
    }));

    return NextResponse.json(formattedQrCodes);
  } catch (error) {
    console.error('Get QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hotel/qr-codes - Create new QR code
export async function POST(request: NextRequest) {
  try {
    const token = AuthService.getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await AuthService.verifyToken(token);
    if (payload.role !== 'HOTEL') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hotelId, formId } = body;

    if (!hotelId) {
      return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });
    }

    // Verify hotel ownership
    const hotel = await prisma.hotels.findFirst({
      where: {
        id: hotelId,
        ownerId: payload.userId,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Verify form exists and belongs to hotel
    if (formId) {
      const form = await prisma.feedbackForm.findFirst({
        where: {
          id: formId,
          hotelId: hotel.id,
        },
      });

      if (!form) {
        return NextResponse.json({ error: 'Feedback form not found' }, { status: 404 });
      }
    }

    // Generate unique QR code
    const code = `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hotel-management-xmr3.vercel.app';
    const url = formId 
      ? `${baseUrl}/feedback/${hotel.slug}/${formId}`
      : `${baseUrl}/feedback/${hotel.slug}`;

    const qrCode = await prisma.qRCode.create({
      data: {
        hotelId: hotel.id,
        formId: formId || null,
        code,
        url,
      },
    });

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
    console.error('Create QR code error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
