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

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const priority = searchParams.get('priority');
      const search = searchParams.get('search');
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortField = searchParams.get('sortField') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const skip = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = { userId: user.userId };
      
      if (status) {
        where.status = status;
      }
      
      if (priority) {
        where.priority = priority;
      }
      
      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { message: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Build orderBy clause
      const orderBy: any = {};
      if (sortField === 'subject') {
        orderBy.subject = sortOrder;
      } else if (sortField === 'status') {
        orderBy.status = sortOrder;
      } else if (sortField === 'priority') {
        orderBy.priority = sortOrder;
      } else {
        orderBy[sortField] = sortOrder;
      }

      // Get total count and paginated data in parallel
      const [requests, total] = await Promise.all([
        prisma.supportRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        prisma.supportRequest.count({ where })
      ]);

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

      return NextResponse.json({ 
        data: formattedRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
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
      const supportRequest = await prisma.supportRequest.create({
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
        const { NotificationService } = await import('@/lib/notificationService');
        
        // Get hotel info for notification
        const hotel = await prisma.hotels.findUnique({
          where: { ownerId: user.userId },
          select: { id: true, name: true },
        });

        const hotelName = hotel?.name || 'Unknown Hotel';

        // Send notification to admins
        await NotificationService.notifyAdmins(
          'New Support Request',
          `${hotelName} submitted a support request: ${subject}`,
          'ESCALATION_RECEIVED',
          supportRequest.id,
          'support_request'
        );

        // Send confirmation notification to user
        await NotificationService.createNotification({
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
