import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import SuperAdminReviewsTable from '@/components/SuperAdminReviewsTable'

const prisma = new PrismaClient()

export default async function SuperAdminReviewsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all reviews across all hotels
  const reviews = await prisma.review.findMany({
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true
        }
      },
      form: {
        select: {
          name: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch all hotels for filtering
  const hotels = await prisma.hotel.findMany({
    select: {
      id: true,
      name: true,
      city: true,
      state: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Reviews</h1>
          <p className="text-gray-600 mt-1">
            View and manage reviews from all hotels across the system
          </p>
        </div>
      </div>

      {/* Super Admin Reviews Table */}
      <SuperAdminReviewsTable reviews={reviews} hotels={hotels} />
    </div>
  )
}
