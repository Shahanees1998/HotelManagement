'use client'

import { Card } from 'primereact/card'
import { Chart } from 'primereact/chart'
import { useEffect, useState } from 'react'

interface SubscriptionStat {
  subscriptionStatus: string
  _count: {
    subscriptionStatus: number
  }
}

interface SystemOverviewProps {
  subscriptionStats: SubscriptionStat[]
}

export default function SystemOverview({ subscriptionStats }: SystemOverviewProps) {
  const [chartData, setChartData] = useState({})
  const [chartOptions, setChartOptions] = useState({})

  useEffect(() => {
    const data = {
      labels: subscriptionStats.map(stat => 
        stat.subscriptionStatus.charAt(0).toUpperCase() + 
        stat.subscriptionStatus.slice(1).toLowerCase()
      ),
      datasets: [
        {
          data: subscriptionStats.map(stat => stat._count.subscriptionStatus),
          backgroundColor: [
            '#10B981', // Green for Active
            '#F59E0B', // Yellow for Inactive
            '#EF4444', // Red for Cancelled
            '#6B7280'  // Gray for Past Due
          ],
          borderWidth: 0
        }
      ]
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const
        }
      }
    }

    setChartData(data)
    setChartOptions(options)
  }, [subscriptionStats])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status</h3>
        <div className="h-64">
          <Chart type="doughnut" data={chartData} options={chartOptions} />
        </div>
      </Card>

      <Card className="dashboard-card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Database Status</span>
            <span className="text-sm font-medium text-green-600">Healthy</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">API Response Time</span>
            <span className="text-sm font-medium text-green-600">45ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Uptime</span>
            <span className="text-sm font-medium text-green-600">99.9%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Storage Usage</span>
            <span className="text-sm font-medium text-yellow-600">67%</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
