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
  const reviewsData = await prisma.review.findMany({
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

  // Transform data to match expected types (convert null to undefined)
  const reviews = reviewsData.map(review => ({
    ...review,
    guestName: review.guestName ?? undefined,
    guestEmail: review.guestEmail ?? undefined,
    guestPhone: review.guestPhone ?? undefined,
    overallRating: review.overallRating ?? undefined,
    adminNotes: review.adminNotes ?? undefined,
    adminId: review.adminId ?? undefined,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  }))

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
