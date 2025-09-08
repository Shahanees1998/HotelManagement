'use client'

import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Checkbox } from 'primereact/checkbox'
import { ColorPicker } from 'primereact/colorpicker'
import { Divider } from 'primereact/divider'
import toast from 'react-hot-toast'

interface Hotel {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  googleReviewUrl?: string
  address: string
  city: string
  state: string
  country: string
  zipCode?: string
  description?: string
  logo?: string
  primaryColor: string
  secondaryColor: string
  allowExternalSharing: boolean
  autoApproveReviews: boolean
}

interface HotelSettingsProps {
  hotel: Hotel
}

export default function HotelSettings({ hotel }: HotelSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: hotel.name,
    email: hotel.email,
    phone: hotel.phone || '',
    website: hotel.website || '',
    googleReviewUrl: hotel.googleReviewUrl || '',
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    country: hotel.country,
    zipCode: hotel.zipCode || '',
    description: hotel.description || '',
    logo: hotel.logo || '',
    primaryColor: hotel.primaryColor,
    secondaryColor: hotel.secondaryColor,
    allowExternalSharing: hotel.allowExternalSharing,
    autoApproveReviews: hotel.autoApproveReviews
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.email || !formData.address || !formData.city || !formData.state || !formData.country) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/hotels/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Settings updated successfully!')
      } else {
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('Error updating settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hotel Name *
                </label>
                <InputText
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter hotel name"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <InputText
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  className="w-full"
                  type="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <InputText
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <InputText
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Review URL
                </label>
                <InputText
                  value={formData.googleReviewUrl}
                  onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)}
                  placeholder="https://www.google.com/maps/place/your-hotel/reviews"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  This URL will be shown to guests who give 4-5 star ratings to encourage Google reviews
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your hotel"
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Location Information */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <InputText
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter street address"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <InputText
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <InputText
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="Enter state"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <InputText
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Enter country"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <InputText
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="Enter ZIP code"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Branding */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <InputText
                  value={formData.logo}
                  onChange={(e) => handleInputChange('logo', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.value)}
                    className="w-12 h-10"
                  />
                  <InputText
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.value)}
                    className="w-12 h-10"
                  />
                  <InputText
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#1E40AF"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Review Settings */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  inputId="allowExternalSharing"
                  checked={formData.allowExternalSharing}
                  onChange={(e) => handleInputChange('allowExternalSharing', e.checked)}
                />
                <label htmlFor="allowExternalSharing" className="text-sm font-medium text-gray-700">
                  Allow external sharing of reviews
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-6">
                When enabled, guests with high ratings (4-5 stars) will see options to share their reviews on Google and TripAdvisor
              </p>

              <div className="flex items-center gap-3">
                <Checkbox
                  inputId="autoApproveReviews"
                  checked={formData.autoApproveReviews}
                  onChange={(e) => handleInputChange('autoApproveReviews', e.checked)}
                />
                <label htmlFor="autoApproveReviews" className="text-sm font-medium text-gray-700">
                  Auto-approve high-rated reviews
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-6">
                When enabled, reviews with 4-5 star ratings will be automatically approved for external sharing
              </p>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            label="Save Settings"
            loading={loading}
            disabled={loading}
            size="large"
          />
        </div>
      </form>
    </div>
  )
}
