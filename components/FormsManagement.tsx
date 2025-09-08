'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Button } from 'primereact/button'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Dialog } from 'primereact/dialog'
import { InputText } from 'primereact/inputtext'
import { InputTextarea } from 'primereact/inputtextarea'
import { Dropdown } from 'primereact/dropdown'
import { Checkbox } from 'primereact/checkbox'
import { InputText as PrimeInputText } from 'primereact/inputtext'
import toast from 'react-hot-toast'
import { STRIPE_CONFIG } from '@/lib/stripe'

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
  isActive: boolean
  isDefault: boolean
  createdAt: string
  fields: FormField[]
  _count: {
    reviews: number
  }
}

interface FormsManagementProps {
  forms: Form[]
  hotelId: string
}

export default function FormsManagement({ forms, hotelId }: FormsManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fields: [] as any[]
  })

  const [hotelPlan, setHotelPlan] = useState<string>('basic')

  // Get hotel plan to show available field types
  useEffect(() => {
    const fetchHotelPlan = async () => {
      try {
        const response = await fetch('/api/hotels/current')
        const data = await response.json()
        if (data.hotel) {
          setHotelPlan(data.hotel.subscriptionPlan || 'basic')
        }
      } catch (error) {
        console.error('Error fetching hotel plan:', error)
      }
    }
    fetchHotelPlan()
  }, [])

  const getAvailableFieldTypes = () => {
    const planConfig = STRIPE_CONFIG.plans[hotelPlan as keyof typeof STRIPE_CONFIG.plans] || STRIPE_CONFIG.plans.basic
    return [
      { label: 'Text Input', value: 'TEXT' },
      { label: 'Text Area', value: 'TEXTAREA' },
      { label: 'Rating (1-5 stars)', value: 'RATING' },
      { label: 'Single Choice', value: 'SINGLE_CHOICE' },
      { label: 'Multiple Choice', value: 'MULTIPLE_CHOICE' },
      { label: 'Email', value: 'EMAIL' },
      { label: 'Phone', value: 'PHONE' },
      { label: 'File Upload (Images/Videos)', value: 'FILE_UPLOAD' }
    ].filter(field => planConfig.allowedFieldTypes.includes(field.value))
  }

  const fieldTypes = getAvailableFieldTypes()

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addField = () => {
    const planConfig = STRIPE_CONFIG.plans[hotelPlan as keyof typeof STRIPE_CONFIG.plans] || STRIPE_CONFIG.plans.basic
    
    // Check field count limit
    if (formData.fields.length >= planConfig.maxFields) {
      toast.error(`Your plan allows maximum ${planConfig.maxFields} fields. Please upgrade to add more fields.`)
      return
    }
    
    const newField = {
      label: '',
      type: 'TEXT',
      required: false,
      placeholder: '',
      options: [],
      order: formData.fields.length + 1
    }
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }))
  }

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }))
  }

  const updateField = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }))
  }

  const addOption = (fieldIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === fieldIndex 
          ? { ...f, options: [...(f.options || []), ''] }
          : f
      )
    }))
  }

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === fieldIndex 
          ? { 
              ...f, 
              options: f.options?.map((opt, j) => 
                j === optionIndex ? value : opt
              ) || []
            }
          : f
      )
    }))
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === fieldIndex 
          ? { 
              ...f, 
              options: f.options?.filter((_, j) => j !== optionIndex) || []
            }
          : f
      )
    }))
  }

  const handleCreateForm = async () => {
    if (!formData.name.trim()) {
      toast.error('Form name is required')
      return
    }

    if (formData.fields.length === 0) {
      toast.error('At least one field is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/forms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form created successfully!')
        setShowCreateDialog(false)
        setFormData({ name: '', description: '', fields: [] })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to create form')
      }
    } catch (error) {
      toast.error('Error creating form')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateForm = async () => {
    if (!editingForm) return
    
    if (!formData.name.trim()) {
      toast.error('Form name is required')
      return
    }

    if (formData.fields.length === 0) {
      toast.error('At least one field is required')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/forms/${editingForm.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form updated successfully!')
        setShowEditDialog(false)
        setEditingForm(null)
        setFormData({ name: '', description: '', fields: [] })
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to update form')
      }
    } catch (error) {
      toast.error('Error updating form')
    } finally {
      setLoading(false)
    }
  }

  const handleEditForm = (form: Form) => {
    setEditingForm(form)
    setFormData({
      name: form.name,
      description: form.description || '',
      fields: form.fields.map(field => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        placeholder: field.placeholder || '',
        options: field.options || [],
        order: field.order
      }))
    })
    setShowEditDialog(true)
  }

  const handleToggleActive = async (formId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/forms/${formId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (response.ok) {
        toast.success(`Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        window.location.reload()
      } else {
        toast.error('Failed to update form status')
      }
    } catch (error) {
      toast.error('Error updating form status')
    }
  }

  const statusBodyTemplate = (rowData: Form) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    )
  }

  const actionsBodyTemplate = (rowData: Form) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          size="small"
          severity="info"
          tooltip="Edit Form"
          onClick={() => handleEditForm(rowData)}
        />
        <Button
          icon={rowData.isActive ? 'pi pi-times' : 'pi pi-check'}
          size="small"
          severity={rowData.isActive ? 'danger' : 'success'}
          tooltip={rowData.isActive ? 'Deactivate' : 'Activate'}
          onClick={() => handleToggleActive(rowData.id, rowData.isActive)}
        />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Create Form Button */}
      <div className="flex justify-end">
        <Button
          label="Create New Form"
          icon="pi pi-plus"
          onClick={() => setShowCreateDialog(true)}
        />
      </div>

      {/* Forms Table */}
      <Card className="dashboard-card">
        <DataTable
          value={forms}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} forms"
          emptyMessage="No forms found."
          responsiveLayout="scroll"
        >
          <Column field="name" header="Form Name" sortable style={{ minWidth: '200px' }} />
          <Column field="description" header="Description" style={{ minWidth: '200px' }} />
          <Column field="fields" header="Fields" body={(rowData) => rowData.fields.length} sortable style={{ minWidth: '100px' }} />
          <Column field="_count.reviews" header="Reviews" sortable style={{ minWidth: '100px' }} />
          <Column field="isActive" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="createdAt" header="Created" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '120px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '150px' }} />
        </DataTable>
      </Card>

      {/* Create Form Dialog */}
      <Dialog
        header="Create New Form"
        visible={showCreateDialog}
        style={{ width: '70vw' }}
        onHide={() => setShowCreateDialog(false)}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Name *
              </label>
              <InputText
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Guest Satisfaction Survey"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <InputTextarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
              <Button
                label="Add Field"
                icon="pi pi-plus"
                size="small"
                onClick={addField}
              />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {formData.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Label *
                      </label>
                      <InputText
                        value={field.label}
                        onChange={(e) => updateField(index, 'label', e.target.value)}
                        placeholder="e.g., Overall Rating"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field Type
                      </label>
                      <Dropdown
                        value={field.type}
                        onChange={(e) => updateField(index, 'type', e.value)}
                        options={fieldTypes}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center">
                      <Checkbox
                        inputId={`required-${index}`}
                        checked={field.required}
                        onChange={(e) => updateField(index, 'required', e.checked)}
                      />
                      <label htmlFor={`required-${index}`} className="ml-2 text-sm">
                        Required field
                      </label>
                    </div>
                  </div>

                  {field.type === 'TEXT' || field.type === 'TEXTAREA' || field.type === 'EMAIL' || field.type === 'PHONE' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placeholder Text
                      </label>
                      <InputText
                        value={field.placeholder}
                        onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                        placeholder="Optional placeholder text..."
                        className="w-full"
                      />
                    </div>
                  ) : null}

                  {(field.type === 'SINGLE_CHOICE' || field.type === 'MULTIPLE_CHOICE') && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Options
                        </label>
                        <Button
                          label="Add Option"
                          icon="pi pi-plus"
                          size="small"
                          onClick={() => addOption(index)}
                        />
                      </div>
                      <div className="space-y-2">
                        {field.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <InputText
                              value={option}
                              onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="flex-1"
                            />
                            <Button
                              icon="pi pi-times"
                              size="small"
                              severity="danger"
                              onClick={() => removeOption(index, optionIndex)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <Button
                      label="Remove Field"
                      icon="pi pi-times"
                      size="small"
                      severity="danger"
                      onClick={() => removeField(index)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowCreateDialog(false)}
            />
            <Button
              label="Create Form"
              loading={loading}
              onClick={handleCreateForm}
            />
          </div>
        </div>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog
        header="Edit Form"
        visible={showEditDialog}
        style={{ width: '70vw' }}
        onHide={() => {
          setShowEditDialog(false)
          setEditingForm(null)
          setFormData({ name: '', description: '', fields: [] })
        }}
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Name *
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter form name..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <InputText
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter form description..."
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Form Fields</h3>
              <Button
                label="Add Field"
                icon="pi pi-plus"
                onClick={addField}
              />
            </div>

            <div className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Label *
                        </label>
                        <InputText
                          value={field.label}
                          onChange={(e) => updateField(index, 'label', e.target.value)}
                          placeholder="Enter field label..."
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Type
                        </label>
                        <Dropdown
                          value={field.type}
                          onChange={(e) => updateField(index, 'type', e.value)}
                          options={fieldTypes}
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center">
                        <Checkbox
                          inputId={`edit-required-${index}`}
                          checked={field.required}
                          onChange={(e) => updateField(index, 'required', e.checked)}
                        />
                        <label htmlFor={`edit-required-${index}`} className="ml-2 text-sm">
                          Required field
                        </label>
                      </div>
                    </div>

                    {field.type === 'TEXT' || field.type === 'TEXTAREA' || field.type === 'EMAIL' || field.type === 'PHONE' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Placeholder Text
                        </label>
                        <InputText
                          value={field.placeholder}
                          onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                          placeholder="Optional placeholder text..."
                          className="w-full"
                        />
                      </div>
                    ) : null}

                    {(field.type === 'SINGLE_CHOICE' || field.type === 'MULTIPLE_CHOICE') && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options
                          </label>
                          <Button
                            label="Add Option"
                            icon="pi pi-plus"
                            size="small"
                            onClick={() => addOption(index)}
                          />
                        </div>
                        <div className="space-y-2">
                          {field.options?.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <InputText
                                value={option}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1"
                              />
                              <Button
                                icon="pi pi-times"
                                size="small"
                                severity="danger"
                                onClick={() => removeOption(index, optionIndex)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="ml-4">
                      <Button
                        icon="pi pi-times"
                        size="small"
                        severity="danger"
                        tooltip="Remove Field"
                        onClick={() => removeField(index)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => {
                setShowEditDialog(false)
                setEditingForm(null)
                setFormData({ name: '', description: '', fields: [] })
              }}
            />
            <Button
              label="Update Form"
              loading={loading}
              onClick={handleUpdateForm}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
