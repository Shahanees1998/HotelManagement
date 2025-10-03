import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { NotificationService } from '@/lib/notificationService';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const isRead = searchParams.get('isRead');
      const type = searchParams.get('type');
      const limit = searchParams.get('limit');
      const offset = searchParams.get('offset');

      const filters = {
        userId: user.userId,
        isRead: isRead ? isRead === 'true' : undefined,
        type: type as any,
        limit: limit ? parseInt(limit) : 50,
        offset: offset ? parseInt(offset) : 0,
      };

      const notifications = await NotificationService.getNotifications(filters);
      const unreadCount = await NotificationService.getUnreadCount(user.userId);

      return NextResponse.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}