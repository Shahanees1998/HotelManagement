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
      const { id } = params;
      
      if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { isActive } = body;

      // Validate that isActive is a boolean
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean value' },
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

      // Update hotel status
      const updatedHotel = await prisma.hotels.update({
        where: { id },
        data: {
          isActive,
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
        message: `Hotel ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: {
          id: updatedHotel.id,
          isActive: updatedHotel.isActive,
        },
      });
    } catch (error) {
      console.error('Error updating hotel status:', error);
      return NextResponse.json(
        { error: 'Failed to update hotel status' },
        { status: 500 }
      );
    }
  });
}

