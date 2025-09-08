'use client'

import { useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import toast from 'react-hot-toast'

interface User {
  firstName: string
  lastName: string
  email: string
  createdAt: string
}

interface Hotel {
  id: string
  name: string
  email: string
  phone?: string
  city: string
  state: string
  country: string
  subscriptionStatus: string
  subscriptionPlan?: string
  isActive: boolean
  createdAt: string
  users: User[]
  _count: {
    reviews: number
    qrCodes: number
  }
}

interface HotelsTableProps {
  hotels: Hotel[]
}

export default function HotelsTable({ hotels }: HotelsTableProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    subscriptionStatus: { value: null, matchMode: FilterMatchMode.EQUALS },
    isActive: { value: null, matchMode: FilterMatchMode.EQUALS }
  })

  const subscriptionStatusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Past Due', value: 'PAST_DUE' }
  ]

  const activeStatusOptions = [
    { label: 'All Hotels', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
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
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'warning'
      case 'CANCELLED': return 'danger'
      case 'PAST_DUE': return 'warning'
      default: return 'secondary'
    }
  }

  const getActiveSeverity = (isActive: boolean) => {
    return isActive ? 'success' : 'danger'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleToggleActive = async (hotelId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/hotels/${hotelId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        toast.success(`Hotel ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        // Refresh the page or update the data
        window.location.reload()
      } else {
        toast.error('Failed to update hotel status')
      }
    } catch (error) {
      toast.error('Error updating hotel status')
    }
  }

  const statusBodyTemplate = (rowData: Hotel) => {
    return (
      <Tag
        value={rowData.subscriptionStatus.replace('_', ' ')}
        severity={getStatusSeverity(rowData.subscriptionStatus)}
      />
    )
  }

  const activeBodyTemplate = (rowData: Hotel) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={getActiveSeverity(rowData.isActive)}
      />
    )
  }

  const adminBodyTemplate = (rowData: Hotel) => {
    const admin = rowData.users[0]
    if (!admin) return <span className="text-gray-500">No admin</span>
    
    return (
      <div>
        <div className="font-medium">{admin.firstName} {admin.lastName}</div>
        <div className="text-sm text-gray-600">{admin.email}</div>
      </div>
    )
  }

  const statsBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{rowData._count.reviews}</div>
        <div className="text-xs text-gray-500">reviews</div>
        <div className="text-sm font-medium mt-1">{rowData._count.qrCodes}</div>
        <div className="text-xs text-gray-500">QR codes</div>
      </div>
    )
  }

  const actionsBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="flex gap-2">
        <Button
          icon={rowData.isActive ? 'pi pi-times' : 'pi pi-check'}
          size="small"
          severity={rowData.isActive ? 'danger' : 'success'}
          tooltip={rowData.isActive ? 'Deactivate' : 'Activate'}
          onClick={() => handleToggleActive(rowData.id, rowData.isActive)}
        />
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Details"
          onClick={() => {
            // Navigate to hotel details
            window.location.href = `/super-admin/hotels/${rowData.id}`
          }}
        />
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">All Hotels</h2>
        <span className="text-600">Manage hotel accounts and subscriptions</span>
      </div>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search hotels..."
            className="w-full"
          />
        </span>
        <Dropdown
          value={filters.subscriptionStatus.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['subscriptionStatus'].value = e.value
            setFilters(_filters)
          }}
          options={subscriptionStatusOptions}
          placeholder="Status"
          className="w-full"
        />
        <Dropdown
          value={filters.isActive.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['isActive'].value = e.value
            setFilters(_filters)
          }}
          options={activeStatusOptions}
          placeholder="Active"
          className="w-full"
        />
      </div>
    </div>
  )

  return (
    <Card>
      <DataTable
        value={hotels}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} hotels"
        globalFilterFields={['name', 'email', 'city', 'state']}
        filters={filters}
        header={header}
        emptyMessage="No hotels found."
        responsiveLayout="scroll"
      >
        <Column field="name" header="Hotel Name" sortable style={{ minWidth: '200px' }} />
        <Column field="email" header="Email" sortable style={{ minWidth: '200px' }} />
        <Column field="city" header="Location" sortable body={(rowData) => `${rowData.city}, ${rowData.state}`} style={{ minWidth: '150px' }} />
        <Column field="subscriptionStatus" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
        <Column field="isActive" header="Active" body={activeBodyTemplate} sortable style={{ minWidth: '100px' }} />
        <Column header="Admin" body={adminBodyTemplate} style={{ minWidth: '200px' }} />
        <Column header="Stats" body={statsBodyTemplate} style={{ minWidth: '100px' }} />
        <Column field="createdAt" header="Joined" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '120px' }} />
        <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
      </DataTable>
    </Card>
  )
}
