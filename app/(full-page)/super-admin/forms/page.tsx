import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SuperAdminFormsManagement from '@/components/SuperAdminFormsManagement'

const prisma = new PrismaClient()

export default async function SuperAdminFormsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all forms across all hotels
  const forms = await prisma.form.findMany({
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          subscriptionPlan: true
        }
      },
      fields: {
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch all hotels for dropdown
  const hotels = await prisma.hotel.findMany({
    select: {
      id: true,
      name: true,
      subscriptionPlan: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Forms Management</h1>
          <p className="text-gray-600 mt-1">
            Manage forms across all hotels - create, edit, and delete forms for any hotel
          </p>
        </div>
      </div>

      {/* Super Admin Forms Management Component */}
      <SuperAdminFormsManagement forms={forms} hotels={hotels} />
    </div>
  )
}
