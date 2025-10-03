"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";
import { Dropdown } from "primereact/dropdown";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  subscriptionStatus: string;
  isActive: boolean;
  totalReviews: number;
  averageRating: number;
  createdAt: string;
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminHotels() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    subscription: "",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadHotels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminHotels({
        status: filters.status,
        subscription: filters.subscription,
        search: filters.search,
        page: currentPage,
        limit: rowsPerPage,
      });
      setHotels((response as any).data || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading hotels:", error);
      showToast("error", "Error", "Failed to load hotels");
      setHotels([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.subscription, filters.search, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadHotels();
  }, [loadHotels]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.subscription, filters.search]);

  const handleStatusChange = async (hotelId: string, newStatus: boolean) => {
    try {
      await apiClient.updateHotelStatus(hotelId, { isActive: newStatus });
      setHotels(prev => prev.map(hotel => 
        hotel.id === hotelId ? { ...hotel, isActive: newStatus } : hotel
      ));
      showToast("success", "Success", "Hotel status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update hotel status");
    }
  };

  const getSubscriptionSeverity = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "TRIAL": return "warning";
      case "CANCELLED": return "danger";
      case "EXPIRED": return "danger";
      case "PAST_DUE": return "warning";
      default: return "info";
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

  const ownerBodyTemplate = (rowData: Hotel) => {
    return (
      <div>
        <div className="font-semibold">{`${rowData.owner?.firstName || 'N/A'} ${rowData.owner?.lastName || ''}`}</div>
        <div className="text-sm text-600">{rowData.owner?.email || 'No email'}</div>
      </div>
    );
  };

  const subscriptionBodyTemplate = (rowData: Hotel) => {
    return (
      <Tag 
        value={rowData.subscriptionStatus} 
        severity={getSubscriptionSeverity(rowData.subscriptionStatus) as any} 
      />
    );
  };

  const statusBodyTemplate = (rowData: Hotel) => {
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

  const ratingBodyTemplate = (rowData: Hotel) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{rowData.averageRating.toFixed(1)}</span>
        <i className="pi pi-star-fill text-yellow-500"></i>
        <span className="text-sm text-600">({rowData.totalReviews})</span>
      </div>
    );
  };

  // Server-side filtering - no client-side filtering needed

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  const subscriptionOptions = [
    { label: "All Subscriptions", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Past Due", value: "PAST_DUE" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">All Hotels</h1>
            <p className="text-600 mt-2 mb-0">Manage all hotels in the system.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadHotels}
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
              <label className="block text-900 font-medium mb-2">Search Hotels</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by hotel name or owner..."
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
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Subscription</label>
              <Dropdown
                value={filters.subscription}
                options={subscriptionOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, subscription: e.value }))}
                placeholder="All Subscriptions"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Hotels Table */}
      <div className="col-12">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading hotels...</p>
              </div>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-building text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Hotels Found</h3>
              <p className="text-600 mb-4">
                {hotels.length === 0 
                  ? "No hotels have been registered yet." 
                  : "No hotels match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={hotels}
              >
                <Column field="name" header="Hotel Name" sortable />
                <Column field="slug" header="URL Slug" />
                <Column field="owner" header="Owner" body={ownerBodyTemplate} />
                <Column field="city" header="Location" sortable />
                <Column field="subscriptionStatus" header="Subscription" body={subscriptionBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column field="rating" header="Rating" body={ratingBodyTemplate} sortable />
                <Column 
                  field="createdAt" 
                  header="Created" 
                  body={(rowData) => formatDate(rowData.createdAt)}
                  sortable 
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
