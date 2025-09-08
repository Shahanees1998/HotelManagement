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
import { Dialog } from 'primereact/dialog'
import { InputTextarea } from 'primereact/inputtextarea'
import toast from 'react-hot-toast'

interface Form {
  name: string
}

interface Review {
  id: string
  guestName?: string
  guestEmail?: string
  overallRating?: number
  status: string
  createdAt: string
  form: Form
  responses: any
  adminNotes?: string
}

interface ReviewsTableProps {
  reviews: Review[]
}

export default function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    status: { value: null, matchMode: FilterMatchMode.EQUALS },
    overallRating: { value: null, matchMode: FilterMatchMode.EQUALS }
  })
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Shared Externally', value: 'SHARED_EXTERNALLY' }
  ]

  const ratingOptions = [
    { label: 'All Ratings', value: null },
    { label: '5 Stars', value: 5 },
    { label: '4 Stars', value: 4 },
    { label: '3 Stars', value: 3 },
    { label: '2 Stars', value: 2 },
    { label: '1 Star', value: 1 }
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
      case 'PENDING': return 'warning'
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'danger'
      case 'SHARED_EXTERNALLY': return 'info'
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

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-500">No rating</span>
    
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`pi ${i < rating ? 'pi-star-fill' : 'pi-star'} text-yellow-500`}
          ></i>
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
      </div>
    )
  }

  const handleViewReview = (review: Review) => {
    setSelectedReview(review)
    setAdminNotes(review.adminNotes || '')
    setShowReviewDialog(true)
  }

  const handleUpdateStatus = async (reviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/hotels/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast.success('Review status updated successfully')
        window.location.reload()
      } else {
        toast.error('Failed to update review status')
      }
    } catch (error) {
      toast.error('Error updating review status')
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedReview) return

    try {
      const response = await fetch(`/api/hotels/reviews/${selectedReview.id}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      })

      if (response.ok) {
        toast.success('Notes saved successfully')
        setShowReviewDialog(false)
        window.location.reload()
      } else {
        toast.error('Failed to save notes')
      }
    } catch (error) {
      toast.error('Error saving notes')
    }
  }

  const statusBodyTemplate = (rowData: Review) => {
    return (
      <Tag
        value={rowData.status.replace('_', ' ')}
        severity={getStatusSeverity(rowData.status)}
      />
    )
  }

  const ratingBodyTemplate = (rowData: Review) => {
    return renderStars(rowData.overallRating)
  }

  const actionsBodyTemplate = (rowData: Review) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          size="small"
          severity="info"
          tooltip="View Details"
          onClick={() => handleViewReview(rowData)}
        />
        {rowData.status === 'PENDING' && (
          <>
            <Button
              icon="pi pi-check"
              size="small"
              severity="success"
              tooltip="Approve"
              onClick={() => handleUpdateStatus(rowData.id, 'APPROVED')}
            />
            <Button
              icon="pi pi-times"
              size="small"
              severity="danger"
              tooltip="Reject"
              onClick={() => handleUpdateStatus(rowData.id, 'REJECTED')}
            />
          </>
        )}
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">Guest Reviews</h2>
        <span className="text-600">Manage and respond to guest feedback</span>
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
          value={filters.overallRating.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['overallRating'].value = e.value
            setFilters(_filters)
          }}
          options={ratingOptions}
          placeholder="Rating"
          className="w-full"
        />
      </div>
    </div>
  )

  return (
    <>
      <Card>
        <DataTable
          value={reviews}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} reviews"
          globalFilterFields={['guestName', 'guestEmail', 'form.name']}
          filters={filters}
          header={header}
          emptyMessage="No reviews found."
          responsiveLayout="scroll"
        >
          <Column field="guestName" header="Guest" sortable body={(rowData) => rowData.guestName || 'Anonymous'} style={{ minWidth: '150px' }} />
          <Column field="guestEmail" header="Email" sortable style={{ minWidth: '200px' }} />
          <Column field="overallRating" header="Rating" body={ratingBodyTemplate} sortable style={{ minWidth: '150px' }} />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="form.name" header="Form" sortable style={{ minWidth: '150px' }} />
          <Column field="createdAt" header="Date" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '150px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '150px' }} />
        </DataTable>
      </Card>

      {/* Review Details Dialog */}
      <Dialog
        header="Review Details"
        visible={showReviewDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowReviewDialog(false)}
      >
        {selectedReview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                <p className="text-gray-900">{selectedReview.guestName || 'Anonymous'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{selectedReview.guestEmail || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div>{renderStars(selectedReview.overallRating)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Tag
                  value={selectedReview.status.replace('_', ' ')}
                  severity={getStatusSeverity(selectedReview.status)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responses</label>
              <div className="bg-gray-50 p-4 rounded-lg">
                {Object.entries(selectedReview.responses).map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <InputTextarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes about this review..."
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                label="Cancel"
                severity="secondary"
                onClick={() => setShowReviewDialog(false)}
              />
              <Button
                label="Save Notes"
                onClick={handleSaveNotes}
              />
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
