import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { firstName, lastName, email, phone, profileImage } = body;

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: {
          id: user.userId
        },
        data: {
          firstName,
          lastName,
          email,
          phone,
          profileImage
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          profileImage: true,
          role: true,
          createdAt: true,
          lastLogin: true
        }
      });

      return NextResponse.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
