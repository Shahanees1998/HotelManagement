"use client";

import { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ScrollPanel } from 'primereact/scrollpanel';
import { useNotifications } from '@/hooks/useNotifications';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const overlayRef = useRef<OverlayPanel>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleBellClick = (event: React.MouseEvent) => {
    if (overlayRef.current) {
      overlayRef.current.toggle(event);
      setIsOpen(!isOpen);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Handle navigation based on notification type and relatedType
    if (notification.relatedId && notification.relatedType) {
      const router = require('next/navigation').useRouter;
      
      switch (notification.relatedType) {
        case 'form':
          window.location.href = `/admin/forms/${notification.relatedId}`;
          break;
        case 'hotel':
          window.location.href = `/admin/hotels?hotelId=${notification.relatedId}`;
          break;
        case 'review':
          window.location.href = `/admin/reviews?reviewId=${notification.relatedId}`;
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="relative">
      <Button
        icon="pi pi-bell"
        className="p-button-text p-button-rounded"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <Badge
            value={unreadCount}
            severity="danger"
            className="absolute -top-1 -right-1"
            style={{ fontSize: '0.7rem', minWidth: '1.2rem', height: '1.2rem' }}
          />
        )}
      </Button>

      <OverlayPanel
        ref={overlayRef}
        className="notification-panel"
        style={{ width: '350px', maxHeight: '500px' }}
      >
        <div className="flex justify-content-between align-items-center mb-3">
          <h4 className="m-0">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              label="Mark all read"
              size="small"
              className="p-button-text p-button-sm"
              onClick={handleMarkAllRead}
            />
          )}
        </div>

        <ScrollPanel style={{ height: '400px' }}>
          {notifications.length === 0 ? (
            <div className="text-center py-4">
              <i className="pi pi-bell-slash text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500 m-0">No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-round cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100 border-l-3 border-blue-500'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex align-items-start gap-3">
                    <i className="pi pi-bell text-lg text-blue-500"></i>
                    <div className="flex-1">
                      <h6 className={`m-0 mb-1 ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </h6>
                      <p className="text-sm text-gray-600 m-0 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex justify-content-between align-items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <Button
                          icon="pi pi-times"
                          size="small"
                          className="p-button-text p-button-sm text-gray-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollPanel>
      </OverlayPanel>
    </div>
  );
};

export default NotificationBell;