"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Calendar } from "primereact/calendar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/TranslationProvider";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  positiveReviews: number;
  negativeReviews: number;
  responseRate: number;
  recentReviews: number;
}

interface PreviousStats {
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
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<DashboardStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    responseRate: 0,
    recentReviews: 0,
  });
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [chartDataRaw, setChartDataRaw] = useState<any>(null);
  const [customRatingData, setCustomRatingData] = useState<CustomRatingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState<PreviousStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    responseRate: 0,
    recentReviews: 0,
  });
  const [currentPeriodStats, setCurrentPeriodStats] = useState<PreviousStats>({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0,
    responseRate: 0,
    recentReviews: 0,
  });
  // Auto-set to last 12 months by default
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return { start, end };
  };

  const defaultRange = getDefaultDateRange();
  const [startDate, setStartDate] = useState<Date | null>(defaultRange.start);
  const [endDate, setEndDate] = useState<Date | null>(defaultRange.end);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [selectedQuickRange, setSelectedQuickRange] = useState<string | null>(null);
  const [comparisonPeriod, setComparisonPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [comparisonChartData, setComparisonChartData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    // Auto-load with default 12 months range
    loadDashboardDataWithFilters(startDate, endDate);
  }, []);

  const setQuickDateRange = (range: 'week' | 'month' | '3months' | '12months' | 'custom') => {
    const end = new Date();
    const start = new Date();
    
    if (range === 'week') {
      start.setDate(start.getDate() - 7);
      setSelectedQuickRange('week');
    } else if (range === 'month') {
      start.setMonth(start.getMonth() - 1);
      setSelectedQuickRange('month');
    } else if (range === '3months') {
      start.setMonth(start.getMonth() - 3);
      setSelectedQuickRange('3months');
    } else if (range === '12months') {
      start.setMonth(start.getMonth() - 12);
      setSelectedQuickRange('12months');
    } else {
      setSelectedQuickRange(null);
    }
    
    if (range !== 'custom') {
      setStartDate(start);
      setEndDate(end);
      loadDashboardDataWithFilters(start, end);
    }
  };

  const applyFilters = async () => {
    setApplyingFilters(true);
    await loadDashboardDataWithFilters(startDate, endDate);
    setApplyingFilters(false);
    showToast("success", t("Success"), t("Filters applied successfully"));
  };

  const clearFilters = () => {
    const defaultRange = getDefaultDateRange();
    setStartDate(defaultRange.start);
    setEndDate(defaultRange.end);
    setSelectedQuickRange('12months');
    // Reload with empty filters
    loadDashboardDataWithFilters(null, null);
    showToast("info", t("Info"), t("Filters cleared"));
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
          showToast("success", t("Success"), t("Data exported successfully as {format}").replace("{format}", format.toUpperCase()));
          return;
        } else {
          showToast("error", t("Error"), t("Failed to export data"));
          return;
        }
      }
      
      // For main dashboard, export the chart data directly
      if (type === 'main') {
        const csvHeader = [t("Date"), t("Total Reviews"), t("Average Rating")].join(",");
        let csvContent = `${csvHeader}\n`;
        let htmlContent = '';
        
        const dataForExport = chartData ?? chartDataRaw;

        if (dataForExport && dataForExport.labels) {
          const dates = dataForExport.labels;
          const reviews = dataForExport.datasets[0]?.data || [];
          const ratings = dataForExport.datasets[1]?.data || [];
          
          // CSV Content
          for (let i = 0; i < dates.length; i++) {
            csvContent += `${dates[i]},${reviews[i] || 0},${ratings[i] || 0}\n`;
          }
          
          // HTML/PDF Content
          htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>${t("Dashboard Export")}</title>
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
              <h1>${t("Hotel Dashboard Report")}</h1>
              <div class="info">
                <p><strong>${t("Generated:")}</strong> ${new Date().toLocaleString()}</p>
                ${startDate || endDate ? `
                  <p><strong>${t("Date Range:")}</strong> 
                    ${startDate ? startDate.toLocaleDateString() : t("No start")} - 
                    ${endDate ? endDate.toLocaleDateString() : t("No end")}
                  </p>
                ` : ''}
              </div>
              <h2>${t("Review Trends")}</h2>
              <table>
                <thead>
                  <tr>
                    <th>${t("Date")}</th>
                    <th>${t("Total Reviews")}</th>
                    <th>${t("Average Rating")}</th>
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
                <h2>${t("Summary Statistics")}</h2>
                <table>
                  <tr>
                    <th>${t("Metric")}</th>
                    <th>${t("Value")}</th>
                  </tr>
                  <tr>
                    <td>${t("Total Reviews")}</td>
                    <td>${stats.totalReviews}</td>
                  </tr>
                  <tr>
                    <td>${t("Average Rating")}</td>
                    <td>${stats.averageRating.toFixed(2)}/5</td>
                  </tr>
                  <tr>
                    <td>${t("Positive Reviews")}</td>
                    <td>${stats.positiveReviews}</td>
                  </tr>
                  <tr>
                    <td>${t("Negative Reviews")}</td>
                    <td>${stats.negativeReviews}</td>
                  </tr>
                  <tr>
                    <td>${t("Response Rate")}</td>
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
          showToast("success", t("Success"), t("Data exported successfully as CSV"));
        } else {
          // PDF export using print
          const blob = new Blob([htmlContent], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          showToast("success", t("Success"), t("Opening PDF view. Use browser print to save as PDF."));
        }
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast("error", t("Error"), t("Failed to export data"));
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
        setChartDataRaw(data.data.chartData);
        if (data.data.previousStats) {
          setPreviousStats(data.data.previousStats);
        }
        if (data.data.currentPeriodStats) {
          setCurrentPeriodStats(data.data.currentPeriodStats);
        }
      } else {
        throw new Error(data.error || 'Failed to load dashboard data');
      }

      // Load custom rating data
      await loadCustomRatingDataWithFilters(filterStartDate, filterEndDate);
      
      // Load comparison chart data
      await loadComparisonChartData(comparisonPeriod, filterStartDate, filterEndDate);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      showToast("error", t("Error"), t("Failed to load dashboard data"));
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
        console.log('Custom rating API response:', data);
        if (data.data && data.success !== false) {
          console.log('Setting custom rating data:', data.data);
          setCustomRatingData(data.data);
        } else {
          // If no data or form not found, set to null to hide the section
          console.log('No custom rating data found, hiding section');
          setCustomRatingData(null);
        }
      } else {
        // If API returns error, set to null
        console.log('Custom rating API error, hiding section');
        setCustomRatingData(null);
      }
    } catch (error) {
      console.error("Error loading custom rating data:", error);
      // Set to null on error so section doesn't show
      setCustomRatingData(null);
    }
  };

  const loadCustomRatingData = async () => {
    await loadCustomRatingDataWithFilters(startDate, endDate);
  };

  const loadComparisonChartData = async (period: 'weekly' | 'monthly', filterStartDate: Date | null, filterEndDate: Date | null) => {
    setLoadingComparison(true);
    try {
      const params = new URLSearchParams();
      params.append('period', period);
      params.append('locale', locale); // Pass locale to API
      if (filterStartDate) params.append('startDate', filterStartDate.toISOString());
      if (filterEndDate) params.append('endDate', filterEndDate.toISOString());
      
      const response = await fetch(`/api/hotel/dashboard/comparison?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // Translate dataset labels
          const translatedData = {
            ...data.data,
            datasets: data.data.datasets.map((dataset: any) => ({
              ...dataset,
              label: dataset.label === 'positiveReviews' 
                ? t('hotel.dashboard.comparisonChart.positiveReviews') 
                : dataset.label === 'negativeReviews'
                ? t('hotel.dashboard.comparisonChart.negativeReviews')
                : dataset.label
            }))
          };
          setComparisonChartData(translatedData);
        }
      }
    } catch (error) {
      console.error("Error loading comparison chart data:", error);
      // Don't show error toast for this, as it's optional data
    } finally {
      setLoadingComparison(false);
    }
  };

  useEffect(() => {
    if (comparisonPeriod) {
      loadComparisonChartData(comparisonPeriod, startDate, endDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonPeriod, locale]); // Reload when locale changes

  const defaultChartData = useMemo(() => ({
    labels: [t("No Data")],
    datasets: [
      {
        label: t("Reviews"),
        data: [0],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
      },
      {
        label: t("Average Rating"),
        data: [0],
        borderColor: '#2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  }), [t]);

  const chartData = useMemo(() => {
    if (!chartDataRaw) return null;

    const labelMap: Record<string, string> = {
      Reviews: t("Reviews"),
      "Average Rating": t("Average Rating"),
      "Total Reviews": t("Total Reviews"),
    };

    const translateLabel = (label: string) => {
      const mapped = labelMap[label];
      if (mapped) {
        return mapped;
      }
      const translated = t(label);
      return translated ?? label;
    };

    return {
      ...chartDataRaw,
      datasets: chartDataRaw.datasets?.map((dataset: any) => ({
        ...dataset,
        label: translateLabel(dataset.label),
      })),
    };
  }, [chartDataRaw, t]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      datalabels: {
        display: false, // Remove numbers under bars and charts
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          display: true,
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
          drawBorder: false,
        },
        ticks: {
          display: true,
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
    },
  }), [locale, t]);

  const customRatingChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        hoverBorderWidth: 2,
      },
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      datalabels: {
        display: false, // Remove numbers under bars and charts
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 13,
        },
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y.toFixed(1);
            return t("{label}: {value}/5")
              .replace("{label}", context.dataset.label)
              .replace("{value}", value);
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 5.5,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          display: true,
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
      },
    },
  }), [t]);

  const comparisonChartOptions = useMemo(() => ({
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
            return `${context.dataset.label}: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  }), [t, locale]); // Update when translations or locale change

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

  const dateFormatter = useMemo(() => {
    const localeMap: Record<string, string> = {
      en: "en-US",
      ar: "ar-EG",
      zh: "zh-CN",
    };
    return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [locale]);

  const formatDate = useCallback((dateString: string) => {
    return dateFormatter.format(new Date(dateString));
  }, [dateFormatter]);

  const ratingBodyTemplate = (rowData: RecentReview) => {
    return (
      <div className="flex align-items-center gap-2">
        <span>{rowData.overallRating}</span>
        <i className="pi pi-star-fill text-yellow-500"></i>
      </div>
    );
  };

  const reviewStatusLabels = useMemo(() => ({
    APPROVED: t("Approved"),
    PENDING: t("Pending"),
    REJECTED: t("Rejected"),
  }), [t]);

  const statusBodyTemplate = useCallback((rowData: RecentReview) => {
    const label = reviewStatusLabels[rowData.status as keyof typeof reviewStatusLabels] ?? rowData.status;
    return (
      <Tag 
        value={label} 
        severity={getStatusSeverity(rowData.status) as any} 
      />
    );
  }, [getStatusSeverity, reviewStatusLabels]);

  const quickActions = useMemo(() => [
    {
      title: t("Feedback Form"),
      description: t("Create custom feedback forms"),
      icon: "pi pi-plus",
      route: "/hotel/forms",
      color: "blue",
      canAccess: true,
    },
    {
      title: t("Generate QR Code"),
      description: t("Generate QR codes for feedback collection"),
      icon: "pi pi-qrcode",
      route: "/hotel/qr-codes",
      color: "green",
      canAccess: true,
    },
    {
      title: t("Manage Profile"),
      description: t("Update hotel profile and settings"),
      icon: "pi pi-user",
      route: "/hotel/profile",
      color: "orange",
      canAccess: true,
    },
    {
      title: t("Contact Admin"),
      description: t("Get support from system administrators"),
      icon: "pi pi-envelope",
      route: "/hotel/support",
      color: "red",
      canAccess: true,
    },
  ], [t]);

  // Calculate percentage change helper
  const calculatePercentageChange = useCallback((current: number, previous: number): { value: number; isPositive: boolean } | null => {
    // If previous is 0, we can't calculate a meaningful percentage change
    // Return null to hide the indicator when there's no previous data
    if (previous === 0) {
      return null;
    }
    const change = ((current - previous) / previous) * 100;
    // Only show if change is significant (more than 0.1% to avoid showing 0.0%)
    if (Math.abs(change) < 0.1) {
      return null;
    }
    // Cap percentage at 100% maximum
    const cappedValue = Math.min(Math.abs(change), 100);
    return {
      value: cappedValue,
      isPositive: change >= 0,
    };
  }, []);

  const statsCards = useMemo(() => {
    // Use currentPeriodStats for comparison (equivalent periods) instead of displayed stats
    const totalReviewsChange = calculatePercentageChange(currentPeriodStats.totalReviews, previousStats.totalReviews);
    const averageRatingChange = calculatePercentageChange(currentPeriodStats.averageRating, previousStats.averageRating);
    const positiveReviewsChange = calculatePercentageChange(currentPeriodStats.positiveReviews, previousStats.positiveReviews);
    const negativeReviewsChange = calculatePercentageChange(currentPeriodStats.negativeReviews, previousStats.negativeReviews);
    const responseRateChange = calculatePercentageChange(currentPeriodStats.responseRate, previousStats.responseRate);

    return [
      {
        title: t("Total Reviews"),
        value: stats.totalReviews.toString(),
        icon: "pi pi-comments",
        color: "text-blue-500",
        image: "/images/feedback.png",
        percentageChange: totalReviewsChange,
      },
      {
        title: t("Average Rating"),
        value: stats.averageRating.toFixed(1),
        icon: "pi pi-star",
        color: "text-yellow-500",
        image: "/images/rating.png",
        percentageChange: averageRatingChange,
      },
      {
        title: t("Positive Reviews"),
        value: stats.positiveReviews.toString(),
        icon: "pi pi-thumbs-up",
        color: "text-green-500",
        image: "/images/positive-rating.png",
        percentageChange: positiveReviewsChange,
      },
      {
        title: t("Negative Reviews"),
        value: stats.negativeReviews.toString(),
        icon: "pi pi-thumbs-down",
        color: "text-red-500",
        image: "/images/rating.png",
        percentageChange: negativeReviewsChange ? {
          value: negativeReviewsChange.value,
          isPositive: !negativeReviewsChange.isPositive, // Inverted: decrease in negative reviews is good
          isNegativeReviews: true, // Flag to reverse colors
        } : null,
      },
      {
        title: t("Response Rate"),
        value: `${Math.round(stats.responseRate)}%`,
        icon: "pi pi-percentage",
        color: "text-purple-500",
        image: "/images/response.png",
        percentageChange: responseRateChange,
      },
    ];
  }, [stats, previousStats, currentPeriodStats, t, calculatePercentageChange]);

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">{t("Welcome Back!")}</h1>
            <p className="text-600 mt-2 mb-0">
              {t("Create feedback forms, keep track of guest ratings, and monitor overall satisfaction. Enhance every stay with better insights!")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("Refresh")}
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
          <div className="flex flex-column gap-3">
            {/* Quick Range Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                label={t("Last Week")}
                icon="pi pi-calendar"
                onClick={() => setQuickDateRange('week')}
                className={selectedQuickRange === 'week' ? '' : 'p-button-outlined'}
                size="small"
              />
              <Button
                label={t("Last Month")}
                icon="pi pi-calendar"
                onClick={() => setQuickDateRange('month')}
                className={selectedQuickRange === 'month' ? '' : 'p-button-outlined'}
                size="small"
              />
              <Button
                label={t("Last 3 Months")}
                icon="pi pi-calendar"
                onClick={() => setQuickDateRange('3months')}
                className={selectedQuickRange === '3months' ? '' : 'p-button-outlined'}
                size="small"
              />
              <Button
                label={t("Last 12 Months")}
                icon="pi pi-calendar"
                onClick={() => setQuickDateRange('12months')}
                className={selectedQuickRange === '12months' ? '' : 'p-button-outlined'}
                size="small"
              />
              <Button
                label={t("Custom Range")}
                icon="pi pi-calendar-times"
                onClick={() => setQuickDateRange('custom')}
                className={selectedQuickRange === null ? '' : 'p-button-outlined'}
                size="small"
              />
            </div>
            
            {/* Custom Date Pickers (only show when custom is selected) */}
            {selectedQuickRange === null && (
              <div className="grid">
                <div className="col-12 md:col-4">
                  <label className="block text-900 font-medium mb-2">{t("Start Date")}</label>
                  <Calendar
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.value as Date | null);
                      setSelectedQuickRange(null);
                    }}
                    placeholder={t("Select start date")}
                    className="w-full"
                    showIcon
                    dateFormat="yy-mm-dd"
                    maxDate={endDate || new Date()}
                  />
                </div>
                <div className="col-12 md:col-4">
                  <label className="block text-900 font-medium mb-2">{t("End Date")}</label>
                  <Calendar
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.value as Date | null);
                      setSelectedQuickRange(null);
                    }}
                    placeholder={t("Select end date")}
                    className="w-full"
                    showIcon
                    dateFormat="yy-mm-dd"
                    minDate={startDate || undefined}
                    maxDate={new Date()}
                  />
                </div>
                <div className="col-12 md:col-2 flex align-items-end">
                  <Button
                    label={t("Search")}
                    icon="pi pi-search"
                    onClick={applyFilters}
                    loading={applyingFilters}
                    className="w-full"
                    disabled={applyingFilters}
                  />
                </div>
                <div className="col-12 md:col-2 flex align-items-end">
                  <Button
                    label={t("Clear")}
                    icon="pi pi-filter-slash"
                    onClick={() => {
                      const defaultRange = getDefaultDateRange();
                      setStartDate(defaultRange.start);
                      setEndDate(defaultRange.end);
                      setSelectedQuickRange('12months');
                      loadDashboardDataWithFilters(defaultRange.start, defaultRange.end);
                    }}
                    className="w-full p-button-outlined p-button-secondary"
                    disabled={applyingFilters}
                  />
                </div>
              </div>
            )}
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
                    <div className="text-600 animate-pulse">{t("Loading...")}</div>
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
                        padding: '0 !important',
                        position: 'relative'
                    }}
                  >
                    <div className="flex align-items-center" style={{ gap: '1.5rem', padding: '0.5rem' }}>
                        <img src={card.image} alt={card.title} className={`flex align-items-center justify-content-center bg-${card.color} border-round-lg flex-shrink-0`} style={{ width: '60px', height: '60px' }} />
                        <div className="flex-1">
                            <div className="text-900 font-bold mb-2" style={{ fontSize: '1.2rem', lineHeight: '1.2', color: '#333333' }}>{card.value}</div>
                            <div className="text-500" style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666666' }}>{card.title}</div>
                        </div>
                    </div>
                    {card.percentageChange && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          // For negative reviews: red when up (bad), green when down (good)
                          // For others: green when up (good), red when down (bad)
                          backgroundColor: (card.percentageChange as any).isNegativeReviews
                            ? (card.percentageChange.isPositive 
                                ? 'rgba(239, 68, 68, 0.1)'  // Red when up (bad for negative reviews)
                                : 'rgba(16, 185, 129, 0.1)') // Green when down (good for negative reviews)
                            : (card.percentageChange.isPositive 
                                ? 'rgba(16, 185, 129, 0.1)'  // Green when up (good)
                                : 'rgba(239, 68, 68, 0.1)'), // Red when down (bad)
                          color: (card.percentageChange as any).isNegativeReviews
                            ? (card.percentageChange.isPositive ? '#ef4444' : '#10b981')
                            : (card.percentageChange.isPositive ? '#10b981' : '#ef4444'),
                          border: `1px solid ${(card.percentageChange as any).isNegativeReviews
                            ? (card.percentageChange.isPositive 
                                ? 'rgba(239, 68, 68, 0.2)' 
                                : 'rgba(16, 185, 129, 0.2)')
                            : (card.percentageChange.isPositive 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : 'rgba(239, 68, 68, 0.2)')}`,
                          lineHeight: '1',
                        }}
                      >
                        <i
                          className={card.percentageChange.isPositive ? 'pi pi-arrow-up' : 'pi pi-arrow-down'}
                          style={{ fontSize: '0.65rem' }}
                        />
                        <span>{Math.round(card.percentageChange.value)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Review Comparison Chart */}
      <div className="col-12">
        <Card className="mt-4">
          <div className="flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">{t("hotel.dashboard.comparisonChart.title")}</h3>
            <div className="flex align-items-center gap-3">
              <label className="text-sm text-600">{t("hotel.dashboard.comparisonChart.period")}:</label>
              <div className="flex gap-2">
                <Button
                  label={t("hotel.dashboard.comparisonChart.weekly")}
                  icon="pi pi-calendar"
                  onClick={() => setComparisonPeriod('weekly')}
                  className={comparisonPeriod === 'weekly' ? '' : 'p-button-outlined'}
                  size="small"
                  disabled={loadingComparison}
                />
                <Button
                  label={t("hotel.dashboard.comparisonChart.monthly")}
                  icon="pi pi-calendar"
                  onClick={() => setComparisonPeriod('monthly')}
                  className={comparisonPeriod === 'monthly' ? '' : 'p-button-outlined'}
                  size="small"
                  disabled={loadingComparison}
                />
              </div>
            </div>
          </div>
          {loadingComparison ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.dashboard.comparisonChart.loading")}</div>
            </div>
          ) : comparisonChartData ? (
            <Chart 
              key={`comparison-chart-${locale}`} // Force re-render when locale changes
              type="bar" 
              data={comparisonChartData} 
              options={comparisonChartOptions} 
              style={{ height: '400px' }} 
            />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.dashboard.comparisonChart.noData")}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Charts */}
      <div className="col-12">
        <Card title={t("Review Trends")} className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">{t("Loading chart data...")}</div>
            </div>
          ) : (
            <Chart type="line" data={chartData || defaultChartData} options={chartOptions} style={{ height: '300px' }} />
          )}
          <div className="flex justify-content-end gap-2 mt-3 pt-3 border-top-1 surface-border">
            <Button
              label={t("Export CSV")}
              icon="pi pi-file"
              onClick={() => exportData('csv', 'main')}
              className="p-button-outlined p-button-sm"
              disabled={loading}
            />
            <Button
              label={t("Export PDF")}
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
            <Card title={t("Custom Rating Trends - {title}").replace("{title}", customRatingData.formTitle)}>
              {loading ? (
                <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
                  <div className="text-600">{t("Loading custom rating data...")}</div>
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
                  label={t("Export CSV")}
                  icon="pi pi-file"
                  onClick={() => exportData('csv', 'custom')}
                  className="p-button-outlined p-button-sm"
                  disabled={loading}
                />
                <Button
                  label={t("Export PDF")}
                  icon="pi pi-file-pdf"
                  onClick={() => exportData('pdf', 'custom')}
                  className="p-button-outlined p-button-sm"
                  disabled={loading}
                />
              </div>
            </Card>
          </div>

          <div className="col-12">
            <Card title={t("Custom Rating Summary")}>
              <div className="grid">
                {customRatingData.summary.map((item, index) => (
                  <div key={item.label} className="col-12 md:col-6 lg:col-4">
                    <div className="border-1 surface-border border-round p-3">
                      <div className="flex align-items-center justify-content-between mb-2">
                        <span className="text-900 font-medium">{item.label}</span>
                        <span className="text-500 text-sm">
                          {t("({count} ratings)").replace("{count}", item.totalRatings.toString())}
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
                        />
                        <div className="flex-1">
                          <div className="text-2xl font-bold text-900">
                            {item.averageRating.toFixed(2)}/5
                          </div>
                          <div className="text-sm text-600">
                            {t("Average Rating")}
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
          <h2 className="text-3xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>{t("Quick Actions")}</h2>
          <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
            {t("Respond faster to guest concerns, follow up on feedback, and resolve issues in just a few clicks.")}
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
        <div title={t("hotel.dashboard.recentReviews.title")} className="mt-4">
        <div className="mb-4">
          <h2 className="text-3xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>
            {t("hotel.dashboard.recentReviews.title")}
          </h2>
          <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
            {t("hotel.dashboard.recentReviews.description")}
          </p>
        </div>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-600">{t("hotel.dashboard.recentReviews.states.loading")}</div>
            </div>
          ) : (
            <DataTable value={recentReviews}>
              <Column field="guestName" header={t("hotel.reviews.table.guest")} />
              <Column field="guestEmail" header={t("hotel.reviews.table.email")} />
              <Column field="overallRating" header={t("hotel.reviews.table.rating")} body={ratingBodyTemplate} />
              <Column field="status" header={t("hotel.reviews.table.status")} body={statusBodyTemplate} />
              <Column 
                field="submittedAt" 
                header={t("hotel.dashboard.recentReviews.table.date")} 
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
