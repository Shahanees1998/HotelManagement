'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'

export default function ShareReviewPage() {
  const [hotelName, setHotelName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get hotel name from URL or API
    const pathSegments = window.location.pathname.split('/')
    const hotelSlug = pathSegments[2]
    
    // Fetch hotel info
    fetch(`/api/guest-feedback/${hotelSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.hotel) {
          setHotelName(data.hotel.name)
        }
      })
      .catch(error => {
        console.error('Error fetching hotel info:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const handleShareGoogle = async () => {
    try {
      const pathSegments = window.location.pathname.split('/')
      const hotelSlug = pathSegments[2]
      const urlParams = new URLSearchParams(window.location.search)
      const reviewId = urlParams.get('reviewId')

      if (!reviewId) {
        toast.error('Review ID not found')
        return
      }

      const response = await fetch('/api/external-sharing/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hotelSlug, reviewId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Open Google Reviews in new tab
        window.open(data.urls.googleReviews, '_blank')
        toast.success('Opening Google Reviews...')
      } else {
        toast.error('Failed to generate Google sharing link')
      }
    } catch (error) {
      toast.error('Error sharing on Google')
    }
  }

  const handleShareTripAdvisor = async () => {
    try {
      const pathSegments = window.location.pathname.split('/')
      const hotelSlug = pathSegments[2]
      const urlParams = new URLSearchParams(window.location.search)
      const reviewId = urlParams.get('reviewId')

      if (!reviewId) {
        toast.error('Review ID not found')
        return
      }

      const response = await fetch('/api/external-sharing/tripadvisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hotelSlug, reviewId }),
      })

      const data = await response.json()

      if (response.ok) {
        // Open TripAdvisor in new tab
        window.open(data.urls.tripAdvisorSearch, '_blank')
        toast.success('Opening TripAdvisor...')
      } else {
        toast.error('Failed to generate TripAdvisor sharing link')
      }
    } catch (error) {
      toast.error('Error sharing on TripAdvisor')
    }
  }

  const handleSkip = () => {
    toast.success('Thank you for your feedback!')
    // Redirect to thank you page
    setTimeout(() => {
      window.location.href = window.location.pathname.replace('/share', '/thank-you')
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-4"></i>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="feedback-form">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="pi pi-star-fill text-green-600 text-2xl"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank You for Your Feedback!
            </h1>
            <p className="text-lg text-gray-600">
              We're thrilled you had a great experience at {hotelName}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-green-800 mb-3">
              Help Others Discover {hotelName}
            </h2>
            <p className="text-green-700 mb-4">
              Your positive feedback can help other travelers discover this wonderful place. 
              Would you like to share your experience on these popular review platforms?
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <Button
              label="Share on Google Reviews"
              icon="pi pi-google"
              className="w-full"
              size="large"
              onClick={handleShareGoogle}
            />
            
            <Button
              label="Share on TripAdvisor"
              icon="pi pi-globe"
              className="w-full"
              size="large"
              severity="secondary"
              onClick={handleShareTripAdvisor}
            />
          </div>

          <div className="text-center">
            <Button
              label="Skip Sharing"
              text
              onClick={handleSkip}
              className="text-gray-500"
            />
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Your feedback has been saved and will help us improve our services.
              Thank you for taking the time to share your experience!
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
