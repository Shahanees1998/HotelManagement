'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Pusher from 'pusher-js'
import toast from 'react-hot-toast'

interface NotificationData {
  reviewId?: string
  hotelName?: string
  guestName?: string
  rating?: number
  messageId?: string
  subject?: string
  category?: string
  priority?: string
  hotelId?: string
  adminName?: string
  adminEmail?: string
  location?: string
  timestamp: string
}

export default function RealTimeNotifications() {
  const { data: session } = useSession()
  const [pusher, setPusher] = useState<Pusher | null>(null)

  useEffect(() => {
    if (!session?.user) return

    // Initialize Pusher client
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      encrypted: true
    })

    setPusher(pusherClient)

    // Subscribe to appropriate channels based on user role
    let channel: any

    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin gets all notifications
      channel = pusherClient.subscribe('super-admin')
      
      channel.bind('new-contact-form', (data: NotificationData) => {
        toast.success(`New contact form from ${data.hotelName}`, {
          duration: 5000,
          icon: '📧'
        })
      })

      channel.bind('new-hotel-registration', (data: NotificationData) => {
        toast.success(`New hotel registered: ${data.hotelName}`, {
          duration: 5000,
          icon: '🏨'
        })
      })

    } else if (session.user.role === 'HOTEL_ADMIN' && session.user.hotelId) {
      // Hotel admin gets hotel-specific notifications
      channel = pusherClient.subscribe(`hotel-${session.user.hotelId}`)
      
      channel.bind('new-review', (data: NotificationData) => {
        const rating = data.rating || 0
        const icon = rating >= 4 ? '⭐' : '📝'
        const color = rating >= 4 ? 'success' : 'info'
        
        toast.success(`New ${rating}-star review from ${data.guestName}`, {
          duration: 5000,
          icon: icon
        })
      })
    }

    // Cleanup on unmount
    return () => {
      if (pusherClient) {
        pusherClient.disconnect()
      }
    }
  }, [session])

  // This component doesn't render anything visible
  return null
}
