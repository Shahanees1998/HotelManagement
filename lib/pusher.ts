import Pusher from 'pusher'

// Server-side Pusher instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true
})

// Client-side Pusher instance (for browser)
export const pusherClient = {
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
}

// Helper function to trigger notifications
export async function triggerNotification(channel: string, event: string, data: any) {
  try {
    await pusher.trigger(channel, event, data)
    console.log(`Pusher notification sent to ${channel}: ${event}`)
  } catch (error) {
    console.error('Error sending Pusher notification:', error)
  }
}

// Channel names
export const CHANNELS = {
  HOTEL_NOTIFICATIONS: (hotelId: string) => `hotel-${hotelId}`,
  SUPER_ADMIN_NOTIFICATIONS: 'super-admin',
  GLOBAL_NOTIFICATIONS: 'global'
}

// Event names
export const EVENTS = {
  NEW_REVIEW: 'new-review',
  NEW_CONTACT_FORM: 'new-contact-form',
  NEW_HOTEL_REGISTRATION: 'new-hotel-registration',
  SUBSCRIPTION_UPDATE: 'subscription-update',
  SYSTEM_ALERT: 'system-alert'
}
