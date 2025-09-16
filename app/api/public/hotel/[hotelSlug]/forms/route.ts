import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/hotel/[hotelSlug]/forms - Get public feedback forms for a hotel
export async function GET(
  request: NextRequest,
  { params }: { params: { hotelSlug: string } }
) {
  try {
    const { hotelSlug } = params;

    // First, find the hotel by slug
    const hotel = await prisma.hotels.findFirst({
      where: {
        slug: hotelSlug,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    // Get public feedback forms for this hotel
    const forms = await prisma.feedbackForm.findMany({
      where: {
        hotelId: hotel.id,
        isActive: true,
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        layout: true,
        isActive: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error('Get hotel forms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
