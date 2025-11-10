"use client";

import { useRef, useState, useMemo, useCallback } from 'react';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useI18n } from '@/i18n/TranslationProvider';

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

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  ar: "ar-EG",
  zh: "zh-CN",
};

const NOTIFICATION_TYPE_KEYS: Record<string, string> = {
  NEW_REVIEW: "hotel.analytics.notificationsCenter.types.newReview",
  REVIEW_APPROVED: "hotel.analytics.notificationsCenter.types.reviewApproved",
  REVIEW_REJECTED: "hotel.analytics.notificationsCenter.types.reviewRejected",
  SUBSCRIPTION_EXPIRING: "hotel.analytics.notificationsCenter.types.subscriptionExpiring",
  SUBSCRIPTION_CANCELLED: "hotel.analytics.notificationsCenter.types.subscriptionCancelled",
  ESCALATION_RECEIVED: "hotel.analytics.notificationsCenter.types.escalationReceived",
  ESCALATION_RESPONDED: "hotel.analytics.notificationsCenter.types.escalationResponded",
  SYSTEM_ALERT: "hotel.analytics.notificationsCenter.types.systemAlert",
  NEW_HOTEL_REGISTRATION: "hotel.analytics.notificationsCenter.types.newHotelRegistration",
  NEW_FORM_CREATED: "hotel.analytics.notificationsCenter.types.newFormCreated",
  SUCCESS: "hotel.analytics.notificationsCenter.types.success",
  INFO: "hotel.analytics.notificationsCenter.types.info",
  WARNING: "hotel.analytics.notificationsCenter.types.warning",
  ERROR: "hotel.analytics.notificationsCenter.types.error",
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const overlayRef = useRef<OverlayPanel>(null);
  const { t, locale } = useI18n();
  
  // Individual loading states for different actions
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set());

  const localeFormat = useMemo(() => LOCALE_MAP[locale] ?? locale, [locale]);
  const relativeTimeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(localeFormat, { numeric: "auto" }),
    [localeFormat]
  );

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

  const getTypeLabel = useCallback((type: string) => {
    const key = NOTIFICATION_TYPE_KEYS[type];
    if (!key) {
      return type;
    }
    const translated = t(key);
    return translated === key ? type : translated;
  }, [t]);

  const formatTime = useCallback((timestamp: string) => {
    if (!timestamp) return "";
    const time = new Date(timestamp).getTime();
    if (Number.isNaN(time)) {
      return "";
    }

    const now = Date.now();
    let diffInSeconds = Math.round((time - now) / 1000);
    const absSeconds = Math.abs(diffInSeconds);

    if (absSeconds < 60) {
      return relativeTimeFormatter.format(diffInSeconds, "second");
    }

    const diffInMinutes = Math.round(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) {
      return relativeTimeFormatter.format(diffInMinutes, "minute");
    }

    const diffInHours = Math.round(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return relativeTimeFormatter.format(diffInHours, "hour");
    }

    const diffInDays = Math.round(diffInHours / 24);
    return relativeTimeFormatter.format(diffInDays, "day");
  }, [relativeTimeFormatter]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Hide the notification overlay
    overlayRef.current?.hide();
    
    // Handle feedback notifications - redirect to reviews page with reviewId parameter
    if (notification.type === 'NEW_REVIEW' && notification.relatedId && notification.relatedType === 'review') {
      window.location.href = `/hotel/reviews?reviewId=${notification.relatedId}`;
      return;
    }
    
    // Handle other navigation based on notification type and relatedType
    if (notification.relatedId && notification.relatedType) {
      switch (notification.relatedType) {
        case 'form':
          window.location.href = `/admin/forms/${notification.relatedId}`;
          break;
        case 'hotel':
          window.location.href = `/admin/hotels?hotelId=${notification.relatedId}`;
          break;
        case 'review':
          window.location.href = `/hotel/reviews?reviewId=${notification.relatedId}`;
          break;
        case 'announcement':
          window.location.href = `/admin/announcements`;
          break;
        default:
          console.log('Navigate to:', notification.relatedType, notification.relatedId);
          break;
      }
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
        aria-label={t("hotel.analytics.notificationsCenter.ariaLabel")}
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
        <img className='pt-1 cursor-pointer' src='/images/notification.svg' alt={t("hotel.analytics.notificationsCenter.iconAlt")} style={{width:'20px', height:'20px'}} />
      </div>

      <OverlayPanel 
        ref={overlayRef} 
        className="notification-panel"
        style={{ width: '400px', maxWidth: '90vw' }}
      >
        <div className="flex justify-content-between align-items-center mb-3">
          <h3 className="m-0">{t("hotel.analytics.notificationsCenter.title")}</h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                label={t("hotel.analytics.notificationsCenter.buttons.markAllRead")}
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
              aria-label={t("hotel.analytics.notificationsCenter.buttons.refresh")}
            />
          </div>
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-4">
            <i className="pi pi-bell-slash text-4xl text-400 mb-3"></i>
            <p className="text-600 m-0">{t("hotel.analytics.notificationsCenter.states.empty")}</p>
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
            {(notifications || []).map((notification) => (
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
