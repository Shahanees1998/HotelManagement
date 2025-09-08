'use client'

import { Card } from 'primereact/card'

interface Stats {
  totalHotels: number
  activeHotels: number
  inactiveHotels: number
  totalUsers: number
  totalReviews: number
  totalRevenue: number
  monthlyRevenue: number
}

interface SuperAdminStatsProps {
  stats: Stats
}

export default function SuperAdminStats({ stats }: SuperAdminStatsProps) {
  const statCards = [
    {
      title: 'Total Hotels',
      value: stats.totalHotels,
      icon: 'pi pi-building',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Hotels',
      value: stats.activeHotels,
      icon: 'pi pi-check-circle',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: 'pi pi-dollar',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: 'pi pi-chart-line',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Reviews',
      value: stats.totalReviews,
      icon: 'pi pi-star',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="dashboard-card">
          <div className="text-center">
            <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <i className={`${stat.icon} ${stat.color} text-xl`}></i>
            </div>
            <div className={`text-3xl font-bold ${stat.color} mb-2`}>
              {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">
              {stat.title}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
