import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useAuth } from "@/hooks/useAuth";

const AppMenuHotel = () => {
    const { user } = useAuth();
    
    if (!user) {
        return null;
    }
    
    const model: MenuModel[] = [
        // Dashboard
        {
            label: "Dashboard",
            icon: "pi pi-home",
            items: [
                {
                    label: "Overview",
                    icon: "pi pi-fw pi-home",
                    to: "/hotel/dashboard",
                },
                {
                    label: "Quick Stats",
                    icon: "pi pi-fw pi-chart-line",
                    to: "/hotel/dashboard/stats",
                },
                {
                    label: "Recent Activity",
                    icon: "pi pi-fw pi-clock",
                    to: "/hotel/dashboard/activity",
                },
            ],
        },
        
        // Feedback Management
        {
            label: "Feedback Management",
            icon: "pi pi-comments",
            items: [
                {
                    label: "All Reviews",
                    icon: "pi pi-fw pi-star",
                    to: "/hotel/reviews",
                },
                {
                    label: "Feedback Forms",
                    icon: "pi pi-fw pi-file-edit",
                    to: "/hotel/forms",
                },
                {
                    label: "QR Codes",
                    icon: "pi pi-fw pi-qrcode",
                    to: "/hotel/qr-codes",
                },
            ],
        },
        
        // Analytics & Reports
        {
            label: "Analytics",
            icon: "pi pi-chart-bar",
            items: [
                {
                    label: "Overview",
                    icon: "pi pi-fw pi-chart-line",
                    to: "/hotel/analytics",
                },
                // {
                //     label: "Satisfaction Trends",
                //     icon: "pi pi-fw pi-chart-pie",
                //     to: "/hotel/analytics/satisfaction",
                // },
                // {
                //     label: "Response Rates",
                //     icon: "pi pi-fw pi-chart-bar",
                //     to: "/hotel/analytics/response-rates",
                // },
            ],
        },
        
        // Hotel Settings
        {
            label: "Hotel Settings",
            icon: "pi pi-cog",
            items: [
                {
                    label: "Hotel Profile",
                    icon: "pi pi-fw pi-building",
                    to: "/hotel/profile",
                },
                {
                    label: "Subscription",
                    icon: "pi pi-fw pi-credit-card",
                    to: "/hotel/subscription",
                }
            ],
        },
        
        // Support
        {
            label: "Support",
            icon: "pi pi-question-circle",
            items: [
                {
                    label: "Contact Admin",
                    icon: "pi pi-fw pi-envelope",
                    to: "/hotel/support",
                },
            ],
        },
        
        // Profile
        {
            label: "Profile",
            icon: "pi pi-user",
            items: [
                {
                    label: "Personal Info",
                    icon: "pi pi-fw pi-user",
                    to: "/hotel/profile/user",
                },
                {
                    label: "Change Password",
                    icon: "pi pi-fw pi-key",
                    to: "/hotel/profile/password",
                },
                {
                    label: "Account Settings",
                    icon: "pi pi-fw pi-cog",
                    to: "/hotel/profile/settings",
                },
            ],
        },
    ];

    return <AppSubMenu model={model} />;
};

export default AppMenuHotel;
