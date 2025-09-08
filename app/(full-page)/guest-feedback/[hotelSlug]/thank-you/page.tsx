'use client'

import { useState, useEffect } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'

export default function ThankYouPage() {
  const [hotelName, setHotelName] = useState('')

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
  }, [])

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
