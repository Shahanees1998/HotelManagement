"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
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
  guestEmail: string;
  overallRating: number;
  submittedAt: string;
  status: string;
}

interface CustomRatingData {
  formTitle: string;
  labels: string[];
  chartData: {
    labels: string[];
    datasets: any[];
  };
  summary: Array<{
    label: string;
    averageRating: number;
    totalRatings: number;
  }>;
  totalReviews?: number;
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
  const [customRatingData, setCustomRatingData] = useState<CustomRatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const applyFilters = async () => {
    setApplyingFilters(true);
    await loadDashboardDataWithFilters(startDate, endDate);
    setApplyingFilters(false);
    showToast("success", "Success", "Filters applied successfully");
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    // Reload with empty filters
    loadDashboardDataWithFilters(null, null);
    showToast("info", "Info", "Filters cleared");
  };

  const exportData = async (format: 'csv' | 'pdf', type: 'main' | 'custom') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    try {
      // For custom ratings, use the existing export endpoint
      if (type === 'custom') {
        const response = await fetch(`/api/hotel/analytics/custom-ratings/export?${params.toString()}`);
        if (response.ok) {
          if (format === 'csv') {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `custom-ratings-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          } else {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
          showToast("success", "Success", `Data exported successfully as ${format.toUpperCase()}`);
          return;
        } else {
          showToast("error", "Error", "Failed to export data");
          return;
        }
      }
      
      // For main dashboard, export the chart data directly
      if (type === 'main') {
        let csvContent = 'Date,Total Reviews,Average Rating\n';
        let htmlContent = '';
        
        if (chartData && chartData.labels) {
          const dates = chartData.labels;
          const reviews = chartData.datasets[0]?.data || [];
          const ratings = chartData.datasets[1]?.data || [];
          
          // CSV Content
          for (let i = 0; i < dates.length; i++) {
            csvContent += `${dates[i]},${reviews[i] || 0},${ratings[i] || 0}\n`;
          }
          
          // HTML/PDF Content
          htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Dashboard Export</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1a2b48; margin-bottom: 10px; }
                h2 { color: #4a4a4a; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
                th { background-color: #2563eb; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .info { margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <h1>Hotel Dashboard Report</h1>
              <div class="info">
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                ${startDate || endDate ? `
                  <p><strong>Date Range:</strong> 
                    ${startDate ? startDate.toLocaleDateString() : 'No start'} - 
                    ${endDate ? endDate.toLocaleDateString() : 'No end'}
                  </p>
                ` : ''}
              </div>
              <h2>Review Trends</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Reviews</th>
                    <th>Average Rating</th>
                  </tr>
                </thead>
                <tbody>
          `;
          
          for (let i = 0; i < dates.length; i++) {
            htmlContent += `
              <tr>
                <td>${dates[i]}</td>
                <td>${reviews[i] || 0}</td>
                <td>${(ratings[i] || 0).toFixed(2)}</td>
              </tr>
            `;
          }
          
          htmlContent += `
                </tbody>
              </table>
              <div style="margin-top: 30px;">
                <h2>Summary Statistics</h2>
                <table>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                  </tr>
                  <tr>
                    <td>Total Reviews</td>
                    <td>${stats.totalReviews}</td>
                  </tr>
                  <tr>
                    <td>Average Rating</td>
                    <td>${stats.averageRating.toFixed(2)}/5</td>
                  </tr>
                  <tr>
                    <td>Positive Reviews</td>
                    <td>${stats.positiveReviews}</td>
                  </tr>
                  <tr>
                    <td>Negative Reviews</td>
                    <td>${stats.negativeReviews}</td>
                  </tr>
                  <tr>
                    <td>Response Rate</td>
                    <td>${stats.responseRate}%</td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
          `;
        }
        
        if (format === 'csv') {
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("success", "Success", "Data exported successfully as CSV");
        } else {
          // PDF export using print
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          showToast("success", "Success", "Opening PDF view. Use browser print to save as PDF.");
        }
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("error", "Error", "Failed to export data");
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const loadDashboardDataWithFilters = async (filterStartDate: Date | null, filterEndDate: Date | null) => {
    setLoading(true);
    try {
      // Build query params with date filters
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate.toISOString());
      if (filterEndDate) params.append('endDate', filterEndDate.toISOString());

      // Load main dashboard data
      const response = await fetch(`/api/hotel/dashboard?${params.toString()}`, {
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

      // Load custom rating data
      await loadCustomRatingDataWithFilters(filterStartDate, filterEndDate);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showToast("error", "Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    await loadDashboardDataWithFilters(startDate, endDate);
  };

  const loadCustomRatingDataWithFilters = async (filterStartDate: Date | null, filterEndDate: Date | null) => {
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate.toISOString());
      if (filterEndDate) params.append('endDate', filterEndDate.toISOString());
      
      const response = await fetch(`/api/hotel/analytics/custom-ratings?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setCustomRatingData(data.data);
        }
      }
    } catch (error) {
      console.error("Error loading custom rating data:", error);
      // Don't show error toast for this, as it's optional data
    }
  };

  const loadCustomRatingData = async () => {
    await loadCustomRatingDataWithFilters(startDate, endDate);
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

  const customRatingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
      },
      line: {
        tension: 0.4,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}/5`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 5.5,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const getColorForIndex = (index: number) => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ea580c'];
    return colors[index % colors.length];
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
      title: "Feedback Form",
      description: "Create custom feedback forms",
      icon: "pi pi-plus",
      route: "/hotel/forms",
      color: "blue",
      canAccess: true,
    },
    {
      title: "Generate QR Code",
      description: "Generate QR codes for feedback collection",
      icon: "pi pi-qrcode",
      route: "/hotel/qr-codes",
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
      title: "Negative Reviews",
      value: stats.negativeReviews,
      icon: "pi pi-thumbs-down",
      color: "text-red-500",
      image: "/images/rating.png"
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

      {/* Date Filters */}
      <div className="col-12">
        <Card className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Start Date</label>
              <Calendar
                value={startDate}
                onChange={(e) => setStartDate(e.value as Date | null)}
                placeholder="Select start date"
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                maxDate={endDate || new Date()}
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">End Date</label>
              <Calendar
                value={endDate}
                onChange={(e) => setEndDate(e.value as Date | null)}
                placeholder="Select end date"
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                minDate={startDate || undefined}
                maxDate={new Date()}
              />
            </div>
            <div className="col-12 md:col-3 flex align-items-end">
              <Button
                label="Search"
                icon="pi pi-search"
                onClick={applyFilters}
                loading={applyingFilters}
                className="w-full"
                disabled={applyingFilters}
              />
            </div>
            <div className="col-12 md:col-3 flex align-items-end">
              <Button
                label="Clear Filters"
                icon="pi pi-filter-slash"
                onClick={clearFilters}
                className="w-full p-button-outlined p-button-secondary"
                disabled={applyingFilters}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="col-12">
        <div className="flex flex-wrap gap-3">
          {loading ? (
            <>
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex-1 min-w-0" style={{ minWidth: '200px' }}>
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
                <div className="flex-1 min-w-0" key={index} style={{ minWidth: '200px' }}>
                  <div
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
                    <div className="flex align-items-center" style={{ gap: '1.5rem', padding: '0.5rem' }}>
                        <img src={card.image} alt={card.title} className={`flex align-items-center justify-content-center bg-${card.color} border-round-lg flex-shrink-0`} style={{ width: '60px', height: '60px' }} />
                        <div className="flex-1">
                            <div className="text-900 font-bold mb-2" style={{ fontSize: '1.2rem', lineHeight: '1.2', color: '#333333' }}>{card.value}</div>
                            <div className="text-500" style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666666' }}>{card.title}</div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

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
          <div className="flex justify-content-end gap-2 mt-3 pt-3 border-top-1 surface-border">
            <Button
              label="Export CSV"
              icon="pi pi-file"
              onClick={() => exportData('csv', 'main')}
              className="p-button-outlined p-button-sm"
              disabled={loading}
            />
            <Button
              label="Export PDF"
              icon="pi pi-file-pdf"
              onClick={() => exportData('pdf', 'main')}
              className="p-button-outlined p-button-sm"
              disabled={loading}
            />
          </div>
        </Card>
      </div>

      {/* Custom Rating Analytics */}
      {customRatingData && (
        <>
          <div className="col-12">
            <Card title={`Custom Rating Trends - ${customRatingData.formTitle}`}>
              {loading ? (
                <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
                  <div className="text-600">Loading custom rating data...</div>
                </div>
              ) : (
                <>
                  <Chart 
                    type="line" 
                    data={customRatingData.chartData} 
                    options={customRatingChartOptions} 
                    style={{ height: '350px' }} 
                  />
                </>
              )}
              <div className="flex justify-content-end gap-2 mt-3 pt-3 border-top-1 surface-border">
                <Button
                  label="Export CSV"
                  icon="pi pi-file"
                  onClick={() => exportData('csv', 'custom')}
                  className="p-button-outlined p-button-sm"
                  disabled={loading}
                />
                <Button
                  label="Export PDF"
                  icon="pi pi-file-pdf"
                  onClick={() => exportData('pdf', 'custom')}
                  className="p-button-outlined p-button-sm"
                  disabled={loading}
                />
              </div>
            </Card>
          </div>

          <div className="col-12">
            <Card title="Custom Rating Summary">
              <div className="grid">
                {customRatingData.summary.map((item, index) => (
                  <div key={item.label} className="col-12 md:col-6 lg:col-4">
                    <div className="border-1 surface-border border-round p-3">
                      <div className="flex align-items-center justify-content-between mb-2">
                        <span className="text-900 font-medium">{item.label}</span>
                        <span className="text-500 text-sm">({item.totalRatings} ratings)</span>
                      </div>
                      <div className="flex align-items-center gap-2">
                        <div 
                          className="flex align-items-center" 
                          style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px',
                            backgroundColor: getColorForIndex(index),
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-2xl font-bold text-900">
                            {item.averageRating.toFixed(2)}/5
                          </div>
                          <div className="text-sm text-600">
                            Average Rating
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

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
            <div key={index} className="col-12 md:col-6 lg:col-3 p-2">
              <div
                className={`cursor-pointer hover-lift interactive-card border-round-lg animate-fade-in`}
                onClick={() => router.push(action.route)}
                role="button"
                tabIndex={0}
                onKeyPress={e => { if (e.key === "Enter") router.push(action.route); }}
                style={{
                  border: '1px solid #e0d8cc',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  backgroundColor: '#FFFFFF',
                  padding: '1rem',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="flex align-items-center" style={{ gap: '1rem' }}>
                  <div
                    className="flex align-items-center justify-content-center border-round-lg flex-shrink-0 stats-icon"
                    style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: action.color === 'blue' ? '#dbeafe' : 
                                   action.color === 'green' ? '#dcfce7' :
                                   action.color === 'orange' ? '#fed7aa' :
                                   action.color === 'red' ? '#fee2e2' : '#f3f4f6',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i
                      className={`${action.icon}`}
                      style={{
                        fontSize: '1.75rem',
                        color: action.color === 'blue' ? '#3b82f6' : 
                               action.color === 'green' ? '#10b981' :
                               action.color === 'orange' ? '#f59e0b' :
                               action.color === 'red' ? '#ef4444' : '#6b7280',
                        transition: 'all 0.3s ease'
                      }}
                    ></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold m-0 mb-1" style={{ lineHeight: '1.2', color: '#333333' }}>
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 m-0" style={{ lineHeight: '1.4' }}>
                      {action.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="pi pi-arrow-right text-gray-400" style={{ fontSize: '0.875rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="col-12">
        <div title="Recent Reviews" className="mt-4">
        <div className="mb-4">
          <h2 className="text-3xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>Recent Reviews</h2>
          <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
            View and manage your recent reviews.
          </p>
        </div>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-600">Loading recent reviews...</div>
            </div>
          ) : (
            <DataTable value={recentReviews}>
              <Column field="guestName" header="Guest" />
              <Column field="guestEmail" header="Email" />
              <Column field="overallRating" header="Rating" body={ratingBodyTemplate} />
              <Column field="status" header="Status" body={statusBodyTemplate} />
              <Column 
                field="submittedAt" 
                header="Date" 
                body={(rowData) => formatDate(rowData.submittedAt)}
              />
            </DataTable>
          )}
        </div>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
