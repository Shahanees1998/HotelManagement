'use client'

import { useSession } from 'next-auth/react'
import { Avatar } from 'primereact/avatar'

export default function SuperAdminHeader() {
  const { data: session } = useSession()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              System Management & Oversight
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-600">Super Admin</p>
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
