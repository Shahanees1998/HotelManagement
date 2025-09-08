'use client'

import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import Link from 'next/link'

interface User {
  firstName: string
  lastName: string
  email: string
}

interface Hotel {
  id: string
  name: string
  email: string
  city: string
  state: string
  subscriptionStatus: string
  createdAt: string
  users: User[]
}

interface RecentHotelsProps {
  hotels: Hotel[]
}

export default function RecentHotels({ hotels }: RecentHotelsProps) {
  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'warning'
      case 'CANCELLED': return 'danger'
      case 'PAST_DUE': return 'warning'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Card className="dashboard-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Hotels</h2>
        <Link href="/super-admin/hotels">
          <Button label="View All" text />
        </Link>
      </div>

      {hotels.length === 0 ? (
        <div className="text-center py-8">
          <i className="pi pi-building text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No hotels registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hotels.map((hotel) => (
            <div key={hotel.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{hotel.name}</h3>
                  <p className="text-sm text-gray-600">
                    {hotel.city}, {hotel.state}
                  </p>
                  <p className="text-sm text-gray-600">{hotel.email}</p>
                </div>
                <div className="text-right">
                  <Tag
                    value={hotel.subscriptionStatus.replace('_', ' ')}
                    severity={getStatusSeverity(hotel.subscriptionStatus)}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">
                    Joined {formatDate(hotel.createdAt)}
                  </p>
                </div>
              </div>
              
              {hotel.users.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Admin:</span> {hotel.users[0].firstName} {hotel.users[0].lastName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
