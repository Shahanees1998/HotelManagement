"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";

interface HotelRegistration {
  id: string;
  hotelName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  city: string;
  country: string;
  status: string;
  subscriptionStatus: string;
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export default function HotelRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<HotelRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    subscription: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadRegistrations();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.subscription, filters.search]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelRegistrations();
      setRegistrations((response as any).data || []);
    } catch (error) {
      console.error("Error loading registrations:", error);
      showToast("error", "Error", "Failed to load hotel registrations");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleApprove = async (registrationId: string) => {
    try {
      // TODO: Implement approval API call
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: "APPROVED", approvedAt: new Date().toISOString() }
          : reg
      ));
      showToast("success", "Success", "Hotel registration approved");
    } catch (error) {
      showToast("error", "Error", "Failed to approve registration");
    }
  };

  const handleReject = async (registrationId: string, reason: string) => {
    try {
      // TODO: Implement rejection API call
      setRegistrations(prev => prev.map(reg => 
        reg.id === registrationId 
          ? { ...reg, status: "REJECTED", rejectedAt: new Date().toISOString(), rejectionReason: reason }
          : reg
      ));
      showToast("success", "Success", "Hotel registration rejected");
    } catch (error) {
      showToast("error", "Error", "Failed to reject registration");
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "PENDING": return "warning";
      case "REJECTED": return "danger";
      default: return "info";
    }
  };

  const getSubscriptionSeverity = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "TRIAL": return "warning";
      case "CANCELLED": return "danger";
      default: return "info";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hotelBodyTemplate = (rowData: HotelRegistration) => {
    return (
      <div>
        <div className="font-semibold">{rowData.hotelName}</div>
        <div className="text-sm text-600">/{rowData.slug}</div>
        <div className="text-sm text-500">{rowData.city}, {rowData.country}</div>
      </div>
    );
  };

  const ownerBodyTemplate = (rowData: HotelRegistration) => {
    return (
      <div>
        <div className="font-semibold">{rowData.ownerName}</div>
        <div className="text-sm text-600">{rowData.ownerEmail}</div>
        <div className="text-sm text-500">{rowData.phone}</div>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: HotelRegistration) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.status} 
          severity={getStatusSeverity(rowData.status) as any} 
        />
        {rowData.rejectionReason && (
          <div className="text-xs text-red-500">{rowData.rejectionReason}</div>
        )}
      </div>
    );
  };

  const subscriptionBodyTemplate = (rowData: HotelRegistration) => {
    return (
      <Tag 
        value={rowData.subscriptionStatus} 
        severity={getSubscriptionSeverity(rowData.subscriptionStatus) as any} 
      />
    );
  };

  const actionsBodyTemplate = (rowData: HotelRegistration) => {
    if (rowData.status === "PENDING") {
      return (
        <div className="flex gap-2">
          <Button
            label="Approve"
            icon="pi pi-check"
            size="small"
            className="p-button-success p-button-sm"
            onClick={() => handleApprove(rowData.id)}
          />
          <Button
            label="Reject"
            icon="pi pi-times"
            size="small"
            className="p-button-danger p-button-sm"
            onClick={() => {
              const reason = prompt("Rejection reason:");
              if (reason) handleReject(rowData.id, reason);
            }}
          />
        </div>
      );
    }
    return (
      <div className="text-600 text-sm">
        {rowData.status === "APPROVED" && rowData.approvedAt && `Approved ${formatDate(rowData.approvedAt)}`}
        {rowData.status === "REJECTED" && rowData.rejectedAt && `Rejected ${formatDate(rowData.rejectedAt)}`}
      </div>
    );
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (filters.status && reg.status !== filters.status) return false;
    if (filters.subscription && reg.subscriptionStatus !== filters.subscription) return false;
    if (filters.search && !reg.hotelName.toLowerCase().includes(filters.search.toLowerCase()) && 
        !reg.ownerName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Paginate the filtered registrations
  const paginatedRegistrations = filteredRegistrations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
  ];

  const subscriptionOptions = [
    { label: "All Subscriptions", value: "" },
    { label: "Trial", value: "TRIAL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Hotel Registrations</h1>
            <p className="text-600 mt-2 mb-0">Manage hotel registration requests and approvals.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadRegistrations}
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
              <label className="block text-900 font-medium mb-2">Search</label>
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

      {/* Registrations Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading registrations...</p>
              </div>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-building text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Registrations Found</h3>
              <p className="text-600 mb-4">
                {registrations.length === 0 
                  ? "No hotel registrations have been submitted yet." 
                  : "No registrations match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={paginatedRegistrations}
              >
                <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable />
                <Column field="owner" header="Owner" body={ownerBodyTemplate} />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="subscription" header="Subscription" body={subscriptionBodyTemplate} sortable />
                <Column 
                  field="createdAt" 
                  header="Submitted" 
                  body={(rowData) => formatDate(rowData.createdAt)}
                  sortable 
                />
                <Column header="Actions" body={actionsBodyTemplate} />
              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={filteredRegistrations.length}
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
