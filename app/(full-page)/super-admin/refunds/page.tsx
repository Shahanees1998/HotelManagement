import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import RefundsManagement from '@/components/RefundsManagement'

const prisma = new PrismaClient()

export default async function RefundsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all refunds
  const refunds = await prisma.refund.findMany({
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      subscription: {
        select: {
          id: true,
          plan: true,
          stripeSubscriptionId: true
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
      subscription: {
        select: {
          plan: true,
          status: true
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refunds Management</h1>
          <p className="text-gray-600 mt-1">
            Process refunds for hotels and track refund history
          </p>
        </div>
      </div>

      {/* Refunds Management Component */}
      <RefundsManagement refunds={refunds} hotels={hotels} />
    </div>
  )
}
