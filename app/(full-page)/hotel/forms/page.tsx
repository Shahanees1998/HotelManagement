"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import FeedbackFormBuilder from "@/components/FeedbackFormBuilder";
import { CustomPaginator } from "@/components/CustomPaginator";
import { apiClient } from "@/lib/apiClient";

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  layout: string;
  questionsCount: number;
  totalResponses: number;
  createdAt: string;
  updatedAt: string;
}

export default function HotelForms() {
  const { user } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelForms({
        status: filters.status,
        search: filters.search,
        page: currentPage,
        limit: rowsPerPage,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setForms((response as any).data || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading forms:", error);
      showToast("error", "Error", "Failed to load forms");
      setForms([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.search, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.search]);

  const handleCreateForm = useCallback(() => {
    setEditingFormId(null);
    setShowFormBuilder(true);
  }, []);

  const handleEditForm = useCallback((formId: string) => {
    setEditingFormId(formId);
    setShowFormBuilder(true);
  }, []);

  const handleFormSaved = useCallback(async (form: any) => {
    console.log("handleFormSaved called with:", form);
    try {
      const url = editingFormId ? `/api/hotel/forms/${editingFormId}` : '/api/hotel/forms';
      const method = editingFormId ? 'PUT' : 'POST';

      console.log("Saving form to:", url, "with method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        console.log("Form saved successfully, closing builder");
        setShowFormBuilder(false);
        setEditingFormId(null);
        loadForms(); // Refresh the list
        showToast("success", "Success", editingFormId ? "Form updated successfully" : "Form created successfully");
      } else {
        throw new Error(data.error || 'Failed to save form');
      }
    } catch (error) {
      console.error("Error saving form:", error);
      showToast("error", "Error", "Failed to save form");
    }
  }, [editingFormId, showToast]);

  const handleDeleteForm = useCallback(async (formId: string) => {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/hotel/forms/${formId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          showToast("success", "Success", "Form deleted successfully");
          loadForms();
        } else {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete form');
        }
      } catch (error) {
        console.error("Error deleting form:", error);
        showToast("error", "Error", "Failed to delete form");
      }
    }
  }, [showToast]);

  const getStatusSeverity = useCallback((isActive: boolean) => {
    return isActive ? "success" : "danger";
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const statusBodyTemplate = useMemo(() => (rowData: FeedbackForm) => {
    return (
      <Tag 
        value={rowData.isActive ? "Active" : "Inactive"} 
        severity={getStatusSeverity(rowData.isActive) as any} 
      />
    );
  }, [getStatusSeverity]);

  const actionsBodyTemplate = useMemo(() => (rowData: FeedbackForm) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleEditForm(rowData.id)}
          tooltip="Edit Form"
        />
        <Button
          icon="pi pi-trash"
          size="small"
          className="p-button-outlined p-button-danger p-button-sm"
          onClick={() => handleDeleteForm(rowData.id)}
          tooltip="Delete Form"
        />
      </div>
    );
  }, [handleEditForm, handleDeleteForm]);

  const statusOptions = useMemo(() => [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ], []);

  if (showFormBuilder) {
    return (
      <div className="grid">
        <div className="col-12">
     
          <FeedbackFormBuilder
            formId={editingFormId || undefined}
            onSave={handleFormSaved}
            onCancel={() => setShowFormBuilder(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Feedback Forms</h1>
            <p className="text-600 mt-2 mb-0">Create and manage your guest feedback forms.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Create Form"
              icon="pi pi-plus"
              onClick={handleCreateForm}
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadForms}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <Card className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="search" className="block text-900 font-medium mb-2">
                  Search Forms
                </label>
                <InputText
                  id="search"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  placeholder="Search by title or description..."
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="field">
                <label htmlFor="status" className="block text-900 font-medium mb-2">
                  Status
                </label>
                <Dropdown
                  id="status"
                  value={filters.status}
                  options={statusOptions}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                  placeholder="Select status"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Forms Table */}
      <div className="col-12">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading forms...</p>
              </div>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-file-edit text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Forms Created Yet</h3>
              <p className="text-600 mb-4">Create your first feedback form to start collecting guest reviews.</p>
              <Button
                label="Create Your First Form"
                icon="pi pi-plus"
                onClick={handleCreateForm}
              />
            </div>
          ) : (
            <>
              <DataTable 
                value={forms}
                dataKey="id"
                emptyMessage="No Forms found"
                className="p-datatable-sm"
                scrollable
                scrollHeight="400px"
              >
                <Column field="title" header="Form Title" sortable style={{ minWidth: '200px' }} />
                <Column field="description" header="Description" style={{ minWidth: '250px' }} />
                <Column field="questionsCount" header="Questions" sortable style={{ minWidth: '100px' }} />
                <Column field="totalResponses" header="Responses" sortable style={{ minWidth: '100px' }} />
                <Column field="status" header="Status" body={statusBodyTemplate} style={{ minWidth: '120px' }} />
                <Column 
                  field="updatedAt" 
                  header="Last Updated" 
                  body={(rowData) => formatDate(rowData.updatedAt)}
                  sortable 
                  style={{ minWidth: '150px' }}
                />
                <Column 
                  header="Actions" 
                  body={actionsBodyTemplate} 
                  style={{ minWidth: '120px' }}
                  frozen
                  alignFrozen="right"
                />
              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={totalRecords}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
      </div>

      <Toast ref={toast} />
    </div>
  );
}
