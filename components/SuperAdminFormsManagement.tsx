'use client'

import { useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Tag } from 'primereact/tag'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { Dialog } from 'primereact/dialog'
import { FilterMatchMode } from 'primereact/api'
import toast from 'react-hot-toast'

interface Hotel {
  id: string
  name: string
  subscriptionPlan?: string
}

interface FormField {
  id: string
  label: string
  type: string
  required: boolean
  placeholder?: string
  options: string[]
  order: number
}

interface Form {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  hotel: Hotel
  fields: FormField[]
  _count: {
    reviews: number
  }
}

interface SuperAdminFormsManagementProps {
  forms: Form[]
  hotels: Hotel[]
}

export default function SuperAdminFormsManagement({ forms, hotels }: SuperAdminFormsManagementProps) {
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    hotel: { value: null, matchMode: FilterMatchMode.EQUALS },
    isActive: { value: null, matchMode: FilterMatchMode.EQUALS }
  })
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingForm, setEditingForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    hotelId: '',
    name: '',
    description: '',
    fields: [] as any[]
  })

  const hotelOptions = [
    { label: 'All Hotels', value: null },
    ...hotels.map(hotel => ({
      label: `${hotel.name} (${hotel.subscriptionPlan || 'No Plan'})`,
      value: hotel.id
    }))
  ]

  const activeStatusOptions = [
    { label: 'All Forms', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ]

  const fieldTypes = [
    { label: 'Text Input', value: 'TEXT' },
    { label: 'Text Area', value: 'TEXTAREA' },
    { label: 'Rating (1-5 stars)', value: 'RATING' },
    { label: 'Single Choice', value: 'SINGLE_CHOICE' },
    { label: 'Multiple Choice', value: 'MULTIPLE_CHOICE' },
    { label: 'Email', value: 'EMAIL' },
    { label: 'Phone', value: 'PHONE' },
    { label: 'File Upload (Images/Videos)', value: 'FILE_UPLOAD' }
  ]

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value
    let _filters = { ...filters }
    _filters['global'].value = value
    setFilters(_filters)
    setGlobalFilterValue(value)
  }

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? 'success' : 'danger'
  }

  const getPlanSeverity = (plan?: string) => {
    switch (plan) {
      case 'basic': return 'info'
      case 'premium': return 'warning'
      case 'enterprise': return 'success'
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addField = () => {
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
          ? { ...f, options: f.options.map((opt, j) => j === optionIndex ? value : opt) }
          : f
      )
    }))
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map((f, i) => 
        i === fieldIndex 
          ? { ...f, options: f.options.filter((_, j) => j !== optionIndex) }
          : f
      )
    }))
  }

  const handleCreateForm = async () => {
    if (!formData.hotelId || !formData.name || formData.fields.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/super-admin/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form created successfully')
        setShowCreateDialog(false)
        setFormData({ hotelId: '', name: '', description: '', fields: [] })
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

  const handleEditForm = async () => {
    if (!editingForm || !formData.name || formData.fields.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/super-admin/forms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: editingForm.id,
          ...formData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form updated successfully')
        setShowEditDialog(false)
        setEditingForm(null)
        setFormData({ hotelId: '', name: '', description: '', fields: [] })
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

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/forms?formId=${formId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Form deleted successfully')
        window.location.reload()
      } else {
        toast.error(data.error || 'Failed to delete form')
      }
    } catch (error) {
      toast.error('Error deleting form')
    }
  }

  const openEditDialog = (form: Form) => {
    setEditingForm(form)
    setFormData({
      hotelId: form.hotel.id,
      name: form.name,
      description: form.description || '',
      fields: form.fields.map(field => ({
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

  const hotelBodyTemplate = (rowData: Form) => {
    return (
      <div>
        <div className="font-medium">{rowData.hotel.name}</div>
        <Tag 
          value={rowData.hotel.subscriptionPlan || 'No Plan'} 
          severity={getPlanSeverity(rowData.hotel.subscriptionPlan)}
        />
      </div>
    )
  }

  const statusBodyTemplate = (rowData: Form) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={getStatusSeverity(rowData.isActive)}
      />
    )
  }

  const fieldsBodyTemplate = (rowData: Form) => {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{rowData.fields.length}</div>
        <div className="text-xs text-gray-500">fields</div>
      </div>
    )
  }

  const reviewsBodyTemplate = (rowData: Form) => {
    return (
      <div className="text-center">
        <div className="text-sm font-medium">{rowData._count.reviews}</div>
        <div className="text-xs text-gray-500">reviews</div>
      </div>
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
          onClick={() => openEditDialog(rowData)}
        />
        <Button
          icon="pi pi-trash"
          size="small"
          severity="danger"
          tooltip="Delete Form"
          onClick={() => handleDeleteForm(rowData.id)}
        />
      </div>
    )
  }

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex flex-column">
        <h2 className="text-2xl font-bold m-0">All Forms</h2>
        <span className="text-600">Manage forms across all hotels</span>
      </div>
      <div className="flex gap-2">
        <Button
          label="Create Form"
          icon="pi pi-plus"
          onClick={() => setShowCreateDialog(true)}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Search forms..."
            className="w-full"
          />
        </span>
        <Dropdown
          value={filters.hotel.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['hotel'].value = e.value
            setFilters(_filters)
          }}
          options={hotelOptions}
          placeholder="Hotel"
          className="w-full"
        />
        <Dropdown
          value={filters.isActive.value}
          onChange={(e) => {
            let _filters = { ...filters }
            _filters['isActive'].value = e.value
            setFilters(_filters)
          }}
          options={activeStatusOptions}
          placeholder="Status"
          className="w-full"
        />
      </div>
    </div>
  )

  const renderFieldEditor = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Form Fields</h4>
        <Button
          label="Add Field"
          icon="pi pi-plus"
          size="small"
          onClick={addField}
        />
      </div>
      
      {formData.fields.map((field, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h5 className="font-medium">Field {index + 1}</h5>
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              onClick={() => removeField(index)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label *
              </label>
              <InputText
                value={field.label}
                onChange={(e) => updateField(index, 'label', e.target.value)}
                placeholder="Field label"
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <Dropdown
                value={field.type}
                onChange={(e) => updateField(index, 'type', e.value)}
                options={fieldTypes}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder
              </label>
              <InputText
                value={field.placeholder || ''}
                onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                placeholder="Placeholder text"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={field.required}
                onChange={(e) => updateField(index, 'required', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor={`required-${index}`} className="text-sm font-medium text-gray-700">
                Required field
              </label>
            </div>
          </div>
          
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
              
              {field.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex gap-2 mb-2">
                  <InputText
                    value={option}
                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                    className="flex-1"
                  />
                  <Button
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    onClick={() => removeOption(index, optionIndex)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <Card>
        <DataTable
          value={forms}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          className="datatable-responsive"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} forms"
          globalFilterFields={['name', 'hotel.name']}
          filters={filters}
          header={header}
          emptyMessage="No forms found."
          responsiveLayout="scroll"
        >
          <Column field="name" header="Form Name" sortable style={{ minWidth: '200px' }} />
          <Column header="Hotel" body={hotelBodyTemplate} sortable sortField="hotel.name" style={{ minWidth: '200px' }} />
          <Column header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '100px' }} />
          <Column header="Fields" body={fieldsBodyTemplate} style={{ minWidth: '100px' }} />
          <Column header="Reviews" body={reviewsBodyTemplate} style={{ minWidth: '100px' }} />
          <Column field="createdAt" header="Created" sortable body={(rowData) => formatDate(rowData.createdAt)} style={{ minWidth: '120px' }} />
          <Column header="Actions" body={actionsBodyTemplate} style={{ minWidth: '120px' }} />
        </DataTable>
      </Card>

      {/* Create Form Dialog */}
      <Dialog
        header="Create New Form"
        visible={showCreateDialog}
        style={{ width: '70vw' }}
        onHide={() => setShowCreateDialog(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hotel *
            </label>
            <Dropdown
              value={formData.hotelId}
              onChange={(e) => handleInputChange('hotelId', e.value)}
              options={hotels.map(hotel => ({
                label: `${hotel.name} (${hotel.subscriptionPlan || 'No Plan'})`,
                value: hotel.id
              }))}
              placeholder="Select hotel"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Name *
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter form name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputText
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter form description"
              className="w-full"
            />
          </div>

          {renderFieldEditor()}

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
        onHide={() => setShowEditDialog(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hotel
            </label>
            <Dropdown
              value={formData.hotelId}
              onChange={(e) => handleInputChange('hotelId', e.value)}
              options={hotels.map(hotel => ({
                label: `${hotel.name} (${hotel.subscriptionPlan || 'No Plan'})`,
                value: hotel.id
              }))}
              placeholder="Select hotel"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Name *
            </label>
            <InputText
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter form name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputText
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter form description"
              className="w-full"
            />
          </div>

          {renderFieldEditor()}

          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              onClick={() => setShowEditDialog(false)}
            />
            <Button
              label="Update Form"
              loading={loading}
              onClick={handleEditForm}
            />
          </div>
        </div>
      </Dialog>
    </div>
  )
}
