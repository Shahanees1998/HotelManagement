'use client'

import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Dialog } from 'primereact/dialog'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'

interface QRCode {
  id: string
  name: string
  description?: string
  url: string
  imageUrl?: string
  isActive: boolean
  scanCount: number
  createdAt: string
}

interface QRCodeManagementProps {
  qrCodes: QRCode[]
  hotelId: string
}

export default function QRCodeManagement({ qrCodes, hotelId }: QRCodeManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateQRCode = async () => {
    if (!formData.name.trim()) {
      toast.error('QR code name is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/qr-codes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('QR code generated successfully!')
        setShowCreateDialog(false)
        setFormData({ name: '', description: '' })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to generate QR code')
      }
    } catch (error) {
      toast.error('Error generating QR code')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadQRCode = (imageUrl: string, name: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${name}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR code downloaded!')
  }

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard!')
  }

  const statusBodyTemplate = (rowData: QRCode) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    )
  }

  const actionsBodyTemplate = (rowData: QRCode) => {
    return (
      <div className="flex gap-2">
        {rowData.imageUrl && (
          <Button
            icon="pi pi-download"
            size="small"
            severity="info"
            tooltip="Download QR Code"
            onClick={() => handleDownloadQRCode(rowData.imageUrl!, rowData.name)}
          />
        )}
        <Button
          icon="pi pi-copy"
          size="small"
          severity="secondary"
          tooltip="Copy URL"
          onClick={() => handleCopyURL(rowData.url)}
        />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Create QR Code Button */}
      <div className="flex justify-end">
        <Button
          label="Generate New QR Code"
          icon="pi pi-plus"
          onClick={() => setShowCreateDialog(true)}
        />
      </div>

      {/* QR Codes Table */}
      <Card className="dashboard-card">
        <DataTable
          value={qrCodes}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} QR codes"
          emptyMessage="No QR codes found."
          responsiveLayout="scroll"
        >
          <Column field="name" header="Name" sortable style={{ minWidth: '200px' }} />
          <Column field="description" header="Description" style={{ minWidth: '200px' }} />
          <Column field="url" header="URL" style={{ minWidth: '200px' }} />
          <Column field="scanCount" header="Scans" sortable style={{ minWidth: '100px' }} />
          <Column field="isActive" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="createdAt" header="Created" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '120px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '150px' }} />
        </DataTable>
      </Card>

      {/* Create QR Code Dialog */}
      <Dialog
        header="Generate New QR Code"
        visible={showCreateDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowCreateDialog(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QR Code Name *
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Front Desk, Restaurant, Room Service"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <InputTextarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Optional description for this QR code..."
              rows={3}
              className="w-full"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• QR code will link directly to your guest feedback form</li>
              <li>• Guests can scan with any smartphone camera</li>
              <li>• No app download required for guests</li>
              <li>• Track scan count and usage analytics</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowCreateDialog(false)}
            />
            <Button
              label="Generate QR Code"
              loading={loading}
              onClick={handleCreateQRCode}
            />
          </div>
        </div>
      </Dialog>

      {/* Usage Tips */}
      <Card className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code Usage Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Best Practices</h4>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Place QR codes at eye level for easy scanning</li>
              <li>• Ensure good lighting around QR code locations</li>
              <li>• Use descriptive names for easy management</li>
              <li>• Test QR codes before placing them</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Ideal Locations</h4>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>• Front desk and reception areas</li>
              <li>• Restaurant tables and menus</li>
              <li>• Hotel room key cards</li>
              <li>• Spa and amenity areas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
