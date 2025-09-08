import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import HotelsTable from '@/components/HotelsTable'

const prisma = new PrismaClient()

export default async function HotelsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all hotels with their users
  const hotels = await prisma.hotel.findMany({
    include: {
      users: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          reviews: true,
          qrCodes: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotels Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all registered hotels and their subscriptions
          </p>
        </div>
      </div>

      {/* Hotels Table */}
      <HotelsTable hotels={hotels} />
    </div>
  )
}
