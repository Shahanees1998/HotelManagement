import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/public/hotel/[hotelSlug] - Get hotel information by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { hotelSlug: string } }
) {
  try {
    const { hotelSlug } = params;

    const hotel = await prisma.hotels.findFirst({
      where: {
        slug: hotelSlug,
        isActive: true, // Only show active hotels
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        createdAt: true,
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    console.error('Get hotel error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
