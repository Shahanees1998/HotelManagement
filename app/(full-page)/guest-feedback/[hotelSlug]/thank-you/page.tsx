'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { useSearchParams } from 'next/navigation'

export default function ThankYouPage() {
  const [hotelName, setHotelName] = useState('')
  const [hotelGoogleUrl, setHotelGoogleUrl] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [status, setStatus] = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get rating and status from URL parameters
    const ratingParam = searchParams.get('rating')
    const statusParam = searchParams.get('status')
    
    if (ratingParam && ratingParam !== 'none') {
      setRating(parseInt(ratingParam))
    }
    if (statusParam) {
      setStatus(statusParam)
    }

    // Get hotel name and Google URL from URL or API
    const pathSegments = window.location.pathname.split('/')
    const hotelSlug = pathSegments[2]
    
    // Fetch hotel info
    fetch(`/api/guest-feedback/${hotelSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.hotel) {
          setHotelName(data.hotel.name)
          setHotelGoogleUrl(data.hotel.googleReviewUrl || '')
        }
      })
      .catch(error => {
        console.error('Error fetching hotel info:', error)
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="feedback-form">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="pi pi-check-circle text-blue-600 text-3xl"></i>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              Your feedback has been successfully submitted to {hotelName}
            </p>

            {/* Show rating-specific message */}
            {rating && rating >= 4 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="pi pi-star-fill text-green-600"></i>
                  </div>
                  <h2 className="text-lg font-semibold text-green-800">
                    Excellent Rating!
                  </h2>
                </div>
                <p className="text-green-700 mb-3">
                  Thank you for the {rating}-star rating! We're thrilled that you enjoyed your stay.
                </p>
                {hotelGoogleUrl && (
                  <p className="text-green-700">
                    Help other travelers by sharing your experience on Google Reviews!
                  </p>
                )}
              </div>
            )}

            {rating && rating <= 3 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="pi pi-info-circle text-blue-600"></i>
                  </div>
                  <h2 className="text-lg font-semibold text-blue-800">
                    Feedback Received
                  </h2>
                </div>
                <p className="text-blue-700">
                  Thank you for your honest feedback. We take all reviews seriously and will use your input to improve our services.
                </p>
              </div>
            )}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">
                What happens next?
              </h2>
              <ul className="text-blue-700 text-left space-y-2">
                <li className="flex items-center gap-2">
                  <i className="pi pi-check text-green-600"></i>
                  Your feedback has been received and saved
                </li>
                <li className="flex items-center gap-2">
                  <i className="pi pi-check text-green-600"></i>
                  The hotel team will review your comments
                </li>
                <li className="flex items-center gap-2">
                  <i className="pi pi-check text-green-600"></i>
                  Your input helps improve guest experiences
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              {/* Show Google Review button for high ratings */}
              {rating && rating >= 4 && hotelGoogleUrl && (
                <Button
                  label="Leave a Google Review"
                  icon="pi pi-star"
                  className="w-full"
                  size="large"
                  severity="warning"
                  onClick={() => {
                    window.open(hotelGoogleUrl, '_blank')
                  }}
                />
              )}
              
              <Button
                label="Visit Hotel Website"
                icon="pi pi-external-link"
                className="w-full"
                size="large"
                onClick={() => {
                  // You can add hotel website URL here
                  window.open('#', '_blank')
                }}
              />
              
              <Button
                label="Submit Another Review"
                icon="pi pi-refresh"
                className="w-full"
                size="large"
                severity="secondary"
                onClick={() => {
                  window.location.href = window.location.pathname.replace('/thank-you', '')
                }}
              />
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                We appreciate you taking the time to share your experience.
                Your feedback is valuable to us and helps us serve you better.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
