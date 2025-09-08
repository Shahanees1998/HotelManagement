import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import ContactSuperAdmin from '@/components/ContactSuperAdmin'

const prisma = new PrismaClient()

export default async function ContactPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch hotel information
  const hotel = await prisma.hotel.findUnique({
    where: { id: session.user.hotelId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true
    }
  })

  if (!hotel) {
    return <div>Hotel not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
        <p className="text-gray-600 mt-1">
          Send a message to our support team for assistance
        </p>
      </div>

      {/* Contact Form */}
      <ContactSuperAdmin hotel={hotel} />
    </div>
  )
}
