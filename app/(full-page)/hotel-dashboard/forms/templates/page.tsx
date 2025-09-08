import { getServerSession } from 'next-auth'
import FormTemplates from '@/components/FormTemplates'

export default async function FormTemplatesPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'HOTEL_ADMIN' || !session.user?.hotelId) {
    return <div>Unauthorized</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600 mt-1">
            Choose from pre-built form templates or create your own
          </p>
        </div>
      </div>

      {/* Form Templates Component */}
      <FormTemplates hotelId={session.user.hotelId} />
    </div>
  )
}
