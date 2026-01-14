"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/TranslationProvider";

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
    previousAverage?: number;
    change?: number;
    changePercent?: number;
  }>;
  totalReviews?: number;
}

export default function CustomRatingAnalytics() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<CustomRatingData | null>(null);
  // Default to last 3 months (weekly view)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    return { start, end };
  };
  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState<Date | null>(defaultRange.start);
  const [endDate, setEndDate] = useState<Date | null>(defaultRange.end);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadCustomRatingData();
  }, [startDate, endDate, viewMode]);

  const loadCustomRatingData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());
      params.append('viewMode', viewMode); // Pass view mode to API

      const response = await fetch(`/api/hotel/analytics/custom-ratings?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setRatingData(data.data);
      } else {
        const errorData = await response.json();
        console.error("Custom rating analytics API error:", errorData);
        showToast("error", t("common.error"), errorData.error || t("hotel.analytics.customRatings.toasts.loadError"));
      }
    } catch (error) {
      console.error("Error loading custom rating analytics:", error);
      showToast("error", t("common.error"), t("hotel.analytics.customRatings.toasts.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      datalabels: {
        display: false, // Remove numbers under bars and charts
      },
      tooltip: {
        enabled: true, // Keep tooltips on hover
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 0}${t("hotel.analytics.customRatings.chart.tooltipSuffix")}`;
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
          display: true, // Keep axis labels
        },
      },
    },
  }), [t, locale]);

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
        showToast("success", t("common.success"), t("hotel.analytics.customRatings.toasts.exportSuccess").replace("{format}", format.toUpperCase()));
      } else {
        showToast("error", t("common.error"), t("hotel.analytics.customRatings.toasts.exportError"));
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("error", t("common.error"), t("hotel.analytics.customRatings.toasts.exportError"));
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
            <h1 className="text-3xl font-bold m-0">{t("hotel.analytics.customRatings.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.analytics.customRatings.description")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.analytics.customRatings.buttons.exportCsv")}
              icon="pi pi-file"
              onClick={() => handleExport('csv')}
              disabled={!ratingData}
              className="p-button-outlined"
            />
            <Button
              label={t("hotel.analytics.customRatings.buttons.exportPdf")}
              icon="pi pi-file-pdf"
              onClick={() => handleExport('pdf')}
              disabled={!ratingData}
              className="p-button-outlined"
            />
            <Button
              label={t("hotel.analytics.customRatings.buttons.refresh")}
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
          <h3 className="m-0 mb-3">{t("hotel.analytics.customRatings.filters.title")}</h3>
          <div className="grid">
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("View Mode")}</label>
              <Dropdown
                value={viewMode}
                options={[
                  { label: t("Daily"), value: "daily" },
                  { label: t("Weekly"), value: "weekly" },
                  { label: t("Monthly"), value: "monthly" },
                ]}
                onChange={(e) => {
                  setViewMode(e.value);
                  const end = new Date();
                  const start = new Date();
                  // Limit date ranges based on view mode
                  if (e.value === 'daily') {
                    start.setMonth(start.getMonth() - 1); // Last month only
                  } else if (e.value === 'weekly') {
                    start.setMonth(start.getMonth() - 3); // Last 3 months
                  } else if (e.value === 'monthly') {
                    start.setFullYear(start.getFullYear() - 2); // Last 2 years
                  }
                  setStartDate(start);
                  setEndDate(end);
                }}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.analytics.customRatings.filters.startDate")}</label>
              <Calendar
                value={startDate}
                onChange={(e) => {
                  const newStart = e.value as Date | null;
                  if (newStart) {
                    // Enforce date range limits based on view mode
                    const end = endDate || new Date();
                    const maxRange = viewMode === 'daily' ? 1 : viewMode === 'weekly' ? 3 : 24; // months
                    const minStart = new Date(end);
                    minStart.setMonth(minStart.getMonth() - maxRange);
                    if (newStart < minStart) {
                      setStartDate(minStart);
                    } else {
                      setStartDate(newStart);
                    }
                  } else {
                    setStartDate(newStart);
                  }
                }}
                placeholder={t("hotel.analytics.customRatings.filters.startDatePlaceholder")}
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                maxDate={endDate || new Date()}
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.analytics.customRatings.filters.endDate")}</label>
              <Calendar
                value={endDate}
                onChange={(e) => {
                  const newEnd = e.value as Date | null;
                  if (newEnd && startDate) {
                    // Enforce date range limits
                    const maxRange = viewMode === 'daily' ? 1 : viewMode === 'weekly' ? 3 : 24; // months
                    const maxStart = new Date(newEnd);
                    maxStart.setMonth(maxStart.getMonth() - maxRange);
                    if (startDate < maxStart) {
                      setStartDate(maxStart);
                    }
                  }
                  setEndDate(newEnd);
                }}
                placeholder={t("hotel.analytics.customRatings.filters.endDatePlaceholder")}
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                minDate={startDate || undefined}
                maxDate={new Date()}
              />
            </div>
            <div className="col-12 md:col-3 flex align-items-end">
              <Button
                label={t("hotel.analytics.customRatings.filters.clear")}
                icon="pi pi-filter-slash"
                onClick={() => {
                  const defaultRange = getDefaultDateRange();
                  setStartDate(defaultRange.start);
                  setEndDate(defaultRange.end);
                  setViewMode('weekly');
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
                <p className="text-600">{t("hotel.analytics.customRatings.states.loading")}</p>
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
                <h3 className="text-900 mb-2">{t("hotel.analytics.customRatings.states.noDataTitle")}</h3>
                <p className="text-600">
                  {t("hotel.analytics.customRatings.states.noDataDescription")}
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
            <Card title={`${t("hotel.analytics.customRatings.chart.trendPrefix")}${ratingData.formTitle}`}>
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
            <Card title={t("hotel.analytics.customRatings.chart.summaryTitle")}>
              <div className="grid">
                {ratingData.summary.map((item, index) => {
                  // Color coding: 1,2 - red, 3 - orange, 4,5 - green
                  const getRatingColor = (rating: number) => {
                    if (rating <= 2) return '#dc2626'; // red
                    if (rating <= 3) return '#ea580c'; // orange
                    return '#16a34a'; // green
                  };

                  const ratingColor = getRatingColor(item.averageRating);
                  const hasChange = item.change !== undefined && item.previousAverage !== undefined && item.previousAverage > 0;
                  const isPositiveChange = hasChange && item.change! > 0;
                  const changePercent = item.changePercent || 0;

                  return (
                    <div key={item.label} className="col-12 md:col-6 lg:col-4">
                      <div className="border-1 surface-border border-round p-3">
                        <div className="flex align-items-center justify-content-between mb-2">
                          <span className="text-900 font-medium">{item.label}</span>
                          <span className="text-500 text-sm">
                            {t("hotel.analytics.customRatings.chart.ratingsCount")
                              .replace("{count}", item.totalRatings.toString())}
                          </span>
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
                            <div className="flex align-items-center gap-2">
                              <div 
                                className="text-2xl font-bold"
                                style={{ color: ratingColor }}
                              >
                                {item.averageRating.toFixed(2)}/5
                              </div>
                              {hasChange && (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '4px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    fontWeight: '600',
                                    backgroundColor: isPositiveChange 
                                      ? 'rgba(16, 185, 129, 0.1)' 
                                      : 'rgba(239, 68, 68, 0.1)',
                                    color: isPositiveChange ? '#16a34a' : '#dc2626',
                                    border: `1px solid ${isPositiveChange ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                  }}
                                >
                                  <i
                                    className={isPositiveChange ? 'pi pi-arrow-up' : 'pi pi-arrow-down'}
                                    style={{ fontSize: '0.65rem' }}
                                  />
                                  <span>{Math.abs(changePercent).toFixed(1)}%</span>
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-600">
                              {t("hotel.analytics.customRatings.chart.averageRating")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}

      <Toast ref={toast} />
    </div>
  );
}

