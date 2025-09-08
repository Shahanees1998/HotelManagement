import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import FormsManagement from '@/components/FormsManagement'

const prisma = new PrismaClient()

export default async function FormsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch forms for the hotel
  const forms = await prisma.form.findMany({
    where: { hotelId: session.user.hotelId },
    include: {
      fields: {
        orderBy: { order: 'asc' }
      },
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback Forms</h1>
          <p className="text-gray-600 mt-1">
            Create and manage custom feedback forms for your guests
          </p>
        </div>
      </div>

      {/* Forms Management Component */}
      <FormsManagement forms={forms} hotelId={session.user.hotelId} />
    </div>
  )
}
