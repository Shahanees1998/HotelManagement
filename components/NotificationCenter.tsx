"use client";

import { useRef, useState } from 'react';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
  createdAt: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const overlayRef = useRef<OverlayPanel>(null);
  
  // Individual loading states for different actions
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set());

  const getSeverity = (type: string) => {
    switch (type) {
      case 'SUCCESS':
      case 'REVIEW_APPROVED':
        return 'success';
      case 'ERROR':
      case 'REVIEW_REJECTED':
        return 'danger';
      case 'WARNING':
      case 'SUBSCRIPTION_EXPIRING':
        return 'warning';
      case 'INFO':
      case 'NEW_REVIEW':
      case 'ESCALATION_RESPONDED':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'NEW_REVIEW': return 'New Review';
      case 'REVIEW_APPROVED': return 'Review Approved';
      case 'REVIEW_REJECTED': return 'Review Rejected';
      case 'SUBSCRIPTION_EXPIRING': return 'Subscription Expiring';
      case 'SUBSCRIPTION_CANCELLED': return 'Subscription Cancelled';
      case 'ESCALATION_RECEIVED': return 'Escalation Received';
      case 'ESCALATION_RESPONDED': return 'Escalation Responded';
      case 'SYSTEM_ALERT': return 'System Alert';
      case 'NEW_HOTEL_REGISTRATION': return 'New Hotel Registration';
      case 'SUCCESS': return 'Success';
      case 'INFO': return 'Info';
      case 'WARNING': return 'Warning';
      case 'ERROR': return 'Error';
      default: return type;
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type
    if (notification.relatedId && notification.relatedType) {
      // You can implement navigation logic here
      console.log('Navigate to:', notification.relatedType, notification.relatedId);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setDeletingNotifications(prev => new Set(prev).add(notificationId));
    try {
      await deleteNotification(notificationId);
    } finally {
      setDeletingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  if (!user) return null;

  return (
    <div className="notification-center">
      <div
        className="p-button-text p-button-rounded relative flex align-items-center"
        onClick={(e) => overlayRef.current?.toggle(e)}
        aria-label="Notifications"
        style={{backgroundColor:'white !important'}}
      >
        {unreadCount > 0 && (
          <Badge 
            value={unreadCount} 
            severity="danger" 
            className="mr-0 mb-2"
            style={{ fontSize: '0.7rem' }}
          />
        )}
        <img className='pt-1 cursor-pointer' src='/images/notification.svg' alt='notification' style={{width:'20px', height:'20px'}} />
      </div>

      <OverlayPanel 
        ref={overlayRef} 
        className="notification-panel"
        style={{ width: '400px', maxWidth: '90vw' }}
      >
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="m-0">Notifications</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                label="Mark All Read"
                size="small"
                className="p-button-outlined p-button-sm"
                onClick={handleMarkAllAsRead}
                loading={markAllLoading}
                disabled={markAllLoading}
              />
            )}
            <Button
              icon="pi pi-refresh"
              size="small"
              className="p-button-outlined p-button-sm"
              loading={loading}
            />
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-4">
            <i className="pi pi-bell-slash text-4xl text-400 mb-3"></i>
            <p className="text-600 m-0">No notifications yet</p>
          </div>
        ) : (
          <div 
            className="notification-list" 
            style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              width: '100%'
            }}
          >
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item p-3 border-1 border-200 border-round mb-2 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                style={{ 
                  width: '100%',
                  minHeight: '80px',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-content-between align-items-start mb-2">
                  <div className="flex align-items-center gap-2">
                    <Tag 
                      value={getTypeLabel(notification.type)} 
                      severity={getSeverity(notification.type)}
                      className="text-xs"
                    />
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 border-round"></div>
                    )}
                  </div>
                  <div className="flex align-items-center gap-2">
                    <span className="text-xs text-600">
                      {formatTime(notification.createdAt)}
                    </span>
                    <Button
                      icon="pi pi-times"
                      size="small"
                      className="p-button-text p-button-sm text-gray-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      loading={deletingNotifications.has(notification.id)}
                      disabled={deletingNotifications.has(notification.id)}
                    />
                  </div>
                </div>
                <h4 className="text-sm font-semibold m-0 mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm text-600 m-0 line-height-3">
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </OverlayPanel>
    </div>
  );
}
