import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import ContactFormsManagement from '@/components/ContactFormsManagement'

const prisma = new PrismaClient()

export default async function ContactFormsPage() {
  const session = await getServerSession()
  
  if (!session || session.user?.role !== 'SUPER_ADMIN') {
    return <div>Unauthorized</div>
  }

  // Fetch all contact forms
  const contactForms = await prisma.supportMessage.findMany({
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          email: true,
          city: true,
          state: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Forms Management</h1>
        <p className="text-gray-600 mt-1">
          View and manage all contact form submissions from hotels
        </p>
      </div>

      {/* Contact Forms Management Component */}
      <ContactFormsManagement contactForms={contactForms} />
    </div>
  )
}
