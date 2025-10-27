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
import { Dialog } from "primereact/dialog";
import { useRef } from "react";
import QRCode from "qrcode";
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
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<any>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrFormTitle, setQrFormTitle] = useState<string>("");
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

  const handlePreviewForm = useCallback(async (formId: string) => {
    try {
      const response = await fetch(`/api/hotel/forms/${formId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewForm(data.data);
        setPreviewFormId(formId);
      } else {
        throw new Error('Failed to load form for preview');
      }
    } catch (error) {
      console.error("Error loading form for preview:", error);
      showToast("error", "Error", "Failed to load form for preview");
    }
  }, [showToast]);

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
        // Show the actual error message from the API
        const errorMessage = data.error || 'Failed to save form';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      // Extract and show the actual error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to save form';
      showToast("error", "Error", errorMessage);
    }
  }, [editingFormId, showToast]);

  const handleShowQrCode = useCallback(async (formId: string, formTitle: string) => {
    try {
      // First try to get existing QR code
      const qrResponse = await fetch(`/api/hotel/qr-codes/by-form/${formId}`);
      
      if (qrResponse.ok) {
        // QR code exists, show it
        const qrData = await qrResponse.json();
        setQrCodeUrl(qrData.url);
        setQrFormTitle(formTitle);
        
        // Generate QR code image
        const qrDataUrl = await QRCode.toDataURL(qrData.url, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(qrDataUrl);
        setShowQrDialog(true);
      } else {
        // QR code doesn't exist, generate it
        const response = await fetch("/api/hotel/qr-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hotelId: user?.hotelId,
            formId: formId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setQrCodeUrl(data.url);
          setQrFormTitle(formTitle);
          
          // Generate QR code image
          const qrDataUrl = await QRCode.toDataURL(data.url, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeDataUrl(qrDataUrl);
          setShowQrDialog(true);
          showToast("success", "Success", "QR code generated successfully");
        } else {
          const errorData = await response.json();
          if (response.status === 409 && errorData.existingQrCode) {
            // QR code already exists, show it
            setQrCodeUrl(errorData.existingQrCode.url);
            setQrFormTitle(formTitle);
            
            const qrDataUrl = await QRCode.toDataURL(errorData.existingQrCode.url, {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });
            setQrCodeDataUrl(qrDataUrl);
            setShowQrDialog(true);
            showToast("info", "Info", "QR code already exists for this form");
          } else {
            throw new Error(errorData.error || "Failed to generate QR code");
          }
        }
      }
    } catch (error) {
      console.error("Error handling QR code:", error);
      showToast("error", "Error", "Failed to handle QR code");
    }
  }, [user?.hotelId, showToast]);

  const downloadQrCode = useCallback(() => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.download = `qr-code-${qrFormTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  }, [qrCodeDataUrl, qrFormTitle]);

  const copyQrUrl = useCallback(async () => {
    if (!qrCodeUrl) {
      showToast("warn", "Warning", "No URL to copy");
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(qrCodeUrl);
        showToast("success", "Copied!", "URL copied to clipboard");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = qrCodeUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showToast("success", "Copied!", "URL copied to clipboard");
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", "Error", "Failed to copy URL to clipboard");
    }
  }, [qrCodeUrl, showToast]);

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
          icon="pi pi-eye"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handlePreviewForm(rowData.id)}
          tooltip="Preview Form"
        />
        <Button
          icon="pi pi-qrcode"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleShowQrCode(rowData.id, rowData.title)}
          tooltip="QR Code"
        />
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
  }, [handleEditForm, handleDeleteForm, handleShowQrCode]);

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

  if (previewForm) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="flex align-items-center gap-3 mb-4">
            <Button
              icon="pi pi-arrow-left"
              className="p-button-text"
              onClick={() => {
                setPreviewForm(null);
                setPreviewFormId(null);
              }}
              tooltip="Back to Forms"
            />
            <h1 className="text-3xl font-bold m-0">Form Preview</h1>
          </div>
          <FeedbackFormBuilder
            formId={previewFormId || undefined}
            onSave={() => {}} // No save functionality in preview
            onCancel={() => {
              setPreviewForm(null);
              setPreviewFormId(null);
            }}
            previewMode={true}
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
                
              >
                <Column field="title" header="Form Title" sortable style={{ minWidth: '200px' }} />
                <Column field="description" header="Description" style={{ minWidth: '250px' }} />
                <Column field="questionsCount" header="Questions" sortable style={{ minWidth: '100px' }} />
                <Column field="totalResponses" header="Responses" sortable style={{ minWidth: '100px' }} />
                <Column field="status" header="Status" body={statusBodyTemplate} style={{ minWidth: '120px' }} />

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

      {/* QR Code Dialog */}
      <Dialog
        header={`QR Code - ${qrFormTitle}`}
        visible={showQrDialog}
        style={{ width: '400px' }}
        onHide={() => setShowQrDialog(false)}
        modal
      >
        <div className="text-center">
          {qrCodeDataUrl && (
            <>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="mb-4"
                style={{ 
                  maxWidth: "100%", 
                  height: "auto",
                  borderRadius: '8px'
                }}
              />
              <div className="flex flex-column gap-2">
                <Button
                  label="Download QR Code"
                  icon="pi pi-download"
                  onClick={downloadQrCode}
                  className="w-full"
                />
                <Button
                  label="Copy URL"
                  icon="pi pi-copy"
                  onClick={copyQrUrl}
                  className="p-button-outlined w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
