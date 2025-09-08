import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import ReviewsTable from '@/components/ReviewsTable'

const prisma = new PrismaClient()

export default async function ReviewsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch reviews for the hotel
  const reviews = await prisma.review.findMany({
    where: { hotelId: session.user.hotelId },
    include: {
      form: {
        select: {
          name: true
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
          <h1 className="text-3xl font-bold text-gray-900">Guest Reviews</h1>
          <p className="text-gray-600 mt-1">
            Manage and respond to guest feedback
          </p>
        </div>
      </div>

      {/* Reviews Table */}
      <ReviewsTable reviews={reviews} />
    </div>
  )
}
