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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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

  const quickActions = [
    {
      title: "Create Feedback Form",
      description: "Create custom feedback forms for guests",
      icon: "pi pi-plus",
      route: "/hotel/forms",
      color: "blue",
      canAccess: true,
    },
    {
      title: "Generate QR Code",
      description: "Generate QR codes for feedback collection",
      icon: "pi pi-qrcode",
      route: "/hotel/qr",
      color: "green",
      canAccess: true,
    },
    {
      title: "Manage Profile",
      description: "Update hotel profile and settings",
      icon: "pi pi-user",
      route: "/hotel/profile",
      color: "orange",
      canAccess: true,
    },
    {
      title: "Contact Admin",
      description: "Get support from system administrators",
      icon: "pi pi-envelope",
      route: "/hotel/support",
      color: "red",
      canAccess: true,
    },
  ];

  const statsCards = [
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      icon: "pi pi-comments",
      color: "text-blue-500",
      image: "/images/feedback.png"
    },
    {
      title: "Average Rating",
      value: stats.averageRating.toFixed(1),
      icon: "pi pi-star",
      color: "text-yellow-500",
      image: "/images/rating.png"
    },
    {
      title: "Positive Reviews",
      value: stats.positiveReviews,
      icon: "pi pi-thumbs-up",
      color: "text-green-500",
      image: "/images/positive-rating.png"
    },
    {
      title: "Response Rate",
      value: `${stats.responseRate}%`,
      icon: "pi pi-percentage",
      color: "text-purple-500",
      image: "/images/response.png"
    },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Welcome Back!</h1>
            <p className="text-600 mt-2 mb-0">Create feedback forms, keep track of guest ratings, and monitor overall <br /> satisfaction. Enhance every stay with better insights!</p>
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
              <Card
                className="cursor-pointer hover:shadow-2 transition-all border-round-lg"
                role="button"
                tabIndex={0}
                onKeyPress={e => { if (e.key === "Enter") { /* Add handler here */ } }}
                style={{
                    border: 'none',
                    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
                    backgroundColor: '#FFFFFF',
                    padding: '0 !important'
                }}
              >
                <div className="flex align-items-center" style={{ gap: '1.5rem', padding: 0 }}>
                    <img src={card.image} alt={card.title} className={`flex align-items-center justify-content-center bg-${card.color} border-round-lg flex-shrink-0`} style={{ width: '60px', height: '60px' }} />
                    <div className="flex-1">
                        <div className="text-900 font-bold mb-2" style={{ fontSize: '1.2rem', lineHeight: '1.2', color: '#333333' }}>{card.value}</div>
                        <div className="text-500" style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666666' }}>{card.title}</div>
                    </div>
                </div>
              </Card>
            </div>
          ))}
        </>
      )}

      {/* Charts */}
      <div className="col-12">
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
      <div className="col-12 mt-4" style={{ backgroundColor: '#fcfaf7', borderRadius: '12px', marginTop: '2rem' }}>
        <div className="mb-4">
          <h2 className="text-3xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>Quick Actions</h2>
          <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
            Respond faster to guest concerns, follow up on feedback, and resolve issues in just a few clicks.
          </p>
        </div>
        <div className="grid">
          {quickActions.map((action, index) => (
            <div key={index} className="col-12 md:col-6 lg:col-3">
              <Card
                className="cursor-pointer hover:shadow-lg transition-all border-round-lg"
                onClick={() => router.push(action.route)}
                role="button"
                tabIndex={0}
                onKeyPress={e => { if (e.key === "Enter") router.push(action.route); }}
                style={{
                  border: '1px solid #e0d8cc',
                  boxShadow: 'none',
                  backgroundColor: '#FFFFFF',
                  padding: '0 !important'
                }}
              >
                <div className="flex align-items-center" style={{ gap: '1rem', padding: '0rem' }}>
                  <div
                    className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f5f0e8'
                    }}
                  >
                    <i
                      className={`${action.icon}`}
                      style={{
                        fontSize: '1.5rem',
                        color: '#8b5e3c'
                      }}
                    ></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold m-0" style={{  lineHeight: '1.2', color: '#333333' }}>{action.title}</h3>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="col-12">
        <Card title="Recent Reviews" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-600">Loading recent reviews...</div>
            </div>
          ) : (
            <DataTable value={recentReviews}>
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
