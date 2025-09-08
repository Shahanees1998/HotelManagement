'use client'

import { useState, useEffect } from 'react'
import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { Dropdown } from 'primereact/dropdown'
import { Button } from 'primereact/button'
import { Tag } from 'primereact/tag'
import toast from 'react-hot-toast'

interface AnalyticsData {
  totalReviews: number
  averageRating: number
  reviewsThisMonth: number
  reviewsLastMonth: number
  monthOverMonthGrowth: number
}

interface AnalyticsDashboardProps {
  initialData: AnalyticsData
  hotelId: string
}

export default function AnalyticsDashboard({ initialData, hotelId }: AnalyticsDashboardProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30')
  const [chartData, setChartData] = useState({})
  const [ratingChartData, setRatingChartData] = useState({})

  const periodOptions = [
    { label: 'Last 7 days', value: '7' },
    { label: 'Last 30 days', value: '30' },
    { label: 'Last 90 days', value: '90' },
    { label: 'Last year', value: '365' }
  ]

  useEffect(() => {
    fetchAnalyticsData()
  }, [period])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/analytics/hotel/${hotelId}?period=${period}`)
      const analyticsData = await response.json()
      
      if (response.ok) {
        setData(analyticsData.overview)
        
        // Set up monthly trends chart
        const monthlyData = {
          labels: analyticsData.monthlyTrends.map((item: any) => {
            const date = new Date(item.month + '-01')
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }),
          datasets: [
            {
              label: 'Reviews',
              data: analyticsData.monthlyTrends.map((item: any) => item.count),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
            },
            {
              label: 'Average Rating',
              data: analyticsData.monthlyTrends.map((item: any) => item.avgRating),
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              yAxisID: 'y1',
            }
          ]
        }
        setChartData(monthlyData)

        // Set up rating distribution chart
        const ratingData = {
          labels: analyticsData.ratingDistribution.map((item: any) => `${item.rating} Star${item.rating > 1 ? 's' : ''}`),
          datasets: [
            {
              data: analyticsData.ratingDistribution.map((item: any) => item.count),
              backgroundColor: [
                '#EF4444', // 1 star - red
                '#F97316', // 2 stars - orange
                '#EAB308', // 3 stars - yellow
                '#22C55E', // 4 stars - green
                '#10B981', // 5 stars - emerald
              ],
              borderWidth: 0,
            }
          ]
        }
        setRatingChartData(ratingData)
      } else {
        toast.error('Failed to fetch analytics data')
      }
    } catch (error) {
      toast.error('Error fetching analytics data')
    } finally {
      setLoading(false)
    }
  }

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
  }

  const ratingChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return 'pi pi-arrow-up'
    if (growth < 0) return 'pi pi-arrow-down'
    return 'pi pi-minus'
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
          <p className="text-gray-600">Track your guest feedback metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Dropdown
            value={period}
            onChange={(e) => setPeriod(e.value)}
            options={periodOptions}
            placeholder="Select Period"
          />
          <Button
            icon="pi pi-refresh"
            onClick={fetchAnalyticsData}
            loading={loading}
            tooltip="Refresh Data"
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="pi pi-star text-blue-600 text-xl"></i>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {data.totalReviews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Reviews</div>
          </div>
        </Card>

        <Card className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="pi pi-star-fill text-green-600 text-xl"></i>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {data.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </Card>

        <Card className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="pi pi-chart-line text-purple-600 text-xl"></i>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {data.reviewsThisMonth}
            </div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
        </Card>

        <Card className="dashboard-card">
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className={`pi ${getGrowthIcon(data.monthOverMonthGrowth)} text-orange-600 text-xl`}></i>
            </div>
            <div className={`text-3xl font-bold ${getGrowthColor(data.monthOverMonthGrowth)} mb-2`}>
              {data.monthOverMonthGrowth > 0 ? '+' : ''}{data.monthOverMonthGrowth}%
            </div>
            <div className="text-sm text-gray-600">Month over Month</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Trends</h3>
          <div className="h-64">
            <Chart type="line" data={chartData} options={chartOptions} />
          </div>
        </Card>

        <Card className="dashboard-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="h-64">
            <Chart type="doughnut" data={ratingChartData} options={ratingChartOptions} />
          </div>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
        <div className="space-y-4">
          {data.averageRating >= 4.5 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <i className="pi pi-check-circle text-green-600 text-xl mt-1"></i>
              <div>
                <h4 className="font-semibold text-green-800">Excellent Performance!</h4>
                <p className="text-green-700">
                  Your average rating of {data.averageRating.toFixed(1)} stars is outstanding. 
                  Consider encouraging guests to share their positive experiences on external platforms.
                </p>
              </div>
            </div>
          )}

          {data.averageRating < 3.5 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <i className="pi pi-exclamation-triangle text-yellow-600 text-xl mt-1"></i>
              <div>
                <h4 className="font-semibold text-yellow-800">Room for Improvement</h4>
                <p className="text-yellow-700">
                  Your average rating of {data.averageRating.toFixed(1)} stars suggests there are areas to improve. 
                  Focus on addressing common feedback themes to enhance guest satisfaction.
                </p>
              </div>
            </div>
          )}

          {data.monthOverMonthGrowth > 20 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <i className="pi pi-arrow-up text-blue-600 text-xl mt-1"></i>
              <div>
                <h4 className="font-semibold text-blue-800">Growing Engagement</h4>
                <p className="text-blue-700">
                  Great job! You've seen a {data.monthOverMonthGrowth}% increase in reviews this month. 
                  Keep up the momentum by continuing to encourage guest feedback.
                </p>
              </div>
            </div>
          )}

          {data.totalReviews < 10 && (
            <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <i className="pi pi-info-circle text-gray-600 text-xl mt-1"></i>
              <div>
                <h4 className="font-semibold text-gray-800">Build Your Review Base</h4>
                <p className="text-gray-700">
                  You have {data.totalReviews} reviews so far. Consider promoting your feedback system 
                  more actively to guests to build a stronger review foundation.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
