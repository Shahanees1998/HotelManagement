import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/session
 * Get current user session with fresh data from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch complete user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        profileImage: true,
        profileImagePublicId: true,
        lastLogin: true,
        isPasswordChanged: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // For hotel users, fetch hotel information
    let hotelData = null;
    if (user.role === 'HOTEL') {
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.id },
        select: { id: true, slug: true, name: true },
      });
      hotelData = hotel;
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        hotelId: hotelData?.id || null,
        hotelSlug: hotelData?.slug || null,
        hotelName: hotelData?.name || null,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
