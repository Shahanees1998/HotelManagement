import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import HotelSidebar from '@/components/HotelSidebar'
import HotelHeader from '@/components/HotelHeader'

export default async function HotelDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HotelHeader />
      <div className="flex">
        <HotelSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
