'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from 'primereact/avatar'
import { Dropdown } from 'primereact/dropdown'
import NotificationBell from './NotificationBell'

export default function HotelHeader() {
  const { data: session } = useSession()

  const userMenuItems = [
    { label: 'Profile', icon: 'pi pi-user' },
    { label: 'Settings', icon: 'pi pi-cog' },
    { label: 'Sign Out', icon: 'pi pi-sign-out' }
  ]

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {session?.user?.hotel?.name || 'Hotel Dashboard'}
            </h1>
            <p className="text-sm text-gray-600">
              {session?.user?.hotel?.city}, {session?.user?.hotel?.state}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-600">Hotel Admin</p>
            </div>
            <Avatar
              image="/images/no-profile.jpg"
              shape="circle"
              size="normal"
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
