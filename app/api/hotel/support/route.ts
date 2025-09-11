import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

// GET /api/hotel/support - Get hotel's support requests
export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get hotel's support requests
      const requests = await prisma.adminEscalation.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
      });

      const formattedRequests = requests.map(request => ({
        id: request.id,
        subject: request.subject,
        message: request.message,
        status: request.status,
        priority: request.priority,
        adminResponse: request.adminResponse,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      }));

      return NextResponse.json({ data: formattedRequests });
    } catch (error) {
      console.error('Error fetching support requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch support requests' },
        { status: 500 }
      );
    }
  });
}

// POST /api/hotel/support - Create new support request
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const user = authenticatedReq.user;
      
      if (!user || user.role !== 'HOTEL') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { subject, message, priority } = body;

      // Validate required fields
      if (!subject || !message) {
        return NextResponse.json(
          { error: 'Subject and message are required' },
          { status: 400 }
        );
      }

      // Create support request
      const supportRequest = await prisma.adminEscalation.create({
        data: {
          userId: user.userId,
          subject,
          message,
          status: 'OPEN',
          priority: priority || 'MEDIUM',
        },
      });

      // Send notifications
      try {
        const { sendAdminNotification, sendUserNotification, NotificationTemplates } = await import('@/lib/notificationService');
        
        // Get hotel info for notification
        const hotel = await prisma.hotel.findUnique({
          where: { ownerId: user.userId },
          select: { name: true },
        });

        const hotelName = hotel?.name || 'Unknown Hotel';

        // Send notification to admins
        await sendAdminNotification(
          NotificationTemplates.supportRequestCreated(hotelName, subject, supportRequest.id)
        );

        // Send confirmation notification to user
        await sendUserNotification({
          id: supportRequest.id,
          userId: user.userId,
          title: 'Support Request Submitted',
          message: `Your support request "${subject}" has been submitted successfully.`,
          type: 'SUCCESS',
          relatedId: supportRequest.id,
          relatedType: 'support_request',
        });

        console.log('Support request notifications sent successfully');
      } catch (notificationError) {
        console.error('Error sending support request notifications:', notificationError);
        // Don't fail the support request creation if notifications fail
      }

      return NextResponse.json({
        message: 'Support request created successfully',
        data: {
          id: supportRequest.id,
          subject: supportRequest.subject,
          message: supportRequest.message,
          status: supportRequest.status,
          priority: supportRequest.priority,
          createdAt: supportRequest.createdAt.toISOString(),
        },
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating support request:', error);
      return NextResponse.json(
        { error: 'Failed to create support request' },
        { status: 500 }
      );
    }
  });
}
