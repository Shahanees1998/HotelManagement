import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const AppMenu = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) {
        return null;
    }

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/auth/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const mainMenuModel: MenuModel[] = [
        // Dashboard
        {
            label: "Dashboard",
            icon: "pi pi-fw pi-th-large",
            to: "/admin",
        },

        // Hotel Management Dropdown
        {
            label: "Hotel Management",
            icon: "pi pi-fw pi-building",
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
                    label: "All Reviews",
                    icon: "pi pi-fw pi-star",
                    to: "/admin/reviews",
                },
                {
                    label: "Feedback Forms",
                    icon: "pi pi-fw pi-file-edit",
                    to: "/admin/forms",
                },
            ],
        },

        // Analytics
        // {
        //     label: "Analytics",
        //     icon: "pi pi-fw pi-chart-line",
        //     to: "/admin/analytics",
        // },

        // Subscriptions
        {
            label: "Subscriptions",
            icon: "pi pi-fw pi-credit-card",
            to: "/admin/subscriptions",
        },

        // Escalations
        // {
        //     label: "Escalations",
        //     icon: "pi pi-fw pi-exclamation-triangle",
        //     to: "/admin/escalations",
        // },

        // Support Tickets
        {
            label: "Support Tickets",
            icon: "pi pi-fw pi-question-circle",
            to: "/admin/support",
        },

        // Notifications
        {
            label: "Notifications",
            icon: "pi pi-fw pi-bell",
            to: "/admin/notifications",
        },

        // Settings
        {
            label: "Settings",
            icon: "pi pi-fw pi-cog",
            to: "/admin/settings",
        },

        // Announcements
        {
            label: "Announcements",
            icon: "pi pi-fw pi-megaphone",
            to: "/admin/announcements",
        },
    ];


    return (
        <>
            <div style={{ flex: 1 }}>
                <AppSubMenu model={mainMenuModel} />
            </div>
            <div onClick={handleLogout} className="flex gap-2 text-white cursor-pointer" style={{ paddingLeft: '10px', marginTop: '20px' }}>
                <img src="/images/logout.svg" alt="Logout" style={{ width: '18px' }} />
                Logout
            </div>
        </>
    );
};

export default AppMenu;
