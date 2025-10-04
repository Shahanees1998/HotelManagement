import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { id } = params;
      
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel with owner information
      const hotel = await prisma.hotels.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!hotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      return NextResponse.json({ data: hotel });
    } catch (error) {
      console.error('Error fetching hotel:', error);
      return NextResponse.json(
        { error: 'Failed to fetch hotel' },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      const { id } = params;
      
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { name, slug, email, phone, city, country, description, address, website } = body;

      // Validate required fields
      if (!name || !slug || !email || !city || !country) {
        return NextResponse.json(
          { error: 'Name, slug, email, city, and country are required' },
          { status: 400 }
        );
      }

      // Check if hotel exists
      const existingHotel = await prisma.hotels.findUnique({
        where: { id },
      });

      if (!existingHotel) {
        return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      }

      // Check if slug is already taken by another hotel
      const slugExists = await prisma.hotels.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'URL slug is already taken by another hotel' },
          { status: 400 }
        );
      }

      // Update hotel
      const updatedHotel = await prisma.hotels.update({
        where: { id },
        data: {
          name,
          slug,
          email,
          phone: phone || null,
          city,
          country,
          description: description || null,
          address: address || null,
          website: website || null,
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return NextResponse.json({
        message: 'Hotel updated successfully',
        data: updatedHotel,
      });
    } catch (error) {
      console.error('Error updating hotel:', error);
      return NextResponse.json(
        { error: 'Failed to update hotel' },
        { status: 500 }
      );
    }
  });
}

