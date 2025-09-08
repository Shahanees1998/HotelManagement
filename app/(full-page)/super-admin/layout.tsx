import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import SuperAdminSidebar from '@/components/SuperAdminSidebar'
import SuperAdminHeader from '@/components/SuperAdminHeader'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminHeader />
      <div className="flex">
        <SuperAdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
