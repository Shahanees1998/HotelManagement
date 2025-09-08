'use client'

import { useState } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Message } from 'primereact/message'
import toast from 'react-hot-toast'

interface Hotel {
  id: string
  name: string
  email: string
  phone?: string
}

interface ContactSuperAdminProps {
  hotel: Hotel
}

export default function ContactSuperAdmin({ hotel }: ContactSuperAdminProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  })

  const categoryOptions = [
    { label: 'General Inquiry', value: 'general' },
    { label: 'Technical Support', value: 'technical' },
    { label: 'Billing Question', value: 'billing' },
    { label: 'Feature Request', value: 'feature' },
    { label: 'Bug Report', value: 'bug' },
    { label: 'Account Issue', value: 'account' },
    { label: 'Other', value: 'other' }
  ]

  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject || !formData.category || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/contact/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          hotelId: hotel.id,
          hotelName: hotel.name,
          hotelEmail: hotel.email,
          hotelPhone: hotel.phone
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Message sent successfully! We\'ll get back to you soon.')
        setFormData({
          subject: '',
          category: '',
          message: '',
          priority: 'medium'
        })
      } else {
        toast.error(data.error || 'Failed to send message')
      }
    } catch (error) {
      toast.error('Error sending message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact Form */}
      <div className="lg:col-span-2">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Send Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <InputText
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="Brief description of your inquiry"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <Dropdown
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.value)}
                    options={categoryOptions}
                    placeholder="Select category"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <Dropdown
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.value)}
                    options={priorityOptions}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <InputTextarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Please provide detailed information about your inquiry..."
                  rows={6}
                  className="w-full"
                  required
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  label="Send Message"
                  loading={loading}
                  disabled={loading}
                />
              </div>
            </form>
          </div>
        </Card>
      </div>

      {/* Contact Information */}
      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Hotel Details</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <div>{hotel.name}</div>
                  <div>{hotel.email}</div>
                  {hotel.phone && <div>{hotel.phone}</div>}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Support Hours</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <div>Monday - Friday: 9:00 AM - 6:00 PM</div>
                  <div>Saturday: 10:00 AM - 4:00 PM</div>
                  <div>Sunday: Closed</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Response Time</h4>
                <div className="text-sm text-gray-600 mt-1">
                  <div>General inquiries: 24-48 hours</div>
                  <div>Technical issues: 4-8 hours</div>
                  <div>Urgent matters: 1-2 hours</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <i className="pi pi-check-circle text-green-500 mt-0.5"></i>
                <span>Be specific about your issue or question</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-check-circle text-green-500 mt-0.5"></i>
                <span>Include any error messages or screenshots</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-check-circle text-green-500 mt-0.5"></i>
                <span>Mention your subscription plan if relevant</span>
              </div>
              <div className="flex items-start gap-2">
                <i className="pi pi-check-circle text-green-500 mt-0.5"></i>
                <span>Check our FAQ section first for common questions</span>
              </div>
            </div>
          </div>
        </Card>

        <Message
          severity="info"
          text="For urgent technical issues, please call our support hotline at (555) 123-4567"
          className="w-full"
        />
      </div>
    </div>
  )
}
