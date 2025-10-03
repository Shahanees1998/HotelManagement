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

interface HotelPerformance {
  id: string;
  name: string;
  slug: string;
  owner: string;
  subscription: string;
  totalReviews: number;
  averageRating: number;
  responseRate: number;
  monthlyRevenue: number;
  growthRate: number;
  lastActivity: string;
  status: string;
}

export default function HotelPerformanceAnalytics() {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<HotelPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    subscription: "",
    status: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadHotelPerformance();
  }, []);

  const loadHotelPerformance = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelPerformanceAnalytics();
      setHotels((response as any).data || []);
    } catch (error) {
      console.error("Error loading hotel performance:", error);
      showToast("error", "Error", "Failed to load hotel performance data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "ACTIVE": return "success";
      case "TRIAL": return "warning";
      case "INACTIVE": return "danger";
      default: return "info";
    }
  };

  const getGrowthColor = (growthRate: number) => {
    if (growthRate >= 10) return "text-green-500";
    if (growthRate >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const hotelBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <div>
        <div className="font-semibold">{rowData.name}</div>
        <div className="text-sm text-600">/{rowData.slug}</div>
        <div className="text-sm text-500">{rowData.owner}</div>
      </div>
    );
  };

  const ratingBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{rowData.averageRating.toFixed(1)}</span>
        <i className="pi pi-star-fill text-yellow-500"></i>
        <span className="text-sm text-600">({rowData.totalReviews})</span>
      </div>
    );
  };

  const revenueBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <div className="text-right">
        <div className="font-semibold text-green-500">{formatCurrency(rowData.monthlyRevenue)}</div>
        <div className="text-sm text-600">monthly</div>
      </div>
    );
  };

  const growthBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <div className="text-right">
        <div className={`font-semibold ${getGrowthColor(rowData.growthRate)}`}>
          +{rowData.growthRate.toFixed(1)}%
        </div>
        <div className="text-sm text-600">growth</div>
      </div>
    );
  };

  const responseRateBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <div className="text-right">
        <div className="font-semibold">{rowData.responseRate.toFixed(1)}%</div>
        <div className="text-sm text-600">response rate</div>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: HotelPerformance) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={getStatusSeverity(rowData.status) as any} 
      />
    );
  };

  const filteredHotels = hotels.filter(hotel => {
    if (filters.subscription && hotel.subscription !== filters.subscription) return false;
    if (filters.status && hotel.status !== filters.status) return false;
    if (filters.search && !hotel.name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !hotel.owner.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const subscriptionOptions = [
    { label: "All Subscriptions", value: "" },
    { label: "Starter Plan", value: "Starter Plan" },
    { label: "Professional Plan", value: "Professional Plan" },
    { label: "Enterprise Plan", value: "Enterprise Plan" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Trial", value: "TRIAL" },
    { label: "Inactive", value: "INACTIVE" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Hotel Performance Analytics</h1>
            <p className="text-600 mt-2 mb-0">Detailed performance metrics for all hotels.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadHotelPerformance}
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
              <label className="block text-900 font-medium mb-2">Subscription</label>
              <Dropdown
                value={filters.subscription}
                options={subscriptionOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, subscription: e.value }))}
                placeholder="All Subscriptions"
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

      {/* Performance Table */}
      <div className="col-12">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading performance data...</p>
              </div>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-chart-bar text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Performance Data Found</h3>
              <p className="text-600 mb-4">
                {hotels.length === 0 
                  ? "No hotel performance data available." 
                  : "No hotels match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={filteredHotels}
              >
              <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable />
              <Column field="subscription" header="Plan" sortable />
              <Column field="rating" header="Rating" body={ratingBodyTemplate} sortable />
              <Column field="responseRate" header="Response Rate" body={responseRateBodyTemplate} sortable />
              <Column field="revenue" header="Monthly Revenue" body={revenueBodyTemplate} sortable />
              <Column field="growth" header="Growth Rate" body={growthBodyTemplate} sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} sortable />
              <Column 
                field="lastActivity" 
                header="Last Activity" 
                body={(rowData) => formatDate(rowData.lastActivity)}
                sortable 
              />              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={hotels.length}
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
