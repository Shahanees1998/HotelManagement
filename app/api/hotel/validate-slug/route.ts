import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check if slug already exists
    const existingHotel = await prisma.hotels.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    return NextResponse.json({
      available: !existingHotel,
      slug,
      message: existingHotel 
        ? `Hotel URL "${slug}" is already taken by "${existingHotel.name}"`
        : `Hotel URL "${slug}" is available`,
    });
  } catch (error) {
    console.error('Error validating slug:', error);
    return NextResponse.json(
      { error: 'Failed to validate slug' },
      { status: 500 }
    );
  }
}
