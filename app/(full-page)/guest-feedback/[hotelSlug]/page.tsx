'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Checkbox } from 'primereact/checkbox'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'

interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options?: string[]
  order: number
}

interface Form {
  id: string
  name: string
  description?: string
  fields: FormField[]
}

interface Hotel {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string
  logo?: string
}

export default function GuestFeedbackPage() {
  const params = useParams()
  const hotelSlug = params.hotelSlug as string
  
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchFormData()
  }, [hotelSlug])

  const fetchFormData = async () => {
    try {
      const response = await fetch(`/api/guest-feedback/${hotelSlug}`)
      const data = await response.json()
      
      if (response.ok) {
        setHotel(data.hotel)
        setForm(data.form)
        
        // Initialize form data
        const initialData: Record<string, any> = {}
        data.form.fields.forEach((field: FormField) => {
          if (field.type === 'MULTIPLE_CHOICE') {
            initialData[field.id] = []
          } else {
            initialData[field.id] = ''
          }
        })
        setFormData(initialData)
      } else {
        toast.error('Hotel not found')
      }
    } catch (error) {
      toast.error('Error loading form')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    form?.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.id]
        if (!value || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setSubmitting(true)
    
    try {
      // First submit the review
      const response = await fetch(`/api/guest-feedback/${hotelSlug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form?.id,
          responses: formData
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const reviewData = data
        // Upload files if any
        const fileFields = form?.fields.filter(f => f.type === 'FILE_UPLOAD') || []
        for (const field of fileFields) {
          const file = formData[field.id]
          if (file && file instanceof File) {
            const formDataUpload = new FormData()
            formDataUpload.append('file', file)
            formDataUpload.append('reviewId', data.reviewId)
            
            await fetch('/api/upload/media', {
              method: 'POST',
              body: formDataUpload
            })
          }
        }
        
        toast.success('Thank you for your feedback!')
        
        // Check if this is a high rating review (4-5 stars)
        const overallRating = formData[form?.fields.find(f => f.type === 'RATING')?.id || '']
        // Redirect to thank you page with rating information
        const thankYouUrl = `/guest-feedback/${hotelSlug}/thank-you?rating=${reviewData.overallRating || 'none'}&status=${reviewData.status}`
        window.location.href = thankYouUrl
      } else {
        toast.error(data.error || 'Error submitting feedback')
      }
    } catch (error) {
      toast.error('Error submitting feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id] || ''
    const error = errors[field.id]
    
    switch (field.type) {
      case 'TEXT':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <InputText
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full ${error ? 'p-invalid' : ''}`}
            />
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      case 'TEXTAREA':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <InputTextarea
              value={value}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full ${error ? 'p-invalid' : ''}`}
            />
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      case 'RATING':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`pi pi-star star ${star <= value ? 'active' : ''}`}
                  onClick={() => handleInputChange(field.id, star)}
                ></i>
              ))}
            </div>
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      case 'SINGLE_CHOICE':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <Dropdown
              value={value}
              onChange={(e) => handleInputChange(field.id, e.value)}
              options={field.options?.map(opt => ({ label: opt, value: opt })) || []}
              placeholder="Select an option"
              className={`w-full ${error ? 'p-invalid' : ''}`}
            />
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      case 'MULTIPLE_CHOICE':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option} className="flex items-center">
                  <Checkbox
                    inputId={`${field.id}-${option}`}
                    checked={value.includes(option)}
                    onChange={(e) => {
                      const newValue = e.checked
                        ? [...value, option]
                        : value.filter((v: string) => v !== option)
                      handleInputChange(field.id, newValue)
                    }}
                  />
                  <label htmlFor={`${field.id}-${option}`} className="ml-2 text-sm">
                    {option}
                  </label>
                </div>
              ))}
            </div>
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      case 'FILE_UPLOAD':
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleInputChange(field.id, file)
                }
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM). Max size: 10MB
            </p>
            {error && <small className="text-red-500">{error}</small>}
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-4"></i>
          <p>Loading feedback form...</p>
        </div>
      </div>
    )
  }

  if (!hotel || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Message severity="error" text="Hotel not found" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="feedback-form">
          {/* Hotel Branding */}
          <div 
            className="hotel-branding text-white p-6 rounded-t-lg mb-6"
            style={{
              background: `linear-gradient(135deg, ${hotel.primaryColor}, ${hotel.secondaryColor})`
            }}
          >
            <div className="text-center">
              {hotel.logo && (
                <img src={hotel.logo} alt={hotel.name} className="h-16 mx-auto mb-4" />
              )}
              <h1 className="text-2xl font-bold">{hotel.name}</h1>
              <p className="text-lg opacity-90">Guest Feedback Form</p>
            </div>
          </div>

          {/* Form Description */}
          {form.description && (
            <div className="mb-6">
              <p className="text-gray-600 text-center">{form.description}</p>
            </div>
          )}

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.fields
              .sort((a, b) => a.order - b.order)
              .map(renderField)
            }

            <div className="text-center pt-6">
              <Button
                type="submit"
                label="Submit Feedback"
                size="large"
                loading={submitting}
                disabled={submitting}
                className="px-8"
              />
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
