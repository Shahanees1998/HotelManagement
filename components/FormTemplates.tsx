'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { Tag } from 'primereact/tag'
import toast from 'react-hot-toast'

interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  fields: Array<{
    label: string
    type: string
    required: boolean
    placeholder?: string
    options?: string[]
    order: number
  }>
}

interface FormTemplatesProps {
  hotelId: string
}

export default function FormTemplates({ hotelId }: FormTemplatesProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/forms/templates')
      const data = await response.json()
      
      if (response.ok) {
        setTemplates(data.templates)
        setCategories(data.categories)
      } else {
        toast.error('Failed to fetch templates')
      }
    } catch (error) {
      toast.error('Error fetching templates')
    }
  }

  const filteredTemplates = selectedCategory 
    ? templates.filter(template => template.category === selectedCategory)
    : templates

  const handleUseTemplate = async (template: FormTemplate) => {
    setLoading(true)
    try {
      const response = await fetch('/api/forms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${template.name} (Template)`,
          description: `Created from ${template.name} template`,
          fields: template.fields
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form created successfully from template!')
        // Redirect to forms page
        window.location.href = '/hotel-dashboard/forms'
      } else {
        toast.error(data.error || 'Failed to create form from template')
      }
    } catch (error) {
      toast.error('Error creating form from template')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewTemplate = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'General': 'blue',
      'Restaurant': 'orange',
      'Room Service': 'green',
      'Spa': 'purple',
      'Events': 'pink'
    }
    return colors[category as keyof typeof colors] || 'gray'
  }

  const getFieldTypeIcon = (type: string) => {
    const icons = {
      'TEXT': 'pi pi-align-left',
      'TEXTAREA': 'pi pi-align-justify',
      'RATING': 'pi pi-star',
      'SINGLE_CHOICE': 'pi pi-circle',
      'MULTIPLE_CHOICE': 'pi pi-check-square',
      'EMAIL': 'pi pi-envelope',
      'PHONE': 'pi pi-phone',
      'FILE_UPLOAD': 'pi pi-upload'
    }
    return icons[type as keyof typeof icons] || 'pi pi-question'
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Available Templates</h2>
          <p className="text-gray-600">Choose a template to get started quickly</p>
        </div>
        <div className="flex items-center gap-4">
          <Dropdown
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.value)}
            options={[
              { label: 'All Categories', value: null },
              ...categories.map(cat => ({ label: cat, value: cat }))
            ]}
            placeholder="Filter by category"
            className="w-48"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="dashboard-card">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                <Tag
                  value={template.category}
                  severity={getCategoryColor(template.category) as any}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Form Fields:</h4>
                <div className="space-y-1">
                  {template.fields.slice(0, 3).map((field, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className={getFieldTypeIcon(field.type)}></i>
                      <span>{field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                    </div>
                  ))}
                  {template.fields.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{template.fields.length - 3} more fields
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  label="Use Template"
                  icon="pi pi-plus"
                  size="small"
                  className="flex-1"
                  onClick={() => handleUseTemplate(template)}
                  loading={loading}
                />
                <Button
                  icon="pi pi-eye"
                  size="small"
                  severity="secondary"
                  tooltip="Preview Template"
                  onClick={() => handlePreviewTemplate(template)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog
        header={`Preview: ${selectedTemplate?.name}`}
        visible={showPreviewDialog}
        style={{ width: '70vw' }}
        onHide={() => setShowPreviewDialog(false)}
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Details</h3>
              <p className="text-gray-600">{selectedTemplate.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Tag
                  value={selectedTemplate.category}
                  severity={getCategoryColor(selectedTemplate.category) as any}
                />
                <span className="text-sm text-gray-600">
                  {selectedTemplate.fields.length} fields
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Form Fields Preview</h4>
              <div className="space-y-4">
                {selectedTemplate.fields.map((field, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <i className={getFieldTypeIcon(field.type)}></i>
                      <span className="font-medium text-gray-900">{field.label}</span>
                      {field.required && <span className="text-red-500">*</span>}
                      <Tag
                        value={field.type.replace('_', ' ')}
                        severity="info"
                        className="ml-auto"
                      />
                    </div>
                    {field.placeholder && (
                      <p className="text-sm text-gray-600">Placeholder: {field.placeholder}</p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-1">Options:</p>
                        <div className="flex flex-wrap gap-1">
                          {field.options.map((option, optIndex) => (
                            <Tag
                              key={optIndex}
                              value={option}
                              severity="secondary"
                              className="text-xs"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                label="Close"
                severity="secondary"
                onClick={() => setShowPreviewDialog(false)}
              />
              <Button
                label="Use This Template"
                onClick={() => {
                  setShowPreviewDialog(false)
                  handleUseTemplate(selectedTemplate)
                }}
                loading={loading}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Custom Form Option */}
      <Card className="dashboard-card">
        <div className="text-center py-8">
          <i className="pi pi-plus-circle text-4xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Something Custom?</h3>
          <p className="text-gray-600 mb-4">
            Create a completely custom form tailored to your specific needs
          </p>
          <Button
            label="Create Custom Form"
            icon="pi pi-pencil"
            onClick={() => {
              window.location.href = '/hotel-dashboard/forms'
            }}
          />
        </div>
      </Card>
    </div>
  )
}
