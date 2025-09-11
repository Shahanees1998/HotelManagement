import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useAuth } from "@/hooks/useAuth";
import { canAccessSection } from "@/lib/rolePermissions";

const AppMenu = () => {
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
                    to: "/admin",
                },
   
            ],
        },
        
        // Hotel Management
        {
            label: "Hotel Management",
            icon: "pi pi-building",
            items: [
                {
                    label: "All Hotels",
                    icon: "pi pi-fw pi-building",
                    to: "/admin/hotels",
                },
                {
                    label: "Hotel Registrations",
                    icon: "pi pi-fw pi-user-plus",
                    to: "/admin/hotels/registrations",
                },
                {
                    label: "Subscriptions",
                    icon: "pi pi-fw pi-credit-card",
                    to: "/admin/subscriptions",
                },
            ],
        },
        
        // Reviews & Feedback
        {
            label: "Reviews & Feedback",
            icon: "pi pi-star",
            items: [
                {
                    label: "All Reviews",
                    icon: "pi pi-fw pi-star",
                    to: "/admin/reviews",
                },
                {
                    label: "Feedback Forms",
                    icon: "pi pi-fw pi-file-edit",
                    to: "/admin/forms",
                },
                {
                    label: "Form Templates",
                    icon: "pi pi-fw pi-file",
                    to: "/admin/templates",
                },
            ],
        },
        
        // Analytics & Reports
        {
            label: "Analytics",
            icon: "pi pi-chart-bar",
            items: [
                {
                    label: "System Overview",
                    icon: "pi pi-fw pi-chart-line",
                    to: "/admin/analytics",
                },
                {
                    label: "Hotel Performance",
                    icon: "pi pi-fw pi-chart-pie",
                    to: "/admin/analytics/hotels",
                },
                {
                    label: "Revenue Reports",
                    icon: "pi pi-fw pi-dollar",
                    to: "/admin/analytics/revenue",
                },
            ],
        },
        
        // Support & Escalations
        {
            label: "Support",
            icon: "pi pi-shield",
            items: [
                {
                    label: "Escalations",
                    icon: "pi pi-fw pi-exclamation-triangle",
                    to: "/admin/escalations",
                },
                {
                    label: "Support Tickets",
                    icon: "pi pi-fw pi-question-circle",
                    to: "/admin/support",
                },
                {
                    label: "Notifications",
                    icon: "pi pi-fw pi-bell",
                    to: "/admin/notifications",
                },
            ],
        },
        
        // System Management
        {
            label: "System",
            icon: "pi pi-cog",
            items: [
                {
                    label: "Settings",
                    icon: "pi pi-fw pi-cog",
                    to: "/admin/settings",
                },
                {
                    label: "Integrations",
                    icon: "pi pi-fw pi-plug",
                    to: "/admin/integrations",
                },
                {
                    label: "Announcements",
                    icon: "pi pi-fw pi-megaphone",
                    to: "/admin/announcements",
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
                    to: "/admin/profile/user",
                },
                {
                    label: "Change Password",
                    icon: "pi pi-fw pi-key",
                    to: "/admin/profile/password",
                },
                {
                    label: "Account Settings",
                    icon: "pi pi-fw pi-cog",
                    to: "/admin/profile/settings",
                },
            ],
        },
    ];

    return <AppSubMenu model={model} />;
};

export default AppMenu;
