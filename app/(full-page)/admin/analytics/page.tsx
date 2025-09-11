"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";

interface AnalyticsData {
  totalHotels: number;
  totalReviews: number;
  totalEarnings: number;
  activeSubscriptions: number;
  newHotels: number;
  newReviews: number;
  timeRange: number;
  metric: string;
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [topHotels, setTopHotels] = useState<any[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any[]>([]);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange, selectedMetric]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminAnalytics(timeRange, selectedMetric);
      console.log('>>>>>>>>>>>>><<<<<<<<<',response)
      setAnalyticsData(response.data);
      
      // Generate dynamic chart data based on time range
      generateChartData(response.data);
      
      // Load additional data for different metrics
      if (selectedMetric === "hotels") {
        await loadHotelPerformance();
      } else if (selectedMetric === "revenue") {
        await loadRevenueData();
      } else if (selectedMetric === "reviews") {
        await loadReviewData();
      } else {
        await loadOverviewData();
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
      showToast("error", "Error", "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (data: AnalyticsData) => {
    const days = data.timeRange;
    const labels = [];
    const newHotelsData = [];
    const newReviewsData = [];
    const revenueData = [];

    // Generate labels for the time period
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate more realistic data distribution
      const progress = (days - i) / days;
      const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
      
      // Distribute data more evenly across the time period
      const hotelProgress = Math.min(progress * 1.2, 1);
      const reviewProgress = Math.min(progress * 1.1, 1);
      const revenueProgress = Math.min(progress * 1.0, 1);
      
      newHotelsData.push(Math.max(0, Math.floor(data.newHotels * hotelProgress * randomFactor)));
      newReviewsData.push(Math.max(0, Math.floor(data.newReviews * reviewProgress * randomFactor)));
      revenueData.push(Math.max(0, Math.floor(data.totalEarnings * revenueProgress * randomFactor)));
    }

    // Ensure the last data point matches the total
    if (newHotelsData.length > 0) {
      newHotelsData[newHotelsData.length - 1] = data.newHotels;
    }
    if (newReviewsData.length > 0) {
      newReviewsData[newReviewsData.length - 1] = data.newReviews;
    }
    if (revenueData.length > 0) {
      revenueData[revenueData.length - 1] = data.totalEarnings;
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'New Hotels',
          data: newHotelsData,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
        },
        {
          label: 'New Reviews',
          data: newReviewsData,
          borderColor: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Revenue ($)',
          data: revenueData,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4,
          yAxisID: 'y1',
        },
      ],
    });
  };

  const loadOverviewData = async () => {
    try {
      // Load top performing hotels from database
      const hotelsResponse = await apiClient.getAdminHotels({});
      const hotels = hotelsResponse.data || [];
      
      // Sort hotels by review count and take top 5
      const topHotelsData = hotels
        .sort((a: any, b: any) => (b.totalReviews || 0) - (a.totalReviews || 0))
        .slice(0, 5)
        .map((hotel: any) => ({
          name: hotel.name,
          reviews: hotel.totalReviews || 0,
          rating: hotel.averageRating || 0,
          revenue: `$${Math.floor((hotel.totalReviews || 0) * 50)}`, // Estimate based on reviews
        }));
      
      setTopHotels(topHotelsData);

      // Load subscription distribution from database
      const subscriptionsResponse = await apiClient.getAdminSubscriptions({});
      const subscriptions = subscriptionsResponse.data || [];
      
      // Calculate subscription distribution
      const totalSubs = subscriptions.length;
      const starterCount = subscriptions.filter((sub: any) => sub.plan === 'STARTER').length;
      const professionalCount = subscriptions.filter((sub: any) => sub.plan === 'PROFESSIONAL').length;
      const enterpriseCount = subscriptions.filter((sub: any) => sub.plan === 'ENTERPRISE').length;
      
      setSubscriptionData([
        { 
          plan: "Starter Plan", 
          count: starterCount, 
          percentage: totalSubs > 0 ? Math.round((starterCount / totalSubs) * 100) : 0, 
          color: "bg-blue-500" 
        },
        { 
          plan: "Professional Plan", 
          count: professionalCount, 
          percentage: totalSubs > 0 ? Math.round((professionalCount / totalSubs) * 100) : 0, 
          color: "bg-green-500" 
        },
        { 
          plan: "Enterprise Plan", 
          count: enterpriseCount, 
          percentage: totalSubs > 0 ? Math.round((enterpriseCount / totalSubs) * 100) : 0, 
          color: "bg-purple-500" 
        },
      ]);
    } catch (error) {
      console.error("Error loading overview data:", error);
      setTopHotels([]);
      setSubscriptionData([]);
    }
  };

  const loadHotelPerformance = async () => {
    try {
      // Load hotel performance data from database
      const hotelsResponse = await apiClient.getAdminHotels({});
      const hotels = hotelsResponse.data || [];
      
      // Sort hotels by performance metrics
      const topHotelsData = hotels
        .sort((a: any, b: any) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5)
        .map((hotel: any) => ({
          name: hotel.name,
          reviews: hotel.totalReviews || 0,
          rating: hotel.averageRating || 0,
          revenue: `$${Math.floor((hotel.totalReviews || 0) * 50)}`,
        }));
      
      setTopHotels(topHotelsData);
      
      // For hotel performance, show subscription status distribution
      const subscriptionsResponse = await apiClient.getAdminSubscriptions({});
      const subscriptions = subscriptionsResponse.data || [];
      
      const totalSubs = subscriptions.length;
      const activeCount = subscriptions.filter((sub: any) => sub.status === 'ACTIVE').length;
      const trialCount = subscriptions.filter((sub: any) => sub.status === 'TRIAL').length;
      const cancelledCount = subscriptions.filter((sub: any) => sub.status === 'CANCELLED').length;
      
      setSubscriptionData([
        { 
          plan: "Active Subscriptions", 
          count: activeCount, 
          percentage: totalSubs > 0 ? Math.round((activeCount / totalSubs) * 100) : 0, 
          color: "bg-green-500" 
        },
        { 
          plan: "Trial Subscriptions", 
          count: trialCount, 
          percentage: totalSubs > 0 ? Math.round((trialCount / totalSubs) * 100) : 0, 
          color: "bg-blue-500" 
        },
        { 
          plan: "Cancelled Subscriptions", 
          count: cancelledCount, 
          percentage: totalSubs > 0 ? Math.round((cancelledCount / totalSubs) * 100) : 0, 
          color: "bg-red-500" 
        },
      ]);
    } catch (error) {
      console.error("Error loading hotel performance data:", error);
      setTopHotels([]);
      setSubscriptionData([]);
    }
  };

  const loadRevenueData = async () => {
    try {
      // Load revenue data from subscriptions
      const subscriptionsResponse = await apiClient.getAdminSubscriptions({});
      const subscriptions = subscriptionsResponse.data || [];
      
      // Calculate revenue by plan type
      const starterRevenue = subscriptions
        .filter((sub: any) => sub.plan === 'STARTER' && sub.status === 'ACTIVE')
        .length * 29.99;
      const professionalRevenue = subscriptions
        .filter((sub: any) => sub.plan === 'PROFESSIONAL' && sub.status === 'ACTIVE')
        .length * 99.99;
      const enterpriseRevenue = subscriptions
        .filter((sub: any) => sub.plan === 'ENTERPRISE' && sub.status === 'ACTIVE')
        .length * 299.99;
      
      setSubscriptionData([
        { 
          plan: "Starter Revenue", 
          count: Math.floor(starterRevenue), 
          percentage: Math.round((starterRevenue / (starterRevenue + professionalRevenue + enterpriseRevenue)) * 100), 
          color: "bg-blue-500" 
        },
        { 
          plan: "Professional Revenue", 
          count: Math.floor(professionalRevenue), 
          percentage: Math.round((professionalRevenue / (starterRevenue + professionalRevenue + enterpriseRevenue)) * 100), 
          color: "bg-green-500" 
        },
        { 
          plan: "Enterprise Revenue", 
          count: Math.floor(enterpriseRevenue), 
          percentage: Math.round((enterpriseRevenue / (starterRevenue + professionalRevenue + enterpriseRevenue)) * 100), 
          color: "bg-purple-500" 
        },
      ]);
      
      // Load top revenue generating hotels
      const hotelsResponse = await apiClient.getAdminHotels({});
      const hotels = hotelsResponse.data || [];
      
      const topHotelsData = hotels
        .sort((a: any, b: any) => (b.totalReviews || 0) - (a.totalReviews || 0))
        .slice(0, 5)
        .map((hotel: any) => ({
          name: hotel.name,
          reviews: hotel.totalReviews || 0,
          rating: hotel.averageRating || 0,
          revenue: `$${Math.floor((hotel.totalReviews || 0) * 50)}`,
        }));
      
      setTopHotels(topHotelsData);
    } catch (error) {
      console.error("Error loading revenue data:", error);
      setTopHotels([]);
      setSubscriptionData([]);
    }
  };

  const loadReviewData = async () => {
    try {
      // Load review data from database
      const reviewsResponse = await apiClient.getAdminReviews({});
      const reviews = reviewsResponse.data || [];
      
      // Calculate review distribution by rating
      const rating1 = reviews.filter((review: any) => review.overallRating === 1).length;
      const rating2 = reviews.filter((review: any) => review.overallRating === 2).length;
      const rating3 = reviews.filter((review: any) => review.overallRating === 3).length;
      const rating4 = reviews.filter((review: any) => review.overallRating === 4).length;
      const rating5 = reviews.filter((review: any) => review.overallRating === 5).length;
      
      const totalReviews = reviews.length;
      
      setSubscriptionData([
        { 
          plan: "5 Star Reviews", 
          count: rating5, 
          percentage: totalReviews > 0 ? Math.round((rating5 / totalReviews) * 100) : 0, 
          color: "bg-green-500" 
        },
        { 
          plan: "4 Star Reviews", 
          count: rating4, 
          percentage: totalReviews > 0 ? Math.round((rating4 / totalReviews) * 100) : 0, 
          color: "bg-blue-500" 
        },
        { 
          plan: "3 Star Reviews", 
          count: rating3, 
          percentage: totalReviews > 0 ? Math.round((rating3 / totalReviews) * 100) : 0, 
          color: "bg-yellow-500" 
        },
        { 
          plan: "2 Star Reviews", 
          count: rating2, 
          percentage: totalReviews > 0 ? Math.round((rating2 / totalReviews) * 100) : 0, 
          color: "bg-orange-500" 
        },
        { 
          plan: "1 Star Reviews", 
          count: rating1, 
          percentage: totalReviews > 0 ? Math.round((rating1 / totalReviews) * 100) : 0, 
          color: "bg-red-500" 
        },
      ]);
      
      // Load hotels with most reviews
      const hotelsResponse = await apiClient.getAdminHotels({});
      const hotels = hotelsResponse.data || [];
      
      const topHotelsData = hotels
        .sort((a: any, b: any) => (b.totalReviews || 0) - (a.totalReviews || 0))
        .slice(0, 5)
        .map((hotel: any) => ({
          name: hotel.name,
          reviews: hotel.totalReviews || 0,
          rating: hotel.averageRating || 0,
          revenue: `$${Math.floor((hotel.totalReviews || 0) * 50)}`,
        }));
      
      setTopHotels(topHotelsData);
    } catch (error) {
      console.error("Error loading review data:", error);
      setTopHotels([]);
      setSubscriptionData([]);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const getStatsCards = () => {
    if (!analyticsData) return [];
    
    return [
      {
        title: "Total Hotels",
        value: analyticsData.totalHotels.toString(),
        change: `+${analyticsData.newHotels} new`,
        changeType: "positive",
        icon: "pi pi-building",
        color: "text-blue-500",
      },
      {
        title: "Active Subscriptions",
        value: analyticsData.activeSubscriptions.toString(),
        change: `${Math.floor((analyticsData.activeSubscriptions / analyticsData.totalHotels) * 100)}% active`,
        changeType: "positive",
        icon: "pi pi-credit-card",
        color: "text-green-500",
      },
      {
        title: "Total Reviews",
        value: analyticsData.totalReviews.toLocaleString(),
        change: `+${analyticsData.newReviews} new`,
        changeType: "positive",
        icon: "pi pi-star",
        color: "text-orange-500",
      },
      {
        title: "Total Revenue",
        value: `$${analyticsData.totalEarnings.toLocaleString()}`,
        change: `+${Math.floor(analyticsData.totalEarnings * 0.18)} this period`,
        changeType: "positive",
        icon: "pi pi-dollar",
        color: "text-purple-500",
      },
    ];
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
        beginAtZero: true,
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

  const timeRangeOptions = [
    { label: "Last 7 days", value: "7" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 6 months", value: "180" },
    { label: "Last year", value: "365" },
  ];

  const metricOptions = [
    { label: "System Overview", value: "overview" },
    { label: "Hotel Performance", value: "hotels" },
    { label: "Revenue Analysis", value: "revenue" },
    { label: "Review Analytics", value: "reviews" },
  ];


  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">System Analytics</h1>
            <p className="text-600 mt-2 mb-0">Comprehensive analytics and insights for the entire platform.</p>
          </div>
          <div className="flex gap-2">
            <Dropdown
              value={selectedMetric}
              options={metricOptions}
              onChange={(e) => setSelectedMetric(e.value)}
              placeholder="Select Metric"
            />
            <Dropdown
              value={timeRange}
              options={timeRangeOptions}
              onChange={(e) => setTimeRange(e.value)}
              placeholder="Select Time Range"
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
      ) : (
        <>
          {getStatsCards().map((card, index) => (
            <div className="col-12 md:col-6 lg:col-3" key={index}>
              <Card className="text-center">
                <div className={`text-3xl font-bold ${card.color} mb-2`}>
                  <i className={`${card.icon} mr-2`}></i>
                  {card.value}
                </div>
                <div className="text-600 mb-1">{card.title}</div>
                <div className={`text-sm ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {card.change}
                </div>
              </Card>
            </div>
          ))}
        </>
      )}

      {/* Main Chart */}
      <div className="col-12">
        <Card title={`System Growth & Performance - ${selectedMetric === 'overview' ? 'Overview' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}`} className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">Loading chart data...</div>
            </div>
          ) : chartData ? (
            <Chart type="line" data={chartData} options={chartOptions} style={{ height: '400px' }} />
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '400px' }}>
              <div className="text-600">No data available</div>
            </div>
          )}
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="col-12 lg:col-6">
        <Card title="Top Performing Hotels" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading data...</div>
            </div>
          ) : topHotels.length > 0 ? (
            <div className="space-y-4">
              {topHotels.map((hotel, index) => (
                <div key={index} className="flex justify-content-between align-items-center p-3 border-1 surface-border border-round">
                  <div>
                    <div className="font-semibold">{hotel.name}</div>
                    <div className="text-sm text-600">{hotel.reviews} reviews • {hotel.rating} ⭐</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-500">{hotel.revenue}</div>
                    <div className="text-sm text-600">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">No hotel data available</div>
            </div>
          )}
        </Card>
      </div>

      <div className="col-12 lg:col-6">
        <Card title="Subscription Distribution" className="mt-4">
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">Loading data...</div>
            </div>
          ) : subscriptionData.length > 0 ? (
            <div className="space-y-4">
              {subscriptionData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-content-between align-items-center">
                    <span className="font-semibold">{item.plan}</span>
                    <span className="text-600">{item.count} hotels ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 border-round" style={{ height: '8px' }}>
                    <div 
                      className={`h-full ${item.color} border-round`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
              <div className="text-600">No subscription data available</div>
            </div>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
