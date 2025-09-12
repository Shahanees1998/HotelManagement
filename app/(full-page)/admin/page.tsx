"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import ChartWrapper from "@/components/ChartWrapper";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/hooks/useAuth";
import { canAccessSection, getDefaultRedirectPath } from "@/lib/rolePermissions";

interface DashboardStats {
  totalHotels: number;
  totalSubscribedHotels: number;
  totalReviews: number;
  totalEarnings: number;
  pendingApprovals: number;
  supportRequests: number;
}

interface RecentActivity {
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: string;
    status?: string;
    startDate?: string;
}

interface GrowthData {
  labels: string[];
  newHotels: number[];
  newReviews: number[];
  earnings: number[];
}

export default function AdminDashboard() {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalHotels: 0,
        totalSubscribedHotels: 0,
        totalReviews: 0,
        totalEarnings: 0,
        pendingApprovals: 0,
        supportRequests: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [growthData, setGrowthData] = useState<GrowthData>({
        labels: [],
        newHotels: [],
        newReviews: [],
        earnings: []
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        if (user) {
            // Redirect non-admin users to their allowed section
            if (!canAccessSection(user.role, 'canAccessAll')) {
                const redirectPath = getDefaultRedirectPath(user.role);
                router.push(redirectPath);
                return;
            }
            loadDashboardData();
        }
    }, [user, router]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getDashboard();
            if (response.error) {
                throw new Error(response.error);
            }

            if ((response as any)?.stats) {
                setStats((response as any).stats);
                setRecentActivity((response as any).recentActivity);
                setGrowthData((response as any).growthData);
                setLastUpdated(new Date());
                console.log('Data set successfully');
            } else {
                console.log('No stats data in response:', response);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
            showToast("error", "Error", "Failed to load dashboard data");
            // Set fallback data structure
            setStats({
                totalHotels: 0,
                totalSubscribedHotels: 0,
                totalReviews: 0,
                totalEarnings: 0,
                pendingApprovals: 0,
                supportRequests: 0
            });
            setRecentActivity([]);
            setGrowthData({
                labels: [],
                newHotels: [],
                newReviews: [],
                earnings: []
            });
        } finally {
            setLoading(false);
        }
    };

    const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const formatRelativeTime = (timestamp: string) => {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds}s ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    };

    const chartData = {
        labels: growthData.labels,
        datasets: [
            {
                label: 'New Hotels',
                data: growthData.newHotels,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
            },
            {
                label: 'New Reviews',
                data: growthData.newReviews,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Earnings ($)',
                data: growthData.earnings,
                borderColor: '#FF9800',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                tension: 0.4,
                yAxisID: 'y1',
            },
        ],
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

    const getActivityTypeSeverity = (type: string) => {
        switch (type) {
            case "USER_REGISTRATION": return "success";
            case "SUPPORT_REQUEST": return "warning";
            default: return "info";
        }
    };

    const getActivityTypeLabel = (type: string) => {
        switch (type) {
            case "USER_REGISTRATION": return "Registration";
            case "SUPPORT_REQUEST": return "Support";
            default: return type;
        }
    };

    // Show loading state while checking auth
    if (authLoading) {
        return (
            <div className="flex align-items-center justify-content-center min-h-screen">
                <div className="text-center">
                    <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect if not authenticated or not admin
    if (!user || !canAccessSection(user.role, 'canAccessAll')) {
        return null; // Will redirect in useEffect
    }

    const quickActions = [
        {
            title: "Manage Hotels",
            description: "View and manage all hotel accounts",
            icon: "pi pi-building",
            route: "/admin/hotels",
            color: "blue",
            canAccess: true,
        },
        {
            title: "View Subscriptions",
            description: "Monitor subscription status and billing",
            icon: "pi pi-credit-card",
            route: "/admin/subscriptions",
            color: "green",
            canAccess: true,
        },
        {
            title: "All Reviews",
            description: "Monitor all guest reviews across hotels",
            icon: "pi pi-star",
            route: "/admin/reviews",
            color: "orange",
            canAccess: true,
        },
        {
            title: "Support Requests",
            description: "Handle hotel support and inquiries",
            icon: "pi pi-question-circle",
            route: "/admin/support",
            color: "red",
            canAccess: true,
        },
    ];

    console.log('Current stats state:', stats);
    console.log('Current loading state:', loading);
    
    const cardData = [
        {
            value: stats.totalHotels,
            label: "Total Hotels",
            color: "text-blue-500",
            route: "/admin/hotels",
            canAccess: true,
        },
        {
            value: stats.totalSubscribedHotels,
            label: "Subscribed Hotels",
            color: "text-green-500",
            route: "/admin/subscriptions",
            canAccess: true,
        },
        {
            value: stats.totalReviews,
            label: "Total Reviews",
            color: "text-orange-500",
            route: "/admin/reviews",
            canAccess: true,
        },
        {
            value: `$${stats.totalEarnings.toLocaleString()}`,
            label: "Total Earnings",
            color: "text-purple-500",
            route: "/admin/subscriptions",
            canAccess: true,
        },
        {
            value: stats.pendingApprovals,
            label: "Pending Approvals",
            color: "text-yellow-500",
            route: "/admin/hotels",
            canAccess: true,
        },
        {
            value: stats.supportRequests,
            label: "Support Requests",
            color: "text-red-500",
            route: "/admin/support",
            canAccess: true,
        },
    ];

    return (
        <div className="grid">
            {/* Header */}
            <div className="col-12">
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold m-0">Admin Dashboard</h1>
                        <p className="text-600 mt-2 mb-0">Welcome back! Here's what's happening with your organization.</p>
                        <p className="text-sm text-gray-500 mt-1 mb-0">
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })} • {new Date().toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                            {lastUpdated && (
                                <span className="ml-3">
                                    • Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                    })}
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="Refresh"
                            icon="pi pi-refresh"
                            onClick={loadDashboardData}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            {loading ? (
                // Loading skeleton for stats cards
                <>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="col-12 md:col-6 lg:col-4">
                            <Card className="text-center">
                                <div className="text-3xl font-bold text-gray-300 animate-pulse">--</div>
                                <div className="text-600 animate-pulse">Loading...</div>
                            </Card>
                        </div>
                    ))}
                </>
            ) : (
                <>
                    {cardData.map((card) => (
                        <div className="col-12 md:col-6 lg:col-4" key={card.label}>
                            <Card
                                style={{ height: "150px" }}
                                className="text-center cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => router.push(card.route)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={e => { if (e.key === "Enter") router.push(card.route); }}
                            >
                                <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                                <div className="text-600">{card.label}</div>
                            </Card>
                        </div>
                    ))}
                </>
            )}

            {/* Quick Actions */}
            <div className="col-12">
                <Card title="Quick Actions" className="mt-4">
                    <div className="grid">
                        {quickActions.map((action, index) => (
                            <div key={index} className="col-12 md:col-6 lg:col-4">
                                <Card style={{height : '120px'}} className="cursor-pointer hover:shadow-lg transition-shadow">
                                    <div className="flex align-items-center justify-content-between h-full">
                                        <div 
                                            className="flex align-items-center gap-3 flex-1 cursor-pointer"
                                            onClick={() => router.push(action.route)}
                                        >
                                            <i className={`${action.icon} text-2xl text-${action.color}-500`}></i>
                                            <div>
                                                <h3 className="text-lg font-semibold m-0">{action.title}</h3>
                                                <p className="text-600 text-sm m-0">{action.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Charts and Activity */}
            <div className="col-12 lg:col-8">
                <Card title="System Growth & Revenue" className="mt-4">
                    {loading ? (
                        <div className="flex align-items-center justify-content-center" style={{ height: '300px' }}>
                            <div className="text-600">Loading chart data...</div>
                        </div>
                    ) : growthData.newHotels.every(val => val === 0) ? (
                        <div className="flex align-items-center justify-content-center flex-column" style={{ height: '300px' }}>
                            <i className="pi pi-chart-line text-4xl text-gray-400 mb-3"></i>
                            <div className="text-600 text-center">No growth data available</div>
                            <div className="text-sm text-gray-500 text-center">Growth data will appear here as hotels register and reviews are submitted</div>
                        </div>
                    ) : (
                        <ChartWrapper type="line" data={chartData} options={chartOptions} style={{ height: '300px' }} />
                    )}
                </Card>
            </div>

            <div className="col-12 lg:col-4">
                <Card title="Recent Activity" className="mt-4">
                    {loading ? (
                        <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
                            <div className="text-600">Loading activity...</div>
                        </div>
                    ) : recentActivity.length === 0 ? (
                        <div className="flex align-items-center justify-content-center flex-column" style={{ height: '200px' }}>
                            <i className="pi pi-info-circle text-4xl text-gray-400 mb-3"></i>
                            <div className="text-600 text-center">No recent activity</div>
                            <div className="text-sm text-gray-500 text-center">Activities will appear here as they occur</div>
                        </div>
                    ) : (
                        <DataTable value={recentActivity} showGridlines>
                            <Column 
                                field="type" 
                                header="Type" 
                                body={(rowData) => (
                                    <Tag 
                                        value={getActivityTypeLabel(rowData.type)} 
                                        severity={getActivityTypeSeverity(rowData.type)} 
                                    />
                                )}
                            />
                            <Column 
                                field="description" 
                                header="Description" 
                                body={(rowData) => (
                                    <div className="text-sm">
                                        <div className="font-semibold">{rowData.description}</div>
                                        <div className="text-600">{rowData.user}</div>
                                    </div>
                                )}
                            />
                            <Column 
                                field="timestamp" 
                                header="Time" 
                                body={(rowData) => (
                                    <div className="text-xs text-600">
                                        {formatRelativeTime(rowData.timestamp)}
                                    </div>
                                )}
                            />
                        </DataTable>
                    )}
                </Card>
            </div>

            <Toast ref={toast} />
        </div>
    );
} 