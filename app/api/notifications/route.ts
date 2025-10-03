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
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      const filters = {
        userId: user.userId,
        isRead: isRead ? isRead === 'true' : undefined,
        type: type as any,
        search: search || undefined,
        limit,
        offset,
      };

      console.log('Fetching notifications for user:', user.userId, 'with filters:', filters);
      const result = await NotificationService.getNotificationsWithPagination(filters);
      const unreadCount = await NotificationService.getUnreadCount(user.userId);
      console.log('Found notifications:', result.notifications.length, 'total:', result.total, 'unread count:', unreadCount);

      return NextResponse.json({
        success: true,
        data: result.notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
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