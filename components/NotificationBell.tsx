'use client'

import { useState, useEffect } from 'react'
import { Button } from 'primereact/button'
import { Badge } from 'primereact/badge'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  data?: any
  createdAt: string
}

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)

  const fetchNotifications = async () => {
    if (!session?.user?.hotelId) return

    try {
      const response = await fetch(`/api/notifications/hotel/${session.user.hotelId}`)
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    if (!session?.user?.hotelId) return

    try {
      const response = await fetch(`/api/notifications/hotel/${session.user.hotelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, isRead: true }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif.id)
    
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
      toast.success('All notifications marked as read')
    }
  }

  useEffect(() => {
    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [session])

  const unreadCount = notifications.filter(notif => !notif.isRead).length

  const getSeverity = (type: string) => {
    switch (type) {
      case 'success': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'danger'
      default: return 'info'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="relative">
      <Button
        icon="pi pi-bell"
        className="p-button-text p-button-rounded"
        onClick={() => setOverlayVisible(!overlayVisible)}
        aria-label="Notifications"
      >
        {unreadCount > 0 && (
          <Badge value={unreadCount} severity="danger" />
        )}
      </Button>

      <OverlayPanel
        ref={(el) => {
          if (el) {
            el.show(null, document.querySelector('.relative'))
          }
        }}
        visible={overlayVisible}
        onHide={() => setOverlayVisible(false)}
        style={{ width: '350px' }}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                label="Mark all read"
                size="small"
                severity="secondary"
                onClick={markAllAsRead}
              />
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="pi pi-bell-slash text-3xl mb-2"></i>
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <Card key={notification.id} className="notification-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        <Tag
                          value={notification.type}
                          severity={getSeverity(notification.type)}
                          className="text-xs"
                        />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </OverlayPanel>
    </div>
  )
}
