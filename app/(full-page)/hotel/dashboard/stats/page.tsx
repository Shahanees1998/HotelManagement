"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { Toast } from "primereact/toast";
import { useRef } from "react";

interface StatsData {
  totalReviews: number;
  averageRating: number;
  satisfactionRate: number;
  monthlyReviews: number;
  chartData: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };
  ratingDistribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

export default function DashboardStatsPage() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/analytics');
      if (response.ok) {
        const data = await response.json();
        setStatsData(data.data);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to load stats data");
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

  if (loading) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="text-center p-4">
            <i className="pi pi-spinner pi-spin text-2xl"></i>
            <p className="mt-2">Loading stats...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="text-center p-4">
            <p>No stats data available</p>
          </div>
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
            <h1 className="text-3xl font-bold m-0">Quick Stats</h1>
            <p className="text-600 mt-2 mb-0">Overview of your hotel's key performance metrics.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-500 mb-2">{statsData.totalReviews || 0}</div>
          <div className="text-600">Total Reviews</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-500 mb-2">{(statsData.averageRating || 0).toFixed(1)}</div>
          <div className="text-600">Average Rating</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-500 mb-2">{statsData.satisfactionRate || 0}%</div>
          <div className="text-600">Satisfaction Rate</div>
        </Card>
      </div>
      <div className="col-12 md:col-3">
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-500 mb-2">{statsData.monthlyReviews || 0}</div>
          <div className="text-600">This Month</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="col-12 lg:col-8">
        <Card title="Review Trends" className="mt-4">
          <Chart type="line" data={statsData.chartData} options={chartOptions} style={{ height: '400px' }} />
        </Card>
      </div>

      <div className="col-12 lg:col-4">
        <Card title="Rating Distribution" className="mt-4">
          <Chart 
            type="doughnut" 
            data={statsData.ratingDistribution} 
            options={chartOptions} 
            style={{ height: '400px' }} 
          />
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
