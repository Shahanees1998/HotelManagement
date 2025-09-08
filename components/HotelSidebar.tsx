'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'primereact/button'
import { signOut } from 'next-auth/react'

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    href: '/hotel-dashboard'
  },
  {
    label: 'Reviews',
    icon: 'pi pi-star',
    href: '/hotel-dashboard/reviews'
  },
  {
    label: 'Forms',
    icon: 'pi pi-file-edit',
    href: '/hotel-dashboard/forms'
  },
  {
    label: 'Templates',
    icon: 'pi pi-book',
    href: '/hotel-dashboard/forms/templates'
  },
  {
    label: 'QR Codes',
    icon: 'pi pi-qrcode',
    href: '/hotel-dashboard/qr-codes'
  },
  {
    label: 'Analytics',
    icon: 'pi pi-chart-line',
    href: '/hotel-dashboard/analytics'
  },
  {
    label: 'Subscription',
    icon: 'pi pi-credit-card',
    href: '/hotel-dashboard/subscription'
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    href: '/hotel-dashboard/settings'
  }
]

export default function HotelSidebar() {
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="w-64 bg-white shadow-sm min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-blue-600">HotelFeedback Pro</h2>
      </div>
      
      <nav className="px-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <i className={item.icon}></i>
              <span className="font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          label="Sign Out"
          icon="pi pi-sign-out"
          severity="secondary"
          className="w-full"
          onClick={handleSignOut}
        />
      </div>
    </div>
  )
}
