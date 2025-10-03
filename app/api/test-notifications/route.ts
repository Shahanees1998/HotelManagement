import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { NotificationService } from '@/lib/notificationService';

// POST /api/test-notifications - Create test notifications
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Only allow admins to create test notifications
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Create some test notifications
      const testNotifications = [
        {
          userId: user.userId,
          title: 'Test Notification 1',
          message: 'This is a test notification to verify the system is working.',
          type: 'SYSTEM_ALERT' as const,
          relatedId: 'test-1',
          relatedType: 'test',
        },
        {
          userId: user.userId,
          title: 'New Hotel Registration',
          message: 'Test Hotel has registered on the platform.',
          type: 'NEW_HOTEL_REGISTRATION' as const,
          relatedId: 'test-hotel-1',
          relatedType: 'hotel',
        },
        {
          userId: user.userId,
          title: 'New Review Received',
          message: 'Test Hotel received a new 5-star review.',
          type: 'NEW_REVIEW' as const,
          relatedId: 'test-review-1',
          relatedType: 'review',
        },
        {
          userId: user.userId,
          title: 'Payment Method Added',
          message: 'Test Hotel added a new payment method.',
          type: 'SUCCESS' as const,
          relatedId: 'test-payment-1',
          relatedType: 'payment',
        },
        {
          userId: user.userId,
          title: 'Form Created',
          message: 'Test Hotel created a new feedback form.',
          type: 'NEW_FORM_CREATED' as const,
          relatedId: 'test-form-1',
          relatedType: 'form',
        },
      ];

      const createdNotifications = [];
      for (const notificationData of testNotifications) {
        try {
          const notification = await NotificationService.createNotification(notificationData);
          createdNotifications.push(notification);
        } catch (error) {
          console.error('Error creating test notification:', error);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Created ${createdNotifications.length} test notifications`,
        notifications: createdNotifications,
      });
    } catch (error) {
      console.error('Error creating test notifications:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
