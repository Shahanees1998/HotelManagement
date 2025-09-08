'use client'

import { Card } from 'primereact/card'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import Link from 'next/link'

interface Review {
  id: string
  guestName?: string
  overallRating?: number
  status: string
  createdAt: string
  form: {
    name: string
  }
}

interface RecentReviewsProps {
  reviews: Review[]
}

export default function RecentReviews({ reviews }: RecentReviewsProps) {
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
      year: 'numeric'
    })
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className={`pi ${i < rating ? 'pi-star-fill' : 'pi-star'} text-yellow-500`}
          ></i>
        ))}
      </div>
    )
  }

  return (
    <Card className="dashboard-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
        <Link href="/hotel-dashboard/reviews">
          <Button label="View All" text />
        </Link>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <i className="pi pi-star text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No reviews yet</p>
          <p className="text-sm text-gray-400">Reviews will appear here as guests submit feedback</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {review.guestName || 'Anonymous Guest'}
                  </h3>
                  <p className="text-sm text-gray-600">{review.form.name}</p>
                </div>
                <div className="text-right">
                  <Tag
                    value={review.status.replace('_', ' ')}
                    severity={getStatusSeverity(review.status)}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                </div>
              </div>
              
              {review.overallRating && (
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(review.overallRating)}
                  <span className="text-sm text-gray-600">
                    {review.overallRating}/5
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
