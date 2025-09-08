'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from 'primereact/button'
import { signOut } from 'next-auth/react'

const menuItems = [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    href: '/super-admin'
  },
  {
    label: 'Hotels',
    icon: 'pi pi-building',
    href: '/super-admin/hotels'
  },
  {
    label: 'Users',
    icon: 'pi pi-users',
    href: '/super-admin/users'
  },
  {
    label: 'Reviews',
    icon: 'pi pi-star',
    href: '/super-admin/reviews'
  },
  {
    label: 'Subscriptions',
    icon: 'pi pi-credit-card',
    href: '/super-admin/subscriptions'
  },
  {
    label: 'Analytics',
    icon: 'pi pi-chart-line',
    href: '/super-admin/analytics'
  },
  {
    label: 'System Settings',
    icon: 'pi pi-cog',
    href: '/super-admin/settings'
  }
]

export default function SuperAdminSidebar() {
  const pathname = usePathname()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <div className="w-64 bg-white shadow-sm min-h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600">Super Admin</h2>
        <p className="text-sm text-gray-600">System Management</p>
      </div>
      
      <nav className="px-4">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                pathname === item.href
                  ? 'bg-red-50 text-red-600 border-r-2 border-red-600'
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
