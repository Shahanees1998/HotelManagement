"use client";

import { useState, useEffect, useCallback } from "react";
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

interface Subscription {
  id: string;
  hotelName: string;
  hotelSlug: string;
  ownerName: string;
  ownerEmail: string;
  subscriptionId: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  createdAt: string;
  lastPaymentAt?: string;
  nextPaymentAt?: string;
}

export default function AdminSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    plan: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminSubscriptions({
        status: filters.status,
        plan: filters.plan,
        search: filters.search,
        page: currentPage,
        limit: rowsPerPage,
      });
      setSubscriptions(response.data || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      showToast("error", "Error", "Failed to load subscriptions");
      setSubscriptions([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.plan, filters.search, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.plan, filters.search]);

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    try {
      // TODO: Implement status change API call
      setSubscriptions(prev => prev.map(sub => 
        sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
      ));
      showToast("success", "Success", "Subscription status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update subscription status");
    }
  };

  const handleManageSubscription = (subscription: Subscription) => {
    // Open subscription management modal or navigate to subscription details
    showToast("info", "Manage Subscription", `Managing subscription for ${subscription.hotelName}`);
    // TODO: Implement subscription management modal or navigation
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "TRIAL": return "warning";
      case "CANCELLED": return "danger";
      case "EXPIRED": return "danger";
      case "PAST_DUE": return "warning";
      default: return "info";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const hotelBodyTemplate = (rowData: Subscription) => {
    return (
      <div>
        <div className="font-semibold">{rowData.hotelName}</div>
        <div className="text-sm text-600">/{rowData.hotelSlug}</div>
      </div>
    );
  };

  const ownerBodyTemplate = (rowData: Subscription) => {
    return (
      <div>
        <div className="font-semibold">{rowData.ownerName}</div>
        <div className="text-sm text-600">{rowData.ownerEmail}</div>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Subscription) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.status} 
          severity={getStatusSeverity(rowData.status) as any} 
        />
        <Button
          icon="pi pi-cog"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleManageSubscription(rowData)}
          tooltip="Manage Subscription"
        />
      </div>
    );
  };

  const amountBodyTemplate = (rowData: Subscription) => {
    return (
      <div className="text-right">
        <div className="font-semibold">{formatCurrency(rowData.amount, rowData.currency)}</div>
        <div className="text-sm text-600">/{rowData.planName}</div>
      </div>
    );
  };

  const nextPaymentBodyTemplate = (rowData: Subscription) => {
    if (rowData.status === "TRIAL" && rowData.trialEndsAt) {
      return (
        <div>
          <div className="text-orange-500 font-semibold">Trial ends</div>
          <div className="text-sm">{formatDate(rowData.trialEndsAt)}</div>
        </div>
      );
    }
    if (rowData.nextPaymentAt) {
      return (
        <div>
          <div className="text-green-500 font-semibold">Next payment</div>
          <div className="text-sm">{formatDate(rowData.nextPaymentAt)}</div>
        </div>
      );
    }
    return <span className="text-600">-</span>;
  };

  // Server-side filtering - no client-side filtering needed

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Past Due", value: "PAST_DUE" },
  ];

  const planOptions = [
    { label: "All Plans", value: "" },
    { label: "Starter Plan", value: "Starter Plan" },
    { label: "Professional Plan", value: "Professional Plan" },
    { label: "Enterprise Plan", value: "Enterprise Plan" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Subscriptions</h1>
            <p className="text-600 mt-2 mb-0">Manage all hotel subscriptions and billing.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadSubscriptions}
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
                placeholder="Search by hotel or owner..."
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
              <label className="block text-900 font-medium mb-2">Plan</label>
              <Dropdown
                value={filters.plan}
                options={planOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, plan: e.value }))}
                placeholder="All Plans"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading subscriptions...</p>
              </div>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-credit-card text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Subscriptions Found</h3>
              <p className="text-600 mb-4">
                {subscriptions.length === 0 
                  ? "No subscriptions have been created yet." 
                  : "No subscriptions match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={subscriptions}
              >
                <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable />
                <Column field="owner" header="Owner" body={ownerBodyTemplate} />
                <Column field="subscriptionId" header="Subscription ID" />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                <Column field="amount" header="Amount" body={amountBodyTemplate} sortable />
                <Column field="nextPayment" header="Next Payment" body={nextPaymentBodyTemplate} />
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
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
