"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface CustomRatingItem {
  id: string;
  label: string;
  order: number;
  isActive: boolean;
}

interface CustomRatingData {
  formId: string;
  formTitle: string;
  labels: CustomRatingItem[];
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  summary: Array<{
    label: string;
    averageRating: number;
    totalRatings: number;
  }>;
  totalReviews?: number;
}

export default function CustomRatingAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<CustomRatingData | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadCustomRatingData();
  }, [startDate, endDate]);

  const loadCustomRatingData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/hotel/analytics/custom-ratings?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setRatingData(data.data);
      } else {
        const errorData = await response.json();
        console.error("Custom rating analytics API error:", errorData);
        showToast("error", "Error", errorData.error || "Failed to load custom rating analytics");
      }
    } catch (error) {
      console.error("Error loading custom rating analytics:", error);
      showToast("error", "Error", "Failed to load custom rating analytics");
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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 0}/5`;
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

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!ratingData) return;

    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());

    try {
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
      } else {
        showToast("error", "Error", "Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("error", "Error", "Failed to export data");
    }
  };

  const getColorForIndex = (index: number) => {
    const colors = [
      '#2563eb', // blue
      '#dc2626', // red
      '#16a34a', // green
      '#ca8a04', // yellow
      '#9333ea', // purple
      '#ea580c', // orange
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Custom Rating Analytics</h1>
            <p className="text-600 mt-2 mb-0">Track detailed rating trends for your "Good" layout form.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Export CSV"
              icon="pi pi-file"
              onClick={() => handleExport('csv')}
              disabled={!ratingData}
              className="p-button-outlined"
            />
            <Button
              label="Export PDF"
              icon="pi pi-file-pdf"
              onClick={() => handleExport('pdf')}
              disabled={!ratingData}
              className="p-button-outlined"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadCustomRatingData}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <Card className="mb-4">
          <h3 className="m-0 mb-3">Date Range Filters</h3>
          <div className="grid">
            <div className="col-12 md:col-4">
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
            <div className="col-12 md:col-4">
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
            <div className="col-12 md:col-4 flex align-items-end">
              <Button
                label="Clear Filters"
                icon="pi pi-filter-slash"
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="p-button-outlined p-button-secondary w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="col-12">
          <Card>
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-4xl text-primary mb-3"></i>
                <p className="text-600">Loading analytics data...</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* No Data State */}
      {!loading && !ratingData && (
        <div className="col-12">
          <Card>
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-center">
                <i className="pi pi-chart-line text-4xl text-400 mb-3"></i>
                <h3 className="text-900 mb-2">No Data Available</h3>
                <p className="text-600">
                  No "Good" layout forms with custom rating data found for your hotel.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Chart */}
      {!loading && ratingData && (
        <>
          <div className="col-12">
            <Card title={`Trend Analysis - ${ratingData.formTitle}`}>
              <Chart 
                type="line" 
                data={ratingData.chartData} 
                options={chartOptions} 
                style={{ height: '400px' }} 
              />
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="col-12">
            <Card title="Rating Summary">
              <div className="grid">
                {ratingData.summary.map((item, index) => (
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
                        >
                        </div>
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

      <Toast ref={toast} />
    </div>
  );
}

