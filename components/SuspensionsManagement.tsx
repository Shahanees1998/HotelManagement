'use client'

import { useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import { FilterMatchMode } from 'primereact/api'
import toast from 'react-hot-toast'

interface Hotel {
  id: string
  name: string
  email: string
  isActive: boolean
}

interface Suspension {
  id: string
  reason: string
  type: string
  status: string
  duration?: number
  suspendedAt: string
  expiresAt?: string
  liftedAt?: string
  notes?: string
  createdAt: string
  hotel: Hotel
}

interface SuspensionsManagementProps {
  suspensions: Suspension[]
  hotels: Hotel[]
}

export default function SuspensionsManagement({ suspensions, hotels }: SuspensionsManagementProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    hotel: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    type: { value: null, matchMode: FilterMatchMode.EQUALS }
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLiftDialog, setShowLiftDialog] = useState(false)
  const [selectedSuspension, setSelectedSuspension] = useState<Suspension | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hotelId: '',
    reason: '',
    type: '',
    duration: 0,
    notes: ''
  })
  const [liftData, setLiftData] = useState({
    reason: '',
    notes: ''
  })

  const hotelOptions = [
    { label: 'All Hotels', value: null },
    ...hotels.map(hotel => ({
      label: `${hotel.name} (${hotel.isActive ? 'Active' : 'Inactive'})`,
      value: hotel.id
    }))
  ]

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'active' },
    { label: 'Lifted', value: 'lifted' },
    { label: 'Expired', value: 'expired' }
  ]

  const typeOptions = [
    { label: 'All Types', value: null },
    { label: 'Temporary', value: 'temporary' },
    { label: 'Permanent', value: 'permanent' },
    { label: 'Payment Issue', value: 'payment_issue' },
    { label: 'Violation', value: 'violation' },
    { label: 'Other', value: 'other' }
  ]

  const suspensionReasonOptions = [
    { label: 'Payment Failure', value: 'payment_failure' },
    { label: 'Terms of Service Violation', value: 'tos_violation' },
    { label: 'Fraudulent Activity', value: 'fraudulent_activity' },
    { label: 'Abuse of Service', value: 'abuse_of_service' },
    { label: 'Requested by Customer', value: 'customer_request' },
    { label: 'Security Concerns', value: 'security_concerns' },
    { label: 'Other', value: 'other' }
  ]

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'active': return 'danger'
      case 'lifted': return 'success'
      case 'expired': return 'warning'
      default: return 'secondary'
    }
  }

  const getTypeSeverity = (type: string) => {
    switch (type) {
      case 'permanent': return 'danger'
      case 'temporary': return 'warning'
      case 'payment_issue': return 'info'
      case 'violation': return 'danger'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLiftInputChange = (field: string, value: any) => {
    setLiftData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateSuspension = async () => {
    if (!formData.hotelId || !formData.reason || !formData.type) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.type === 'temporary' && (!formData.duration || formData.duration <= 0)) {
      toast.error('Please specify duration for temporary suspension')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/super-admin/suspensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Hotel suspended successfully')
        setShowCreateDialog(false)
        setFormData({
          hotelId: '',
          reason: '',
          type: '',
          duration: 0,
          notes: ''
        })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to suspend hotel')
      }
    } catch (error) {
      toast.error('Error suspending hotel')
    } finally {
      setLoading(false)
    }
  }

  const handleLiftSuspension = async () => {
    if (!liftData.reason) {
      toast.error('Please provide a reason for lifting the suspension')
      return
    }

    if (!selectedSuspension) {
      toast.error('No suspension selected')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/super-admin/suspensions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suspensionId: selectedSuspension.id,
          ...liftData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Suspension lifted successfully')
        setShowLiftDialog(false)
        setSelectedSuspension(null)
        setLiftData({
          reason: '',
          notes: ''
        })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to lift suspension')
      }
    } catch (error) {
      toast.error('Error lifting suspension')
    } finally {
      setLoading(false)
    }
  }

  const openLiftDialog = (suspension: Suspension) => {
    setSelectedSuspension(suspension)
    setShowLiftDialog(true)
  }

  const hotelBodyTemplate = (rowData: Suspension) => {
    return (
      <div>
        <div className="font-medium">{rowData.hotel.name}</div>
        <div className="text-sm text-gray-600">{rowData.hotel.email}</div>
      </div>
    )
  }

  const statusBodyTemplate = (rowData: Suspension) => {
    return (
      <Tag
        value={rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)}
        severity={getStatusSeverity(rowData.status)}
      />
    )
  }

  const typeBodyTemplate = (rowData: Suspension) => {
    return (
      <Tag
        value={rowData.type.replace('_', ' ').charAt(0).toUpperCase() + rowData.type.replace('_', ' ').slice(1)}
        severity={getTypeSeverity(rowData.type)}
      />
    )
  }

  const durationBodyTemplate = (rowData: Suspension) => {
    if (rowData.type === 'permanent') {
      return <span className="text-gray-500">Permanent</span>
    }
    
    if (rowData.duration) {
      return (
        <div>
          <div className="font-medium">{rowData.duration} days</div>
          {rowData.expiresAt && (
            <div className="text-xs text-gray-500">Expires: {formatDate(rowData.expiresAt)}</div>
          )}
        </div>
      )
    }
    
    return <span className="text-gray-500">-</span>
  }

  const actionsBodyTemplate = (rowData: Suspension) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'active' && (
          <Button
            icon="pi pi-check"
            size="small"
            severity="success"
            tooltip="Lift Suspension"
            onClick={() => openLiftDialog(rowData)}
          />
        )}
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Details"
          onClick={() => {
            // TODO: Implement view details functionality
            console.log('View details:', rowData.id)
          }}
        />
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">Hotel Suspensions</h2>
        <span className="text-600">Manage hotel account suspensions and reactivations</span>
      </div>
      <div className="flex gap-2">
        <Button
          label="Suspend Hotel"
          icon="pi pi-ban"
          severity="danger"
          onClick={() => setShowCreateDialog(true)}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search suspensions..."
            className="w-full"
          />
        </span>
        <Dropdown
          value={filters.hotel.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['hotel'].value = e.value
            setFilters(_filters)
          }}
          options={hotelOptions}
          placeholder="Hotel"
          className="w-full"
        />
        <Dropdown
          value={filters.status.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['status'].value = e.value
            setFilters(_filters)
          }}
          options={statusOptions}
          placeholder="Status"
          className="w-full"
        />
        <Dropdown
          value={filters.type.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['type'].value = e.value
            setFilters(_filters)
          }}
          options={typeOptions}
          placeholder="Type"
          className="w-full"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <DataTable
          value={suspensions}
          paginator
          rows={15}
          rowsPerPageOptions={[10, 15, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} suspensions"
          globalFilterFields={['hotel.name', 'hotel.email', 'reason', 'type', 'status']}
          filters={filters}
          header={header}
          emptyMessage="No suspensions found."
          responsiveLayout="scroll"
        >
          <Column field="hotel.name" header="Hotel" body={hotelBodyTemplate} sortable style={{ minWidth: '200px' }} />
          <Column field="reason" header="Reason" sortable style={{ minWidth: '200px' }} />
          <Column field="type" header="Type" body={typeBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column header="Duration" body={durationBodyTemplate} style={{ minWidth: '150px' }} />
          <Column field="suspendedAt" header="Suspended" sortable body={(rowData) => formatDate(rowData.suspendedAt)} style={{ minWidth: '150px' }} />
          <Column field="liftedAt" header="Lifted" sortable body={(rowData) => rowData.liftedAt ? formatDate(rowData.liftedAt) : '-'} style={{ minWidth: '150px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
        </DataTable>
      </Card>

      {/* Create Suspension Dialog */}
      <Dialog
        header="Suspend Hotel"
        visible={showCreateDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowCreateDialog(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hotel *
            </label>
            <Dropdown
              value={formData.hotelId}
              onChange={(e) => handleInputChange('hotelId', e.value)}
              options={hotels.filter(hotel => hotel.isActive).map(hotel => ({
                label: hotel.name,
                value: hotel.id
              }))}
              placeholder="Select hotel"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <Dropdown
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.value)}
              options={suspensionReasonOptions}
              placeholder="Select reason"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type *
            </label>
            <Dropdown
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.value)}
              options={typeOptions.filter(option => option.value !== null)}
              placeholder="Select type"
              className="w-full"
            />
          </div>

          {formData.type === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (Days) *
              </label>
              <InputNumber
                value={formData.duration}
                onValueChange={(e) => handleInputChange('duration', e.value)}
                placeholder="Enter duration"
                className="w-full"
                min={1}
                max={365}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <InputTextarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes (optional)"
              rows={3}
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowCreateDialog(false)}
            />
            <Button
              label="Suspend Hotel"
              severity="danger"
              loading={loading}
              onClick={handleCreateSuspension}
            />
          </div>
        </div>
      </Dialog>

      {/* Lift Suspension Dialog */}
      <Dialog
        header="Lift Suspension"
        visible={showLiftDialog}
        style={{ width: '40vw' }}
        onHide={() => setShowLiftDialog(false)}
      >
        {selectedSuspension && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Suspension Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>Hotel:</strong> {selectedSuspension.hotel.name}</div>
                <div><strong>Reason:</strong> {selectedSuspension.reason}</div>
                <div><strong>Type:</strong> {selectedSuspension.type}</div>
                <div><strong>Suspended:</strong> {formatDate(selectedSuspension.suspendedAt)}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Lifting *
              </label>
              <InputTextarea
                value={liftData.reason}
                onChange={(e) => handleLiftInputChange('reason', e.target.value)}
                placeholder="Explain why the suspension is being lifted"
                rows={3}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <InputTextarea
                value={liftData.notes}
                onChange={(e) => handleLiftInputChange('notes', e.target.value)}
                placeholder="Additional notes (optional)"
                rows={2}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                onClick={() => setShowLiftDialog(false)}
              />
              <Button
                label="Lift Suspension"
                severity="success"
                loading={loading}
                onClick={handleLiftSuspension}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
