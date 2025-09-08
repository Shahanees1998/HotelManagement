'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { Password } from 'primereact/password'
import { Card } from 'primereact/card'
import { Message } from 'primereact/message'
import { Dropdown } from 'primereact/dropdown'
import Link from 'next/link'
import toast from 'react-hot-toast'

const subscriptionPlans = [
  { label: 'Basic - $29/month', value: 'basic' },
  { label: 'Premium - $79/month', value: 'premium' },
  { label: 'Enterprise - $199/month', value: 'enterprise' }
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    hotelName: '',
    hotelEmail: '',
    hotelPhone: '',
    hotelAddress: '',
    hotelCity: '',
    hotelState: '',
    hotelCountry: '',
    hotelZipCode: '',
    subscriptionPlan: 'premium'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/hotels/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Registration successful! Please check your email for verification.')
        router.push('/auth/login')
      } else {
        setError(data.error || 'Registration failed')
        toast.error(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">HotelFeedback Pro</h1>
            <h2 className="text-2xl font-semibold text-gray-900">Create Your Account</h2>
            <p className="text-gray-600 mt-2">Start your free trial today</p>
          </div>

          {error && (
            <Message severity="error" text={error} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <InputText
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <InputText
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <InputText
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <Password
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full"
                    toggleMask
                    feedback={false}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <Password
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full"
                    toggleMask
                    feedback={false}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hotel Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel Name
                  </label>
                  <InputText
                    value={formData.hotelName}
                    onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Email
                    </label>
                    <InputText
                      type="email"
                      value={formData.hotelEmail}
                      onChange={(e) => handleInputChange('hotelEmail', e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hotel Phone
                    </label>
                    <InputText
                      value={formData.hotelPhone}
                      onChange={(e) => handleInputChange('hotelPhone', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <InputText
                    value={formData.hotelAddress}
                    onChange={(e) => handleInputChange('hotelAddress', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <InputText
                      value={formData.hotelCity}
                      onChange={(e) => handleInputChange('hotelCity', e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <InputText
                      value={formData.hotelState}
                      onChange={(e) => handleInputChange('hotelState', e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <InputText
                      value={formData.hotelZipCode}
                      onChange={(e) => handleInputChange('hotelZipCode', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <InputText
                    value={formData.hotelCountry}
                    onChange={(e) => handleInputChange('hotelCountry', e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Subscription Plan */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plan</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Your Plan
                </label>
                <Dropdown
                  value={formData.subscriptionPlan}
                  onChange={(e) => handleInputChange('subscriptionPlan', e.value)}
                  options={subscriptionPlans}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              type="submit"
              label="Create Account & Start Free Trial"
              className="w-full"
              size="large"
              loading={loading}
              disabled={loading}
            />
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
