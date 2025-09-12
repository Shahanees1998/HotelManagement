import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/profile - Get hotel profile data
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel data
      const hotel = await prisma.hotels.findUnique({
        where: { ownerId: user.userId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          website: true,
          logo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      return NextResponse.json({ data: hotel });
    } catch (error) {
      console.error('Error fetching hotel profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotel profile' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/hotel/profile - Update hotel profile
export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { name, slug, description, address, city, country, phone, email, website } = body;

      // Validate required fields
      if (!name || !slug) {
        return NextResponse.json(
          { error: 'Name and slug are required' },
          { status: 400 }
        );
      }

      // Check if slug is already taken by another hotel
      const existingHotel = await prisma.hotels.findFirst({
        where: {
          slug: slug,
          ownerId: { not: user.userId }, // Exclude current hotel
        },
      });

      if (existingHotel) {
        return NextResponse.json(
          { error: 'Hotel URL already exists. Please choose a different one.' },
          { status: 400 }
        );
      }

      // Update hotel
      const updatedHotel = await prisma.hotels.update({
        where: { ownerId: user.userId },
        data: {
          name,
          slug,
          description: description || null,
          address: address || null,
          city: city || null,
          country: country || null,
          phone: phone || null,
          email: email || null,
          website: website || null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          address: true,
          city: true,
          country: true,
          phone: true,
          email: true,
          website: true,
          logo: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        message: 'Hotel profile updated successfully',
        data: updatedHotel,
      });
    } catch (error) {
      console.error('Error updating hotel profile:', error);
      return NextResponse.json(
        { error: 'Failed to update hotel profile' },
        { status: 500 }
      );
    }
  });
}
