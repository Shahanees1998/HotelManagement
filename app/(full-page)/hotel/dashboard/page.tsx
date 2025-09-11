"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  responseRate: number;
  recentReviews: number;
}

interface RecentReview {
  id: string;
  guestName: string;
  overallRating: number;
  submittedAt: string;
  status: string;
}

export default function HotelDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    responseRate: 0,
    recentReviews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setStats(data.data.stats);
        setRecentReviews(data.data.recentReviews);
        setChartData(data.data.chartData);
      } else {
        throw new Error(data.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showToast("error", "Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const defaultChartData = {
    labels: ['No Data'],
    datasets: [
      {
        label: 'Reviews',
        data: [0],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Average Rating',
        data: [0],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "PENDING": return "warning";
      case "REJECTED": return "danger";
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

  const ratingBodyTemplate = (rowData: RecentReview) => {
    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.overallRating}</span>
        <i className="pi pi-star-fill text-yellow-500"></i>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: RecentReview) => {
    return (
      <Tag 
        value={rowData.status} 
        severity={getStatusSeverity(rowData.status) as any} 
      />
    );
  };

  const statsCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: "pi pi-comments",
      color: "text-blue-500",
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      icon: "pi pi-star",
      color: "text-yellow-500",
    },
    {
      title: "Positive Reviews",
      value: stats.positiveReviews,
      icon: "pi pi-thumbs-up",
      color: "text-green-500",
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      icon: "pi pi-percentage",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Hotel Dashboard</h1>
            <p className="text-600 mt-2 mb-0">Welcome back! Here's your feedback overview.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadDashboardData}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-3xl font-bold text-gray-300 animate-pulse">--</div>
                <div className="text-600 animate-pulse">Loading...</div>
              </Card>
            </div>
          ))}
        </>
      ) : (
        <>
          {statsCards.map((card, index) => (
            <div className="col-12 md:col-6 lg:col-3" key={index}>
              <Card className="text-center">
                <div className={`text-3xl font-bold ${card.color} mb-2`}>
                  <i className={`${card.icon} mr-2`}></i>
                  {card.value}
                </div>
                <div className="text-600">{card.title}</div>
              </Card>
            </div>
          ))}
        </>
      )}

      {/* Charts */}
      <div className="col-12 lg:col-8">
        <Card title="Review Trends" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : (
            <Chart type="line" data={chartData || defaultChartData} options={chartOptions} style={{ height: '300px' }} />
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="col-12 lg:col-4">
        <Card title="Quick Actions" className="mt-4">
          <div className="flex flex-column gap-3">
            <Button
              label="Create Feedback Form"
              icon="pi pi-plus"
              className="p-button-outlined"
            />
            <Button
              label="Generate QR Code"
              icon="pi pi-qrcode"
              className="p-button-outlined"
            />
            <Button
              label="View Analytics"
              icon="pi pi-chart-bar"
              className="p-button-outlined"
            />
            <Button
              label="Contact Admin"
              icon="pi pi-envelope"
              className="p-button-outlined"
            />
          </div>
        </Card>
      </div>

      {/* Recent Reviews */}
      <div className="col-12">
        <Card title="Recent Reviews" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-600">Loading recent reviews...</div>
            </div>
          ) : (
            <DataTable value={recentReviews} showGridlines>
              <Column field="guestName" header="Guest" />
              <Column field="overallRating" header="Rating" body={ratingBodyTemplate} />
              <Column field="status" header="Status" body={statusBodyTemplate} />
              <Column 
                field="submittedAt" 
                header="Date" 
                body={(rowData) => formatDate(rowData.submittedAt)}
              />
            </DataTable>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
