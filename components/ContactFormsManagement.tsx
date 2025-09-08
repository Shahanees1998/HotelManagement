'use client'

import { useState } from 'react'
import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'

interface ContactForm {
  id: string
  hotelId: string
  hotel: {
    id: string
    name: string
    email: string
    city: string
    state: string
  }
  subject: string
  category: string
  message: string
  priority: string
  status: string
  hotelName: string
  hotelEmail: string
  hotelPhone?: string
  adminResponse?: string
  adminId?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string
}

interface ContactFormsManagementProps {
  contactForms: ContactForm[]
}

export default function ContactFormsManagement({ contactForms }: ContactFormsManagementProps) {
  const [selectedForm, setSelectedForm] = useState<ContactForm | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [response, setResponse] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const statusOptions = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Closed', value: 'closed' }
  ]

  const priorityBodyTemplate = (rowData: ContactForm) => {
    const severity = rowData.priority === 'urgent' ? 'danger' : 
                   rowData.priority === 'high' ? 'warning' : 
                   rowData.priority === 'medium' ? 'info' : 'secondary'
    
    return (
      <Tag
        value={rowData.priority.toUpperCase()}
        severity={severity}
      />
    )
  }

  const statusBodyTemplate = (rowData: ContactForm) => {
    const severity = rowData.status === 'resolved' ? 'success' : 
                   rowData.status === 'in_progress' ? 'warning' : 
                   rowData.status === 'closed' ? 'secondary' : 'info'
    
    return (
      <Tag
        value={rowData.status.replace('_', ' ').toUpperCase()}
        severity={severity}
      />
    )
  }

  const actionsBodyTemplate = (rowData: ContactForm) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Details"
          onClick={() => {
            setSelectedForm(rowData)
            setShowResponseDialog(true)
          }}
        />
        <Button
          icon="pi pi-reply"
          size="small"
          severity="secondary"
          tooltip="Respond"
          onClick={() => {
            setSelectedForm(rowData)
            setResponse('')
            setStatus(rowData.status)
            setShowResponseDialog(true)
          }}
        />
      </div>
    )
  }

  const handleRespond = async () => {
    if (!selectedForm || !response.trim()) {
      toast.error('Please enter a response')
      return
    }

    setLoading(true)
    try {
      const responseData = await fetch('/api/super-admin/contact-forms/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: selectedForm.id,
          response: response.trim(),
          status: status
        }),
      })

      const data = await responseData.json()

      if (responseData.ok) {
        toast.success('Response sent successfully!')
        setShowResponseDialog(false)
        setSelectedForm(null)
        setResponse('')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to send response')
      }
    } catch (error) {
      toast.error('Error sending response')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {contactForms.length}
            </div>
            <div className="text-gray-600">Total Forms</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {contactForms.filter(f => f.status === 'pending').length}
            </div>
            <div className="text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {contactForms.filter(f => f.status === 'in_progress').length}
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {contactForms.filter(f => f.status === 'resolved').length}
            </div>
            <div className="text-gray-600">Resolved</div>
          </div>
        </Card>
      </div>

      {/* Contact Forms Table */}
      <Card>
        <DataTable
          value={contactForms}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          emptyMessage="No contact forms found"
        >
          <Column field="hotel.name" header="Hotel" sortable />
          <Column field="subject" header="Subject" sortable />
          <Column field="category" header="Category" sortable />
          <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable />
          <Column field="createdAt" header="Submitted" sortable />
          <Column header="Actions" body={actionsBodyTemplate} />
        </DataTable>
      </Card>

      {/* Response Dialog */}
      <Dialog
        header={selectedForm ? `Respond to ${selectedForm.hotel.name}` : 'Contact Form Details'}
        visible={showResponseDialog}
        onHide={() => setShowResponseDialog(false)}
        style={{ width: '50vw' }}
        maximizable
      >
        {selectedForm && (
          <div className="space-y-4">
            {/* Form Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Form Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Hotel:</strong> {selectedForm.hotel.name}
                </div>
                <div>
                  <strong>Email:</strong> {selectedForm.hotelEmail}
                </div>
                <div>
                  <strong>Subject:</strong> {selectedForm.subject}
                </div>
                <div>
                  <strong>Category:</strong> {selectedForm.category}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedForm.priority}
                </div>
                <div>
                  <strong>Status:</strong> {selectedForm.status}
                </div>
                <div className="col-span-2">
                  <strong>Message:</strong>
                  <div className="mt-1 p-2 bg-white rounded border">
                    {selectedForm.message}
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Response */}
            {selectedForm.adminResponse && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Previous Response</h3>
                <div className="text-sm">
                  <div className="mb-2">
                    <strong>Responded:</strong> {new Date(selectedForm.respondedAt!).toLocaleString()}
                  </div>
                  <div className="p-2 bg-white rounded border">
                    {selectedForm.adminResponse}
                  </div>
                </div>
              </div>
            )}

            {/* Response Form */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Response
              </label>
              <InputTextarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                placeholder="Enter your response to the hotel..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Status
              </label>
              <Dropdown
                value={status}
                onChange={(e) => setStatus(e.value)}
                options={statusOptions}
                placeholder="Select status"
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                onClick={() => setShowResponseDialog(false)}
              />
              <Button
                label="Send Response"
                loading={loading}
                onClick={handleRespond}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
