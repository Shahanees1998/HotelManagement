"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";

interface ActivityItem {
  id: string;
  type: 'review' | 'form' | 'qr' | 'subscription';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export default function DashboardActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadActivityData();
  }, []);

  const loadActivityData = async () => {
    setLoading(true);
    try {
      // Load recent reviews as activities
      const reviewsResponse = await fetch('/api/hotel/reviews');
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const recentReviews = reviewsData.data?.slice(0, 5) || [];
        
        const activities: ActivityItem[] = recentReviews.map((review: any) => ({
          id: review.id,
          type: 'review',
          title: 'New Review Received',
          description: `${review.overallRating}-star review from ${review.guestName}`,
          timestamp: formatRelativeTime(review.submittedAt),
          status: review.overallRating >= 4 ? 'success' : review.overallRating >= 3 ? 'info' : 'warning'
        }));

        setActivities(activities);
        
        // Calculate summary
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const todayCount = recentReviews.filter((r: any) => new Date(r.submittedAt) >= today).length;
        const weekCount = recentReviews.filter((r: any) => new Date(r.submittedAt) >= weekAgo).length;
        const monthCount = recentReviews.filter((r: any) => new Date(r.submittedAt) >= monthAgo).length;

        setSummary({
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount,
        });
      }
    } catch (error) {
      console.error("Error loading activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return time.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'review': return 'pi pi-star';
      case 'form': return 'pi pi-file-edit';
      case 'qr': return 'pi pi-qrcode';
      case 'subscription': return 'pi pi-credit-card';
      default: return 'pi pi-info-circle';
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="text-center p-4">
            <i className="pi pi-spinner pi-spin text-2xl"></i>
            <p className="mt-2">Loading activity...</p>
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
            <h1 className="text-3xl font-bold m-0">Recent Activity</h1>
            <p className="text-600 mt-2 mb-0">Track your hotel's recent activities and updates.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              className="p-button-outlined"
              onClick={loadActivityData}
            />
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="col-12 lg:col-8">
        <Card title="Activity Feed" className="mb-4">
          <div className="flex flex-column gap-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex align-items-start gap-3 p-3 border-1 surface-border border-round">
                <div className="flex-shrink-0">
                  <i className={`${getActivityIcon(activity.type)} text-xl text-blue-500`}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="flex align-items-center gap-2 mb-1">
                    <h6 className="m-0">{activity.title}</h6>
                    <Tag 
                      value={activity.status} 
                      severity={getStatusSeverity(activity.status)}
                      className="text-xs"
                    />
                  </div>
                  <p className="text-600 text-sm m-0 mb-2">{activity.description}</p>
                  <span className="text-500 text-xs">{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="col-12 lg:col-4">
        <Card title="Activity Summary" className="mb-4">
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between align-items-center">
              <span className="text-600">Today</span>
              <span className="font-semibold">{summary.today} activities</span>
            </div>
            <div className="flex justify-content-between align-items-center">
              <span className="text-600">This Week</span>
              <span className="font-semibold">{summary.thisWeek} activities</span>
            </div>
            <div className="flex justify-content-between align-items-center">
              <span className="text-600">This Month</span>
              <span className="font-semibold">{summary.thisMonth} activities</span>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="flex flex-column gap-2">
            <Button
              label="View All Reviews"
              icon="pi pi-star"
              className="p-button-outlined"
              onClick={() => window.location.href = '/hotel/reviews'}
            />
            <Button
              label="Create New Form"
              icon="pi pi-plus"
              className="p-button-outlined"
              onClick={() => window.location.href = '/hotel/forms'}
            />
            <Button
              label="Generate QR Code"
              icon="pi pi-qrcode"
              className="p-button-outlined"
              onClick={() => window.location.href = '/hotel/qr-codes'}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
