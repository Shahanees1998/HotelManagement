import { prisma } from './prisma';
import { pusherServer, CHANNELS, NOTIFICATION_EVENTS } from './pusher';
import { NotificationType, UserRole } from '@prisma/client';

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

export interface NotificationFilters {
  userId?: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  // Create a new notification
  static async createNotification(data: CreateNotificationData) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Send real-time notification
      await this.sendRealtimeNotification(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users (for admin notifications)
  static async createBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    relatedId?: string,
    relatedType?: string,
    metadata?: any
  ) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId =>
          prisma.notification.create({
            data: {
              userId,
              title,
              message,
              type,
              relatedId,
              relatedType,
              metadata: metadata ? JSON.stringify(metadata) : null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  role: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        )
      );

      // Send real-time notifications
      await Promise.all(
        notifications.map(notification => this.sendRealtimeNotification(notification))
      );

      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Send notification to all admins
  static async notifyAdmins(
    title: string,
    message: string,
    type: NotificationType,
    relatedId?: string,
    relatedType?: string,
    metadata?: any
  ) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      const adminIds = admins.map(admin => admin.id);
      
      if (adminIds.length > 0) {
        return await this.createBulkNotifications(
          adminIds,
          title,
          message,
          type,
          relatedId,
          relatedType,
          metadata
        );
      }

      return [];
    } catch (error) {
      console.error('Error notifying admins:', error);
      throw error;
    }
  }

  // Send notification to specific hotel
  static async notifyHotel(
    hotelId: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedId?: string,
    relatedType?: string,
    metadata?: any
  ) {
    try {
      const hotel = await prisma.hotels.findUnique({
        where: { id: hotelId },
        select: { ownerId: true },
      });

      if (hotel) {
        return await this.createNotification({
          userId: hotel.ownerId,
          title,
          message,
          type,
          relatedId,
          relatedType,
          metadata,
        });
      }

      return null;
    } catch (error) {
      console.error('Error notifying hotel:', error);
      throw error;
    }
  }

  // Get notifications for a user
  static async getNotifications(filters: NotificationFilters) {
    try {
      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.isRead !== undefined) where.isRead = filters.isRead;
      if (filters.type) where.type = filters.type;

      const notifications = await prisma.notification.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      });

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: { isRead: true },
      });

      // Send real-time update
      await pusherServer.trigger(
        CHANNELS.USER(userId),
        NOTIFICATION_EVENTS.NOTIFICATION_READ,
        { notificationId }
      );

      return notification;
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

      // Send real-time update
      await pusherServer.trigger(
        CHANNELS.USER(userId),
        NOTIFICATION_EVENTS.MARK_ALL_READ,
        { count: result.count }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for a user
  static async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId,
        },
      });

      // Send real-time update
      await pusherServer.trigger(
        CHANNELS.USER(userId),
        NOTIFICATION_EVENTS.NOTIFICATION_DELETED,
        { notificationId }
      );

      return notification;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Send real-time notification via Pusher
  private static async sendRealtimeNotification(notification: any) {
    try {
      const user = notification.user;
      const channel = user.role === UserRole.ADMIN 
        ? CHANNELS.ADMIN 
        : CHANNELS.USER(user.id);

      await pusherServer.trigger(
        channel,
        NOTIFICATION_EVENTS.NEW_NOTIFICATION,
        {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          relatedId: notification.relatedId,
          relatedType: notification.relatedType,
          metadata: notification.metadata,
        }
      );
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }
}

// Specific notification creators for different events
export const NotificationCreators = {
  // Admin notifications
  newHotelRegistered: async (hotelId: string, hotelName: string) => {
    return await NotificationService.notifyAdmins(
      'New Hotel Registered',
      `${hotelName} has registered on the platform`,
      'NEW_HOTEL_REGISTRATION',
      hotelId,
      'hotel'
    );
  },

  newReview: async (hotelId: string, hotelName: string, rating: number) => {
    return await NotificationService.notifyAdmins(
      'New Review Received',
      `${hotelName} received a ${rating}-star review`,
      'NEW_REVIEW',
      hotelId,
      'hotel'
    );
  },

  newFormCreated: async (hotelId: string, hotelName: string, formTitle: string) => {
    return await NotificationService.notifyAdmins(
      'New Form Created',
      `${hotelName} created a new form: ${formTitle}`,
      'NEW_FORM_CREATED',
      hotelId,
      'form'
    );
  },

  paymentMethodAdded: async (hotelId: string, hotelName: string) => {
    return await NotificationService.notifyAdmins(
      'Payment Method Added',
      `${hotelName} added a new payment method`,
      'SYSTEM_ALERT',
      hotelId,
      'payment_method'
    );
  },

  // Hotel notifications
  adminAction: async (hotelId: string, action: string, details: string) => {
    return await NotificationService.notifyHotel(
      hotelId,
      'Admin Action',
      `Admin performed action: ${action}. ${details}`,
      'SYSTEM_ALERT',
      hotelId,
      'admin_action',
      { action, details }
    );
  },

  newFeedback: async (hotelId: string, guestName: string, rating: number) => {
    return await NotificationService.notifyHotel(
      hotelId,
      'New Guest Feedback',
      `${guestName} left a ${rating}-star feedback`,
      'NEW_REVIEW',
      hotelId,
      'review',
      { guestName, rating }
    );
  },

  reviewStatusChanged: async (hotelId: string, status: string, reviewId: string) => {
    return await NotificationService.notifyHotel(
      hotelId,
      'Review Status Updated',
      `Your review has been ${status.toLowerCase()}`,
      status === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED',
      reviewId,
      'review'
    );
  },
};