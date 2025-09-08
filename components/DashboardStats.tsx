'use client'

import { Card } from 'primereact/card'

interface Stats {
  totalReviews: number
  pendingReviews: number
  approvedReviews: number
  averageRating: number
  responseRate: number
}

interface DashboardStatsProps {
  stats: Stats
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Total Reviews',
      value: stats.totalReviews,
      icon: 'pi pi-star',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingReviews,
      icon: 'pi pi-clock',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Approved Reviews',
      value: stats.approvedReviews,
      icon: 'pi pi-check-circle',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      icon: 'pi pi-star-fill',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: 'pi pi-percentage',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
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
              {stat.value}
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
