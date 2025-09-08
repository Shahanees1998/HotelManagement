import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import QRCodeManagement from '@/components/QRCodeManagement'

const prisma = new PrismaClient()

export default async function QRCodesPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  // Fetch QR codes for the hotel
  const qrCodesData = await prisma.qRCode.findMany({
    where: { hotelId: session.user.hotelId },
    orderBy: { createdAt: 'desc' }
  })

  // Transform data to match expected types (convert null to undefined)
  const qrCodes = qrCodesData.map(qrCode => ({
    ...qrCode,
    description: qrCode.description ?? undefined,
    imageUrl: qrCode.imageUrl ?? undefined,
    createdAt: qrCode.createdAt.toISOString(),
    updatedAt: qrCode.updatedAt.toISOString()
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600 mt-1">
            Generate and manage QR codes for guest feedback collection
          </p>
        </div>
      </div>

      {/* QR Code Management Component */}
      <QRCodeManagement qrCodes={qrCodes} hotelId={session.user.hotelId} />
    </div>
  )
}
