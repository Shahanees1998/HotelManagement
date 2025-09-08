import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import HotelSettings from '@/components/HotelSettings'

const prisma = new PrismaClient()

export default async function SettingsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch hotel data
  const hotel = await prisma.hotel.findUnique({
    where: { id: session.user.hotelId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      website: true,
      googleReviewUrl: true,
      address: true,
      city: true,
      state: true,
      country: true,
      zipCode: true,
      description: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      allowExternalSharing: true,
      autoApproveReviews: true
    }
  })

  if (!hotel) {
    return <div>Hotel not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hotel Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your hotel information and preferences
        </p>
      </div>

      {/* Hotel Settings Component */}
      <HotelSettings hotel={hotel} />
    </div>
  )
}
