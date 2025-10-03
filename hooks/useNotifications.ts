import { useState, useEffect, useCallback } from 'react';
import { pusherClient, CHANNELS, NOTIFICATION_EVENTS } from '@/lib/pusher';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
}

export interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        );
        // Check if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Setup Pusher real-time updates
  useEffect(() => {
    if (!user) return;

    const channelName = user.role === 'ADMIN' 
      ? CHANNELS.ADMIN 
      : CHANNELS.USER(user.id);

    const channel = pusherClient.subscribe(channelName);

    // Handle new notification
    channel.bind(NOTIFICATION_EVENTS.NEW_NOTIFICATION, (data: Notification) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Handle notification marked as read
    channel.bind(NOTIFICATION_EVENTS.NOTIFICATION_READ, (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === data.notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    // Handle all notifications marked as read
    channel.bind(NOTIFICATION_EVENTS.MARK_ALL_READ, (data: { count: number }) => {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    });

    // Handle notification deleted
    channel.bind(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.filter(notification => notification.id !== data.notificationId)
      );
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [user]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
};
