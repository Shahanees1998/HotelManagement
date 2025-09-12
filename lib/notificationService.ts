import { pusherServer } from './realtime';
import { prisma } from './prisma';

export interface NotificationData {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

export interface AdminNotificationData {
  id?: string;
  title: string;
  message: string;
  type: 'NEW_HOTEL_REGISTRATION' | 'NEW_SUBSCRIPTION' | 'NEW_FORM_CREATED' | 'NEW_SUPPORT_REQUEST' | 'NEW_FEEDBACK' | 'SYSTEM_ALERT';
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

// Send notification to specific user
export async function sendUserNotification(data: NotificationData) {
  try {
    // Save notification to database
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type as any,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    // Send real-time notification via Pusher
    await pusherServer.trigger(`user-${data.userId}`, 'new-notification', {
      id: notification.id,
      title: data.title,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      metadata: data.metadata,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (error) {
    console.error('Error sending user notification:', error);
    throw error;
  }
}

// Send notification to all admins
export async function sendAdminNotification(data: AdminNotificationData) {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    // Create notifications for all admins
    const notifications = await Promise.all(
      admins.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: data.title,
            message: data.message,
            type: data.type as any,
            relatedId: data.relatedId,
            relatedType: data.relatedType,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          },
        })
      )
    );

    // Send real-time notifications to all admins
    await Promise.all(
      admins.map(admin =>
        pusherServer.trigger(`user-${admin.id}`, 'new-notification', {
          id: notifications.find(n => n.userId === admin.id)?.id,
          title: data.title,
          message: data.message,
          type: data.type,
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          metadata: data.metadata,
          createdAt: new Date(),
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    throw error;
  }
}

// Send notification to global channel (for system-wide announcements)
export async function sendGlobalNotification(data: {
  title: string;
  message: string;
  type: 'SYSTEM_ALERT' | 'ANNOUNCEMENT';
  metadata?: any;
}) {
  try {
    // Send to global channel
    await pusherServer.trigger('global', 'global-notification', {
      title: data.title,
      message: data.message,
      type: data.type,
      metadata: data.metadata,
      timestamp: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error sending global notification:', error);
    throw error;
  }
}

// NotificationService class to wrap all notification functions
export class NotificationService {
  // Send notification to specific user
  static async sendUserNotification(data: NotificationData) {
    return sendUserNotification(data);
  }

  // Send notification to all admins
  static async sendAdminNotification(data: AdminNotificationData) {
    return sendAdminNotification(data);
  }

  // Send notification to global channel
  static async sendGlobalNotification(data: {
    title: string;
    message: string;
    type: 'SYSTEM_ALERT' | 'ANNOUNCEMENT';
    metadata?: any;
  }) {
    return sendGlobalNotification(data);
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: userId,
        },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return { count: result.count };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Create user joined notification
  static async createUserJoinedNotification(adminUserId: string, userName: string) {
    return sendUserNotification({
      id: `user-joined-${Date.now()}`,
      userId: adminUserId,
      title: 'New User Joined',
      message: `${userName} has joined the platform.`,
      type: 'INFO',
      relatedType: 'user',
    });
  }
}

// Notification templates for common actions
export const NotificationTemplates = {
  // Hotel registration
  hotelRegistered: (hotelName: string, hotelId: string) => ({
    title: 'New Hotel Registration',
    message: `Hotel "${hotelName}" has registered and is pending approval.`,
    type: 'NEW_HOTEL_REGISTRATION' as const,
    relatedId: hotelId,
    relatedType: 'hotel',
    metadata: { hotelName },
  }),

  // Subscription events
  subscriptionCreated: (hotelName: string, subscriptionId: string) => ({
    title: 'New Subscription',
    message: `Hotel "${hotelName}" has started a new subscription.`,
    type: 'NEW_SUBSCRIPTION' as const,
    relatedId: subscriptionId,
    relatedType: 'subscription',
    metadata: { hotelName },
  }),

  subscriptionExpired: (hotelName: string, subscriptionId: string) => ({
    title: 'Subscription Expired',
    message: `Hotel "${hotelName}" subscription has expired.`,
    type: 'SYSTEM_ALERT' as const,
    relatedId: subscriptionId,
    relatedType: 'subscription',
    metadata: { hotelName },
  }),

  // Form creation
  formCreated: (hotelName: string, formTitle: string, formId: string) => ({
    title: 'New Feedback Form',
    message: `Hotel "${hotelName}" created a new feedback form: "${formTitle}".`,
    type: 'NEW_FORM_CREATED' as const,
    relatedId: formId,
    relatedType: 'form',
    metadata: { hotelName, formTitle },
  }),

  // Support requests
  supportRequestCreated: (hotelName: string, subject: string, requestId: string) => ({
    title: 'New Support Request',
    message: `Hotel "${hotelName}" submitted a support request: "${subject}".`,
    type: 'NEW_SUPPORT_REQUEST' as const,
    relatedId: requestId,
    relatedType: 'support_request',
    metadata: { hotelName, subject },
  }),

  // Feedback submission
  feedbackSubmitted: (hotelName: string, rating: number, reviewId: string) => ({
    title: 'New Customer Feedback',
    message: `New ${rating}-star review received for "${hotelName}".`,
    type: 'NEW_FEEDBACK' as const,
    relatedId: reviewId,
    relatedType: 'review',
    metadata: { hotelName, rating },
  }),

  // User-specific notifications
  hotelApproved: (hotelName: string) => ({
    title: 'Hotel Approved',
    message: `Your hotel "${hotelName}" has been approved and is now active.`,
    type: 'SUCCESS' as const,
  }),

  hotelRejected: (hotelName: string, reason: string) => ({
    title: 'Hotel Registration Rejected',
    message: `Your hotel "${hotelName}" registration was rejected. Reason: ${reason}`,
    type: 'ERROR' as const,
    metadata: { reason },
  }),

  supportRequestResponded: (subject: string) => ({
    title: 'Support Request Response',
    message: `Your support request "${subject}" has been responded to.`,
    type: 'INFO' as const,
  }),

  subscriptionExpiring: (hotelName: string, daysLeft: number) => ({
    title: 'Subscription Expiring Soon',
    message: `Your subscription for "${hotelName}" expires in ${daysLeft} days.`,
    type: 'WARNING' as const,
    metadata: { daysLeft },
  }),
};