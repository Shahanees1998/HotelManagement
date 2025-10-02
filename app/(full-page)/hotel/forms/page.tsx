"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import FeedbackFormBuilder from "@/components/FeedbackFormBuilder";
import { CustomPaginator } from "@/components/CustomPaginator";

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
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingFormId, setEditingFormId] = useState<string | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/forms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setForms(data.data);
      } else {
        throw new Error(data.error || 'Failed to load forms');
      }
    } catch (error) {
      console.error("Error loading forms:", error);
      showToast("error", "Error", "Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleCreateForm = () => {
    setEditingFormId(null);
    setShowFormBuilder(true);
  };

  const handleEditForm = (formId: string) => {
    setEditingFormId(formId);
    setShowFormBuilder(true);
  };

  const handleFormSaved = async (form: any) => {
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
  };

  const handleDeleteForm = async (formId: string) => {
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
  };

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <Tag 
        value={rowData.isActive ? "Active" : "Inactive"} 
        severity={getStatusSeverity(rowData.isActive) as any} 
      />
    );
  };

  const actionsBodyTemplate = (rowData: FeedbackForm) => {
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
  };

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
                value={forms.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)}
              >
              <Column field="title" header="Form Title" sortable />
              <Column field="description" header="Description" />
              <Column field="questionsCount" header="Questions" sortable />
              <Column field="totalResponses" header="Responses" sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} />
              <Column 
                field="updatedAt" 
                header="Last Updated" 
                body={(rowData) => formatDate(rowData.updatedAt)}
                sortable 
              />
              <Column header="Actions" body={actionsBodyTemplate} />              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={forms.length}
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
