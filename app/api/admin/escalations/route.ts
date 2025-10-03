import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (authenticatedReq.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const escalations = await prisma.adminEscalation.findMany({
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Transform the data to match the expected interface
      const transformedEscalations = escalations.map(escalation => ({
        id: escalation.id,
        subject: escalation.subject,
        message: escalation.message,
        status: escalation.status,
        priority: escalation.priority,
        hotelName: escalation.user.hotel?.name,
        hotelSlug: escalation.user.hotel?.slug,
        userName: `${escalation.user.firstName} ${escalation.user.lastName}`,
        userEmail: escalation.user.email,
        createdAt: escalation.createdAt.toISOString(),
        updatedAt: escalation.updatedAt.toISOString(),
        adminResponse: escalation.adminResponse,
      }));

      return NextResponse.json({ data: transformedEscalations });
    } catch (error) {
      console.error('Error fetching escalations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch escalations' },
        { status: 500 }
      );
    }
  });
}

// POST /api/admin/escalations - Create new escalation
export async function POST(request: NextRequest) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      // Check if user is admin
      if (authenticatedReq.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { supportRequestId, subject, message, priority, escalationReason } = body;

      // Validate required fields
      if (!supportRequestId || !subject || !message || !escalationReason) {
        return NextResponse.json(
          { error: 'Support request ID, subject, message, and escalation reason are required' },
          { status: 400 }
        );
      }

      // Get the original support request
      const supportRequest = await prisma.supportRequest.findUnique({
        where: { id: supportRequestId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              hotel: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      });

      if (!supportRequest) {
        return NextResponse.json(
          { error: 'Support request not found' },
          { status: 404 }
        );
      }

      // Create escalation record
      const escalation = await prisma.adminEscalation.create({
        data: {
          userId: supportRequest.userId,
          subject,
          message,
          status: 'OPEN',
          priority: priority || 'HIGH',
          adminResponse: `Escalated by admin. Reason: ${escalationReason}`,
        },
      });

      // Update support request status to ESCALATED
      await prisma.supportRequest.update({
        where: { id: supportRequestId },
        data: {
          status: 'ESCALATED',
          adminResponse: `Escalated: ${escalationReason}`,
        },
      });

      // Send notifications
      try {
        const { NotificationService } = await import('@/lib/notificationService');
        
        const hotelName = supportRequest.user.hotel?.name || 'Unknown Hotel';

        // Send notification to admins about escalation
        await NotificationService.notifyAdmins(
          'Support Request Escalated',
          `${hotelName}'s support request has been escalated: ${subject}`,
          'ESCALATION_RECEIVED',
          escalation.id,
          'escalation'
        );

        // Send notification to hotel about escalation
        await NotificationService.createNotification({
          userId: supportRequest.userId,
          title: 'Support Request Escalated',
          message: `Your support request "${supportRequest.subject}" has been escalated to management. Reason: ${escalationReason}`,
          type: 'INFO',
          relatedId: escalation.id,
          relatedType: 'escalation',
        });

        console.log('Escalation notifications sent successfully');
      } catch (notificationError) {
        console.error('Error sending escalation notifications:', notificationError);
        // Don't fail the escalation if notifications fail
      }

      return NextResponse.json({
        message: 'Support request escalated successfully',
        data: {
          id: escalation.id,
          subject: escalation.subject,
          message: escalation.message,
          status: escalation.status,
          priority: escalation.priority,
          createdAt: escalation.createdAt.toISOString(),
        },
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating escalation:', error);
      return NextResponse.json(
        { error: 'Failed to create escalation' },
        { status: 500 }
      );
    }
  });
}