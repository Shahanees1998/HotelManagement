"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  hotelName: string;
  hotelSlug: string;
  isActive: boolean;
  isPublic: boolean;
  questionCount: number;
  responseCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminForms() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    hotel: searchParams.get('hotelId') || "",
    status: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminForms({
        hotel: filters.hotel,
        status: filters.status,
        search: filters.search,
        page: currentPage,
        limit: rowsPerPage,
      });
      setForms((response as any).data || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading forms:", error);
      showToast("error", "Error", "Failed to load feedback forms");
      setForms([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.hotel, filters.status, filters.search, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.hotel, filters.status, filters.search]);

  const handleStatusChange = async (formId: string, newStatus: boolean) => {
    try {
      // TODO: Implement status change API call
      setForms(prev => prev.map(form => 
        form.id === formId ? { ...form, isActive: newStatus } : form
      ));
      showToast("success", "Success", "Form status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update form status");
    }
  };

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  const getVisibilitySeverity = (isPublic: boolean) => {
    return isPublic ? "success" : "info";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const hotelBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <div>
        <div className="font-semibold">{rowData.hotelName}</div>
        <div className="text-sm text-600">/{rowData.hotelSlug}</div>
      </div>
    );
  };

  const formBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <div>
        <div className="font-semibold">{rowData.title}</div>
        <div className="text-sm text-600">{rowData.description}</div>
        <div className="text-sm text-500">{rowData.questionCount} questions</div>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: FeedbackForm) => {
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

  const visibilityBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <Tag 
        value={rowData.isPublic ? "Public" : "Private"} 
        severity={getVisibilitySeverity(rowData.isPublic) as any} 
      />
    );
  };

  const ratingBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{rowData.averageRating.toFixed(1)}</span>
        <i className="pi pi-star-fill text-yellow-500"></i>
        <span className="text-sm text-600">({rowData.responseCount})</span>
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: FeedbackForm) => {
    return (
      <div className="flex gap-2">
        <Button
          label="View Details"
          icon="pi pi-eye"
          size="small"
          className="p-button-outlined"
          onClick={() => router.push(`/admin/forms/${rowData.id}`)}
        />
      </div>
    );
  };

  // Server-side filtering - no client-side filtering needed

  const hotelOptions = useMemo(() => [
    { label: "All Hotels", value: "" },
    ...Array.from(new Set(forms.map(f => f.hotelName))).map(hotel => ({
      label: hotel,
      value: hotel,
    })),
  ], [forms]);

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
            <h1 className="text-3xl font-bold m-0">All Feedback Forms</h1>
            <p className="text-600 mt-2 mb-0">Manage all feedback forms across all hotels.</p>
          </div>
          <div className="flex gap-2">
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
        <Card title="Filters" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Search Forms</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by form title or hotel..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Hotel</label>
              <Dropdown
                value={filters.hotel}
                options={hotelOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, hotel: e.value }))}
                placeholder="All Hotels"
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

      {/* Forms Table */}
      <div className="col-12">
        <Card>
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
              <h3 className="text-900 mb-2">No Forms Found</h3>
              <p className="text-600 mb-4">
                {forms.length === 0 
                  ? "No feedback forms have been created yet." 
                  : "No forms match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={forms}
              >
                <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable />
                <Column field="form" header="Form" body={formBodyTemplate} sortable />
                {/* <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="visibility" header="Visibility" body={visibilityBodyTemplate} /> */}
                <Column field="rating" header="Rating" body={ratingBodyTemplate} sortable />
                <Column 
                  field="createdAt" 
                  header="Created" 
                  body={(rowData) => formatDate(rowData.createdAt)}
                  sortable 
                />
                <Column header="Actions" body={actionsBodyTemplate} />
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
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
