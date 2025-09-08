'use client'

import Link from 'next/link'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'

interface QRCode {
  id: string
  name: string
  url: string
  scanCount: number
}

interface QuickActionsProps {
  qrCodes: QRCode[]
}

export default function QuickActions({ qrCodes }: QuickActionsProps) {
  const actions = [
    {
      title: 'View All Reviews',
      description: 'See all guest feedback',
      icon: 'pi pi-star',
      href: '/hotel-dashboard/reviews',
      color: 'bg-blue-500'
    },
    {
      title: 'Create New Form',
      description: 'Design custom feedback forms',
      icon: 'pi pi-file-edit',
      href: '/hotel-dashboard/forms/new',
      color: 'bg-green-500'
    },
    {
      title: 'Generate QR Code',
      description: 'Create QR codes for guests',
      icon: 'pi pi-qrcode',
      href: '/hotel-dashboard/qr-codes/new',
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'Check performance metrics',
      icon: 'pi pi-chart-line',
      href: '/hotel-dashboard/analytics',
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, index) => (
        <Link key={index} href={action.href}>
          <Card className="dashboard-card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="text-center">
              <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <i className={`${action.icon} text-white text-xl`}></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
