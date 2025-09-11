"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AnalyticsData {
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

export default function HotelAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
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
        showToast("error", "Error", errorData.error || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      showToast("error", "Error", "Failed to load analytics");
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

  const timeRangeOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 6 months", value: "180" },
    { label: "Last year", value: "365" },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Analytics</h1>
            <p className="text-600 mt-2 mb-0">Track your hotel's performance and guest satisfaction.</p>
          </div>
          <div className="flex gap-2">
            <Dropdown
              value={timeRange}
              options={timeRangeOptions}
              onChange={(e) => setTimeRange(e.value)}
              placeholder="Select time range"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadAnalytics}
              loading={loading}
              className="p-button-outlined"
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
                  {card.change} from last period
                </div>
              </Card>
            </div>
          ))}
        </>
      ) : (
        <div className="col-12">
          <Card className="text-center">
            <div className="text-600">No analytics data available</div>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="col-12 lg:col-8">
        <Card title="Satisfaction Trends" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : analyticsData ? (
            <Chart type="line" data={analyticsData.charts.satisfaction} options={chartOptions} style={{ height: '300px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">No chart data available</div>
            </div>
          )}
        </Card>
      </div>

      <div className="col-12 lg:col-4">
        <Card title="Rating Distribution" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : analyticsData ? (
            <Chart type="doughnut" data={analyticsData.charts.ratingDistribution} options={chartOptions} style={{ height: '300px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">No chart data available</div>
            </div>
          )}
        </Card>
      </div>

      <div className="col-12">
        <Card title="Review Volume" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : analyticsData ? (
            <Chart type="line" data={analyticsData.charts.reviews} options={chartOptions} style={{ height: '300px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">No chart data available</div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Reviews */}
      {analyticsData && analyticsData.reviews.length > 0 && (
        <div className="col-12">
          <Card title="Recent Reviews" className="mt-4">
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
