import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
      }

      // Get user with current password
      const userRecord = await prisma.user.findUnique({
        where: {
          id: user.userId
        },
        select: {
          id: true,
          password: true,
          email: true
        }
      });

      if (!userRecord) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!userRecord.password) {
        return NextResponse.json({ error: 'User has no password set' }, { status: 400 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRecord.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Check if new password is different from current password
      const isSamePassword = await bcrypt.compare(newPassword, userRecord.password);
      if (isSamePassword) {
        return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await prisma.user.update({
        where: {
          id: user.userId
        },
        data: {
          password: hashedNewPassword,
          isPasswordChanged: true,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}