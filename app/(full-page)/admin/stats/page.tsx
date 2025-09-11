"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { canAccessSection } from "@/lib/rolePermissions";

interface StatsData {
  totalHotels: number;
  totalSubscribedHotels: number;
  totalReviews: number;
  totalEarnings: number;
  pendingApprovals: number;
  supportRequests: number;
  chartData: any;
  ratingDistribution: any;
}

export default function AdminStats() {
  const toast = useRef<Toast>(null);
  const { user, loading: authLoading } = useAuth();
  const [statsData, setStatsData] = useState<StatsData>({
    totalHotels: 0,
    totalSubscribedHotels: 0,
    totalReviews: 0,
    totalEarnings: 0,
    pendingApprovals: 0,
    supportRequests: 0,
    chartData: {},
    ratingDistribution: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && canAccessSection(user.role, 'canAccessAll')) {
      loadStatsData();
    }
  }, [user]);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminAnalytics();
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setStatsData(response.data);
      }
    } catch (error) {
      console.error("Error loading stats data:", error);
      showToast("error", "Error", "Failed to load stats data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (authLoading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !canAccessSection(user.role, 'canAccessAll')) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
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
            <h1 className="text-3xl font-bold m-0">System Statistics</h1>
            <p className="text-600 mt-2 mb-0">Detailed analytics and performance metrics for the platform.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-500 mb-2">{statsData.totalHotels || 0}</div>
          <div className="text-600">Total Hotels</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-500 mb-2">{statsData.totalSubscribedHotels || 0}</div>
          <div className="text-600">Active Subscriptions</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-500 mb-2">{statsData.totalReviews || 0}</div>
          <div className="text-600">Total Reviews</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-500 mb-2">${(statsData.totalEarnings || 0).toLocaleString()}</div>
          <div className="text-600">Total Revenue</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="col-12 lg:col-8">
        <Card title="System Growth" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : (
            <Chart type="line" data={statsData.chartData} options={chartOptions} style={{ height: '400px' }} />
          )}
        </Card>
      </div>

      <div className="col-12 lg:col-4">
        <Card title="Rating Distribution" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : (
            <Chart type="doughnut" data={statsData.ratingDistribution} options={chartOptions} style={{ height: '400px' }} />
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
