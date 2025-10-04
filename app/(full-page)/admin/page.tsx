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
                label: 'Registered Hotels',
                data: growthData.newHotels,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                tension: 0.4,
            },
            {
                label: 'Reviews',
                data: growthData.newReviews,
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                tension: 0.4,
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
        // {
        //     title: "View Subscriptions",
        //     description: "Monitor subscription status and billing",
        //     icon: "pi pi-credit-card",
        //     route: "/admin/subscriptions",
        //     color: "green",
        //     canAccess: true,
        // },
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
            icon: "pi pi-building",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-500",
            route: "/admin/hotels",
            canAccess: true,
        },
        // {
        //     value: stats.totalSubscribedHotels,
        //     label: "Subscribed Hotels",
        //     icon: "pi pi-check-circle",
        //     bgColor: "bg-green-50",
        //     iconColor: "text-green-500",
        //     route: "/admin/subscriptions",
        //     canAccess: true,
        // },
        {
            value: stats.totalReviews,
            label: "Total Reviews",
            icon: "pi pi-star",
            bgColor: "bg-orange-50",
            iconColor: "text-orange-500",
            route: "/admin/reviews",
            canAccess: true,
        },
        // {
        //     value: `$${stats.totalEarnings.toLocaleString()}`,
        //     label: "Total Earnings",
        //     icon: "pi pi-dollar",
        //     bgColor: "bg-purple-50",
        //     iconColor: "text-purple-500",
        //     route: "/admin/subscriptions",
        //     canAccess: true,
        // },
        {
            value: stats.pendingApprovals,
            label: "Pending Approvals",
            icon: "pi pi-clock",
            bgColor: "bg-yellow-50",
            iconColor: "text-yellow-600",
            route: "/admin/hotels",
            canAccess: true,
        },
        {
            value: stats.supportRequests,
            label: "Support Requests",
            icon: "pi pi-question-circle",
            bgColor: "bg-red-50",
            iconColor: "text-red-500",
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
                        <h1 className="text-3xl font-bold m-0 text-[#1B2A49]">Admin Dashboard</h1>
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
                            style={{ backgroundColor: '#1B2A49', borderColor: '#1B2A49' }}
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
                        <div className="col-12 md:col-6 lg:col-3" key={card.label}>
                            <div
                                className="cursor-pointer hover:shadow-2 transition-all border-round-lg"
                                onClick={() => router.push(card.route)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={e => { if (e.key === "Enter") router.push(card.route); }}
                                style={{
                                    border: 'none',
                                    boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
                                    backgroundColor: '#FFFFFF',
                                    padding: '0 !important'
                                }}
                            >
                                <div className="flex align-items-center" style={{ gap: '1.5rem', padding: '0.5rem' }}>
                                    <div className={`flex align-items-center justify-content-center ${card.bgColor} border-round-lg flex-shrink-0`} style={{ width: '60px', height: '60px' }}>
                                        <i className={`${card.icon} ${card.iconColor}`} style={{ fontSize: '1.75rem' }}></i>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-900 font-bold mb-2" style={{ fontSize: '1.2rem', lineHeight: '1.2', color: '#333333' }}>{card.value}</div>
                                        <div className="text-500" style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666666' }}>{card.label}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}



            {/* Charts and Activity */}
            <div className="col-12 mt-4">
                
                <Card title="System Growth" className="mt-4">
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


            {/* Quick Actions */}
            <div className="col-12 mt-4" style={{ backgroundColor: '#fcfaf7', borderRadius: '12px', marginTop: '2rem' }}>
                <div className="mb-4">
                    <h2 className="text-3xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>Quick Actions</h2>
                    <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
                        Respond faster to guest concerns, follow up on feedback, and resolve issues in just a few clicks.
                    </p>
                </div>
                <div className="grid">
                    {quickActions.map((action, index) => (
                        <div key={index} className="col-12 md:col-6 lg:col-3">
                            <div
                                className="cursor-pointer hover:shadow-lg transition-all border-round-lg"
                                onClick={() => router.push(action.route)}
                                role="button"
                                tabIndex={0}
                                onKeyPress={e => { if (e.key === "Enter") router.push(action.route); }}
                                style={{
                                    border: '1px solid #e0d8cc',
                                    boxShadow: 'none',
                                    backgroundColor: '#FFFFFF',
                                    padding: '0 !important'
                                }}
                            >
                                <div className="flex align-items-center" style={{ gap: '1rem', padding: '0.5rem' }}>
                                    <div
                                        className="flex align-items-center justify-content-center border-round-lg flex-shrink-0"
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            backgroundColor: '#f5f0e8'
                                        }}
                                    >
                                        <i
                                            className={`${action.icon}`}
                                            style={{
                                                fontSize: '1.5rem',
                                                color: '#8b5e3c'
                                            }}
                                        ></i>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold m-0" style={{ color: '#333333' }}>{action.title}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-12 mt-4">
                <div className="mb-4">
                    <h2 className="text-xl font-bold m-0 mb-2" style={{ color: '#1a2b48' }}>Recent Activity</h2>
                    <p className="text-lg m-0" style={{ color: '#4a4a4a', lineHeight: '1.5' }}>
                        Track your recent activities and updates.
                    </p>
                </div>
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
                    <DataTable value={recentActivity}>
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
                                <div>
                                    <div className="font-semibold">{rowData.description}</div>
                                    <div className="text-sm text-500">{rowData.user}</div>
                                </div>
                            )}
                        />
                        <Column
                            field="timestamp"
                            header="Time"
                            body={(rowData) => (
                                <div className="text-sm text-500">
                                    {formatRelativeTime(rowData.timestamp)}
                                </div>
                            )}
                        />
                    </DataTable>
                )}
            </div>
            <Toast ref={toast} />
        </div>
    );
} 
