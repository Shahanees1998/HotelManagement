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
  subscription?: {
    plan: string
    status: string
  }
}

interface Refund {
  id: string
  amount: number
  reason: string
  status: string
  stripeRefundId?: string
  processedAt?: string
  notes?: string
  createdAt: string
  hotel: Hotel
  subscription?: {
    id: string
    plan: string
    stripeSubscriptionId?: string
  }
}

interface RefundsManagementProps {
  refunds: Refund[]
  hotels: Hotel[]
}

export default function RefundsManagement({ refunds, hotels }: RefundsManagementProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    hotel: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS }
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hotelId: '',
    amount: 0,
    reason: '',
    notes: ''
  })

  const hotelOptions = [
    { label: 'All Hotels', value: null },
    ...hotels.filter(hotel => hotel.subscription?.status === 'ACTIVE').map(hotel => ({
      label: `${hotel.name} (${hotel.subscription?.plan || 'No Plan'})`,
      value: hotel.id
    }))
  ]

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Failed', value: 'failed' },
    { label: 'Cancelled', value: 'cancelled' }
  ]

  const reasonOptions = [
    { label: 'Customer Request', value: 'customer_request' },
    { label: 'Service Issue', value: 'service_issue' },
    { label: 'Billing Error', value: 'billing_error' },
    { label: 'Duplicate Payment', value: 'duplicate_payment' },
    { label: 'Cancellation', value: 'cancellation' },
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
      case 'completed': return 'success'
      case 'processing': return 'warning'
      case 'pending': return 'info'
      case 'failed': return 'danger'
      case 'cancelled': return 'secondary'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateRefund = async () => {
    if (!formData.hotelId || !formData.amount || !formData.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/super-admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Refund processed successfully')
        setShowCreateDialog(false)
        setFormData({
          hotelId: '',
          amount: 0,
          reason: '',
          notes: ''
        })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to process refund')
      }
    } catch (error) {
      toast.error('Error processing refund')
    } finally {
      setLoading(false)
    }
  }

  const hotelBodyTemplate = (rowData: Refund) => {
    return (
      <div>
        <div className="font-medium">{rowData.hotel.name}</div>
        <div className="text-sm text-gray-600">{rowData.hotel.email}</div>
      </div>
    )
  }

  const amountBodyTemplate = (rowData: Refund) => {
    return (
      <div className="text-right">
        <div className="font-bold text-green-600">{formatCurrency(rowData.amount)}</div>
      </div>
    )
  }

  const statusBodyTemplate = (rowData: Refund) => {
    return (
      <Tag
        value={rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)}
        severity={getStatusSeverity(rowData.status)}
      />
    )
  }

  const subscriptionBodyTemplate = (rowData: Refund) => {
    if (!rowData.subscription) {
      return <span className="text-gray-500">No subscription</span>
    }
    
    return (
      <div>
        <div className="font-medium">{rowData.subscription.plan}</div>
        {rowData.stripeRefundId && (
          <div className="text-xs text-gray-500">ID: {rowData.stripeRefundId.slice(-8)}</div>
        )}
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: Refund) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'pending' && (
          <Button
            icon="pi pi-check"
            size="small"
            severity="success"
            tooltip="Mark as Completed"
            onClick={() => {
              // TODO: Implement mark as completed functionality
              console.log('Mark as completed:', rowData.id)
            }}
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
        <h2 className="text-2xl font-bold m-0">Refunds</h2>
        <span className="text-600">Manage refunds and track processing status</span>
      </div>
      <div className="flex gap-2">
        <Button
          label="Process Refund"
          icon="pi pi-plus"
          onClick={() => setShowCreateDialog(true)}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search refunds..."
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
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <DataTable
          value={refunds}
          paginator
          rows={15}
          rowsPerPageOptions={[10, 15, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} refunds"
          globalFilterFields={['hotel.name', 'hotel.email', 'reason', 'status']}
          filters={filters}
          header={header}
          emptyMessage="No refunds found."
          responsiveLayout="scroll"
        >
          <Column field="hotel.name" header="Hotel" body={hotelBodyTemplate} sortable style={{ minWidth: '200px' }} />
          <Column header="Amount" body={amountBodyTemplate} sortable sortField="amount" style={{ minWidth: '120px' }} />
          <Column field="reason" header="Reason" sortable style={{ minWidth: '150px' }} />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column header="Subscription" body={subscriptionBodyTemplate} style={{ minWidth: '150px' }} />
          <Column field="createdAt" header="Created" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '150px' }} />
          <Column field="processedAt" header="Processed" sortable body={(rowData) => rowData.processedAt ? formatDate(rowData.processedAt) : '-'} style={{ minWidth: '150px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
        </DataTable>
      </Card>

      {/* Create Refund Dialog */}
      <Dialog
        header="Process Refund"
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
              options={hotels.filter(hotel => hotel.subscription?.status === 'ACTIVE').map(hotel => ({
                label: `${hotel.name} (${hotel.subscription?.plan || 'No Plan'})`,
                value: hotel.id
              }))}
              placeholder="Select hotel"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ($) *
            </label>
            <InputNumber
              value={formData.amount}
              onValueChange={(e) => handleInputChange('amount', e.value)}
              mode="currency"
              currency="USD"
              locale="en-US"
              placeholder="Enter refund amount"
              className="w-full"
              min={0.01}
              max={9999.99}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason *
            </label>
            <Dropdown
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.value)}
              options={reasonOptions}
              placeholder="Select reason"
              className="w-full"
            />
          </div>

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
              label="Process Refund"
              loading={loading}
              onClick={handleCreateRefund}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
