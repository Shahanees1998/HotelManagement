import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SuspensionsManagement from '@/components/SuspensionsManagement'

const prisma = new PrismaClient()

export default async function SuspensionsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all suspensions
  const suspensions = await prisma.hotelSuspension.findMany({
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch all hotels for dropdown
  const hotels = await prisma.hotel.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Suspensions</h1>
          <p className="text-gray-600 mt-1">
            Manage hotel account suspensions and reactivations
          </p>
        </div>
      </div>

      {/* Suspensions Management Component */}
      <SuspensionsManagement suspensions={suspensions} hotels={hotels} />
    </div>
  )
}
