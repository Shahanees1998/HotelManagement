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

interface Hotel {
  id: string
  name: string
  city: string
  state: string
}

interface Review {
  id: string
  guestName?: string
  guestEmail?: string
  overallRating?: number
  status: string
  createdAt: string
  hotel: Hotel
  form: {
    name: string
  }
}

interface SuperAdminReviewsTableProps {
  reviews: Review[]
  hotels: Hotel[]
}

export default function SuperAdminReviewsTable({ reviews, hotels }: SuperAdminReviewsTableProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    hotel: { value: null, matchMode: FilterMatchMode.EQUALS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS }
  })

  const hotelOptions = [
    { label: 'All Hotels', value: null },
    ...hotels.map(hotel => ({
      label: `${hotel.name} (${hotel.city}, ${hotel.state})`,
      value: hotel.id
    }))
  ]

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Shared Externally', value: 'SHARED_EXTERNALLY' }
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
      case 'APPROVED': return 'success'
      case 'PENDING': return 'warning'
      case 'REJECTED': return 'danger'
      case 'SHARED_EXTERNALLY': return 'info'
      default: return 'secondary'
    }
  }

  const getRatingSeverity = (rating?: number) => {
    if (!rating) return 'secondary'
    if (rating >= 4) return 'success'
    if (rating >= 3) return 'warning'
    return 'danger'
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

  const handleStatusUpdate = async (reviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/hotels/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Review status updated successfully')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to update review status')
      }
    } catch (error) {
      toast.error('Error updating review status')
    }
  }

  const hotelBodyTemplate = (rowData: Review) => {
    return (
      <div>
        <div className="font-medium">{rowData.hotel.name}</div>
        <div className="text-sm text-gray-600">{rowData.hotel.city}, {rowData.hotel.state}</div>
      </div>
    )
  }

  const guestBodyTemplate = (rowData: Review) => {
    return (
      <div>
        <div className="font-medium">{rowData.guestName || 'Anonymous'}</div>
        {rowData.guestEmail && (
          <div className="text-sm text-gray-600">{rowData.guestEmail}</div>
        )}
      </div>
    )
  }

  const ratingBodyTemplate = (rowData: Review) => {
    if (!rowData.overallRating) {
      return <span className="text-gray-500">No rating</span>
    }
    
    return (
      <div className="flex items-center gap-2">
        <Tag
          value={`${rowData.overallRating}/5`}
          severity={getRatingSeverity(rowData.overallRating)}
        />
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={`pi pi-star-fill text-sm ${
                i < rowData.overallRating! ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  const statusBodyTemplate = (rowData: Review) => {
    return (
      <Tag
        value={rowData.status.replace('_', ' ')}
        severity={getStatusSeverity(rowData.status)}
      />
    )
  }

  const actionsBodyTemplate = (rowData: Review) => {
    return (
      <div className="flex gap-2">
        {rowData.status === 'PENDING' && (
          <>
            <Button
              icon="pi pi-check"
              size="small"
              severity="success"
              tooltip="Approve"
              onClick={() => handleStatusUpdate(rowData.id, 'APPROVED')}
            />
            <Button
              icon="pi pi-times"
              size="small"
              severity="danger"
              tooltip="Reject"
              onClick={() => handleStatusUpdate(rowData.id, 'REJECTED')}
            />
          </>
        )}
        {rowData.status === 'APPROVED' && rowData.overallRating && rowData.overallRating >= 4 && (
          <Button
            icon="pi pi-share-alt"
            size="small"
            severity="info"
            tooltip="Mark as Shared"
            onClick={() => handleStatusUpdate(rowData.id, 'SHARED_EXTERNALLY')}
          />
        )}
        <Button
          icon="pi pi-eye"
          size="small"
          severity="secondary"
          tooltip="View Details"
          onClick={() => {
            // Navigate to review details or open modal
            console.log('View review details:', rowData.id)
          }}
        />
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">All Reviews</h2>
        <span className="text-600">Manage reviews from all hotels</span>
      </div>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search reviews..."
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
    <Card>
      <DataTable
        value={reviews}
        paginator
        rows={15}
        rowsPerPageOptions={[10, 15, 25, 50]}
        className="datatable-responsive"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reviews"
        globalFilterFields={['guestName', 'guestEmail', 'hotel.name', 'hotel.city']}
        filters={filters}
        header={header}
        emptyMessage="No reviews found."
        responsiveLayout="scroll"
      >
        <Column field="hotel.name" header="Hotel" body={hotelBodyTemplate} sortable style={{ minWidth: '200px' }} />
        <Column field="guestName" header="Guest" body={guestBodyTemplate} sortable style={{ minWidth: '180px' }} />
        <Column header="Rating" body={ratingBodyTemplate} sortable sortField="overallRating" style={{ minWidth: '120px' }} />
        <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
        <Column field="form.name" header="Form" sortable style={{ minWidth: '150px' }} />
        <Column field="createdAt" header="Date" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '150px' }} />
        <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '150px' }} />
      </DataTable>
    </Card>
  )
}
