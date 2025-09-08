'use client'

import { Card } from 'primereact/card'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { FilterMatchMode } from 'primereact/api'
import { useState } from 'react'

interface Hotel {
  id: string
  name: string
  email: string
  city: string
  state: string
  subscriptionPlan?: string
  subscriptionStatus: string
  isActive: boolean
  createdAt: string
  _count: {
    reviews: number
    users: number
  }
  subscription?: {
    plan: string
    status: string
  }
}

interface HotelsWithReviewsProps {
  hotels: Hotel[]
}

export default function HotelsWithReviews({ hotels }: HotelsWithReviewsProps) {
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

  const getPlanSeverity = (plan?: string) => {
    switch (plan) {
      case 'basic': return 'info'
      case 'premium': return 'warning'
      case 'enterprise': return 'success'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const reviewsBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="text-center">
        <div className="text-lg font-bold text-blue-600">{rowData._count.reviews}</div>
        <div className="text-xs text-gray-500">reviews</div>
      </div>
    )
  }

  const usersBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{rowData._count.users}</div>
        <div className="text-xs text-gray-500">users</div>
      </div>
    )
  }

  const planBodyTemplate = (rowData: Hotel) => {
    const plan = rowData.subscription?.plan || rowData.subscriptionPlan || 'No Plan'
    return (
      <Tag 
        value={plan.charAt(0).toUpperCase() + plan.slice(1)} 
        severity={getPlanSeverity(plan)}
      />
    )
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

  const actionsBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Reviews"
          onClick={() => {
            window.location.href = `/super-admin/reviews?hotelId=${rowData.id}`
          }}
        />
        <Button
          icon="pi pi-ban"
          size="small"
          severity="danger"
          tooltip="Suspend Hotel"
          onClick={() => {
            window.location.href = `/super-admin/suspensions?hotelId=${rowData.id}`
          }}
        />
        <Button
          icon="pi pi-building"
          size="small"
          severity="secondary"
          tooltip="View Hotel"
          onClick={() => {
            window.location.href = `/super-admin/hotels/${rowData.id}`
          }}
        />
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">Hotels & Review Counts</h2>
        <span className="text-600">View review counts and activity for each hotel</span>
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
        sortField="_count.reviews"
        sortOrder={-1}
      >
        <Column field="name" header="Hotel Name" sortable style={{ minWidth: '200px' }} />
        <Column field="email" header="Email" sortable style={{ minWidth: '200px' }} />
        <Column field="city" header="Location" sortable body={(rowData) => `${rowData.city}, ${rowData.state}`} style={{ minWidth: '150px' }} />
        <Column header="Plan" body={planBodyTemplate} sortable sortField="subscriptionPlan" style={{ minWidth: '120px' }} />
        <Column field="subscriptionStatus" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
        <Column field="isActive" header="Active" body={activeBodyTemplate} sortable style={{ minWidth: '100px' }} />
        <Column header="Reviews" body={reviewsBodyTemplate} sortable sortField="_count.reviews" style={{ minWidth: '100px' }} />
        <Column header="Users" body={usersBodyTemplate} sortable sortField="_count.users" style={{ minWidth: '100px' }} />
        <Column field="createdAt" header="Joined" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '120px' }} />
        <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
      </DataTable>
    </Card>
  )
}
