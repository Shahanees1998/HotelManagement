"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questionCount: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  questions: {
    id: string;
    question: string;
    type: string;
    isRequired: boolean;
    order: number;
  }[];
}

export default function AdminTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    search: "",
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.category, filters.status, filters.search]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminTemplates();
      setTemplates((response as any).data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      showToast("error", "Error", "Failed to load form templates");
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleStatusChange = async (templateId: string, newStatus: boolean) => {
    try {
      // TODO: Implement status change API call
      setTemplates(prev => prev.map(template => 
        template.id === templateId ? { ...template, isActive: newStatus } : template
      ));
      showToast("success", "Success", "Template status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update template status");
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.description.trim() || !newTemplate.category.trim()) {
      showToast("warn", "Warning", "Please fill in all required fields");
      return;
    }

    try {
      // TODO: Implement create template API call
      const newId = (templates.length + 1).toString();
      const template: FormTemplate = {
        id: newId,
        name: newTemplate.name,
        description: newTemplate.description,
        category: newTemplate.category,
        questionCount: 0,
        isActive: true,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        questions: [],
      };
      
      setTemplates(prev => [template, ...prev]);
      setNewTemplate({ name: "", description: "", category: "" });
      setShowCreateModal(false);
      showToast("success", "Success", "Template created successfully");
    } catch (error) {
      showToast("error", "Error", "Failed to create template");
    }
  };

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "General": return "blue";
      case "Dining": return "green";
      case "Events": return "purple";
      case "Check-out": return "orange";
      case "Spa": return "pink";
      default: return "gray";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const templateBodyTemplate = (rowData: FormTemplate) => {
    return (
      <div>
        <div className="font-semibold">{rowData.name}</div>
        <div className="text-sm text-600">{rowData.description}</div>
        <div className="text-sm text-500">{rowData.questionCount} questions</div>
      </div>
    );
  };

  const categoryBodyTemplate = (rowData: FormTemplate) => {
    return (
      <Tag 
        value={rowData.category} 
        severity={getCategoryColor(rowData.category) as any} 
      />
    );
  };

  const statusBodyTemplate = (rowData: FormTemplate) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.isActive ? "Active" : "Inactive"} 
          severity={getStatusSeverity(rowData.isActive) as any} 
        />
        <Button
          icon={rowData.isActive ? "pi pi-times" : "pi pi-check"}
          size="small"
          className={`p-button-outlined p-button-sm ${
            rowData.isActive ? "p-button-danger" : "p-button-success"
          }`}
          onClick={() => handleStatusChange(rowData.id, !rowData.isActive)}
          tooltip={rowData.isActive ? "Deactivate" : "Activate"}
        />
      </div>
    );
  };

  const usageBodyTemplate = (rowData: FormTemplate) => {
    return (
      <div className="text-center">
        <div className="font-semibold">{rowData.usageCount}</div>
        <div className="text-sm text-600">times used</div>
      </div>
    );
  };

  const filteredTemplates = templates.filter(template => {
    if (filters.category && template.category !== filters.category) return false;
    if (filters.status && template.isActive.toString() !== filters.status) return false;
    if (filters.search && !template.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !template.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Paginate the filtered templates
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const categoryOptions = [
    { label: "All Categories", value: "" },
    { label: "General", value: "General" },
    { label: "Dining", value: "Dining" },
    { label: "Events", value: "Events" },
    { label: "Check-out", value: "Check-out" },
    { label: "Spa", value: "Spa" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Form Templates</h1>
            <p className="text-600 mt-2 mb-0">Manage form templates for hotels to use.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Create Template"
              icon="pi pi-plus"
              onClick={() => setShowCreateModal(true)}
              className="p-button-success"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadTemplates}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <Card title="Filters" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Search Templates</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by name or description..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Category</label>
              <Dropdown
                value={filters.category}
                options={categoryOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.value }))}
                placeholder="All Categories"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Status</label>
              <Dropdown
                value={filters.status}
                options={statusOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                placeholder="All Statuses"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Templates Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading templates...</p>
              </div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-file text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Templates Found</h3>
              <p className="text-600 mb-4">
                {templates.length === 0 
                  ? "No form templates have been created yet." 
                  : "No templates match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={paginatedTemplates}
              >
              <Column field="template" header="Template" body={templateBodyTemplate} sortable />
              <Column field="category" header="Category" body={categoryBodyTemplate} sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} sortable />
              <Column field="usage" header="Usage" body={usageBodyTemplate} sortable />
              <Column 
                field="createdAt" 
                header="Created" 
                body={(rowData) => formatDate(rowData.createdAt)}
                sortable 
              />              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={filteredTemplates.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </Card>
      </div>

      {/* Create Template Dialog */}
      <Dialog
        header="Create New Template"
        visible={showCreateModal}
        style={{ width: '50vw' }}
        onHide={() => setShowCreateModal(false)}
        modal
        maximizable
        blockScroll
      >
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Template Name *</label>
          <InputText
            value={newTemplate.name}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter template name..."
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Description *</label>
          <InputTextarea
            value={newTemplate.description}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}placeholder="Enter template description..."
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Category *</label>
          <Dropdown
            value={newTemplate.category}
            options={categoryOptions.filter(opt => opt.value !== "")}
            onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.value }))}
            placeholder="Select category..."
            className="w-full"
          />
        </div>
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-outlined"
            onClick={() => setShowCreateModal(false)}
          />
          <Button
            label="Create Template"
            icon="pi pi-check"
            onClick={handleCreateTemplate}
          />
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
