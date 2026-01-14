"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/TranslationProvider";

interface ResponseData {
  statsCards: Array<{
    title: string;
    value: string;
    change: string;
    changeType: "positive" | "negative";
    icon: string;
  }>;
  charts: {
    satisfaction: any;
    reviews: any;
    ratingDistribution: any;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    form: {
      title: string;
    };
  }>;
}

export default function HotelResponseRatesAnalytics() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [analyticsData, setAnalyticsData] = useState<ResponseData | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
      } else {
        const errorData = await response.json();
        console.error("Analytics API error:", errorData);
        showToast("error", t("common.error"), errorData.error || t("hotel.analytics.overview.toasts.loadError"));
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      showToast("error", t("common.error"), t("hotel.analytics.overview.toasts.loadError"));
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
      datalabels: {
        display: false, // Remove numbers under bars and charts
      },
      tooltip: {
        enabled: true, // Keep tooltips on hover
      },
    },
  };

  const timeRangeOptions = useMemo(() => [
    { label: t("hotel.analytics.overview.timeRanges.7"), value: "7" },
    { label: t("hotel.analytics.overview.timeRanges.30"), value: "30" },
    { label: t("hotel.analytics.overview.timeRanges.90"), value: "90" },
    { label: t("hotel.analytics.overview.timeRanges.180"), value: "180" },
    { label: t("hotel.analytics.overview.timeRanges.365"), value: "365" },
  ], [t]);

  const dateFormatter = useMemo(() => {
    const localeMap: Record<string, string> = {
      en: "en-US",
      ar: "ar-EG",
      zh: "zh-CN",
    };
    return new Intl.DateTimeFormat(localeMap[locale] ?? "en-US", {
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

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">{t("hotel.analytics.responseRates.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.analytics.responseRates.description")}</p>
          </div>
          <div className="flex gap-2">
            <Dropdown
              value={timeRange}
              options={timeRangeOptions}
              onChange={(e) => setTimeRange(e.value)}
              placeholder={t("hotel.analytics.overview.dropdownPlaceholder")}
            />
            <Button
              label={t("hotel.analytics.overview.buttons.refresh")}
              icon="pi pi-refresh"
              onClick={loadAnalytics}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Response Rate Stats Cards */}
      {loading ? (
        <>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="col-12 md:col-6 lg:col-3">
              <Card className="text-center">
                <div className="text-3xl font-bold text-gray-300 animate-pulse">--</div>
                <div className="text-600 animate-pulse">{t("hotel.analytics.overview.states.loadingSkeleton")}</div>
              </Card>
            </div>
          ))}
        </>
      ) : analyticsData ? (
        <>
          {analyticsData.statsCards.map((card, index) => (
            <div className="col-12 md:col-6 lg:col-3" key={index}>
              <Card className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">
                  <i className={`${card.icon} mr-2`}></i>
                  {card.value}
                </div>
                <div className="text-600 mb-1">{card.title}</div>
                <div className={`text-sm ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {t("hotel.analytics.overview.cards.change").replace("{change}", card.change)}
                </div>
              </Card>
            </div>
          ))}
        </>
      ) : (
        <div className="col-12">
          <Card className="text-center">
            <div className="text-600">{t("hotel.analytics.overview.states.noData")}</div>
          </Card>
        </div>
      )}

      {/* Review Volume Chart */}
      <div className="col-12 lg:col-8">
        <Card title={t("hotel.analytics.responseRates.charts.reviewVolume")} className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartLoading")}</div>
            </div>
          ) : analyticsData ? (
            <Chart type="line" data={analyticsData.charts.reviews} options={chartOptions} style={{ height: '400px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartEmpty")}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Rating Distribution */}
      <div className="col-12 lg:col-4">
        <Card title={t("hotel.analytics.overview.charts.ratingDistribution")} className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartLoading")}</div>
            </div>
          ) : analyticsData ? (
            <Chart type="doughnut" data={analyticsData.charts.ratingDistribution} options={chartOptions} style={{ height: '400px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartEmpty")}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Satisfaction Trends Chart */}
      <div className="col-12">
        <Card title={t("hotel.analytics.responseRates.charts.satisfaction")} className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartLoading")}</div>
            </div>
          ) : analyticsData ? (
            <Chart type="line" data={analyticsData.charts.satisfaction} options={chartOptions} style={{ height: '400px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">{t("hotel.analytics.overview.states.chartEmpty")}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Reviews */}
      {analyticsData && analyticsData.reviews.length > 0 && (
        <div className="col-12">
          <Card title={t("hotel.analytics.overview.reviews.title")} className="mt-4">
            <div className="flex flex-column gap-3">
              {analyticsData.reviews.map((review) => (
                <div key={review.id} className="border-1 surface-border border-round p-3">
                  <div className="flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="m-0 mb-1">{review.form.title}</h6>
                      <div className="flex align-items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <i
                              key={i}
                              className={`pi pi-star-fill ${
                                i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-600 text-sm">{review.rating}/5</span>
                      </div>
                    </div>
                    <span className="text-600 text-sm">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-600 text-sm m-0">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Toast ref={toast} />
    </div>
  );
}
