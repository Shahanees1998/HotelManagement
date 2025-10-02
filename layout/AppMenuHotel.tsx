import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const AppMenuHotel = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    if (!user) {
        return null;
    }
    
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
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
            to: "/hotel/dashboard",
        },
        
        // Feedback Forms
        {
            label: "Feedback Forms",
            icon: "pi pi-fw pi-file-edit",
            to: "/hotel/forms",
        },
        
        // QR Codes
        {
            label: "QR Codes",
            icon: "pi pi-fw pi-qrcode",
            to: "/hotel/qr-codes",
        },
        
        // All Reviews
        {
            label: "All Reviews",
            icon: "pi pi-fw pi-star",
            to: "/hotel/reviews",
        },
        
        // Contact Admin
        {
            label: "Contact Admin",
            icon: "pi pi-fw pi-envelope",
            to: "/hotel/support",
        },
        
        // Settings
        {
            label: "Settings",
            icon: "pi pi-fw pi-cog",
            items: [
                {
                    label: "User Profile",
                    icon: "pi pi-fw pi-user",
                    to: "/hotel/profile/user",
                },
                {
                    label: "Hotel Profile",
                    icon: "pi pi-fw pi-building",
                    to: "/hotel/profile",
                },
                {
                    label: "Change Password",
                    icon: "pi pi-fw pi-key",
                    to: "/hotel/profile/password",
                },
                {
                    label: "Subscriptions",
                    icon: "pi pi-fw pi-credit-card",
                    to: "/hotel/subscription",
                },
                {
                    label: "Payment Methods",
                    icon: "pi pi-fw pi-wallet",
                    to: "/hotel/payment-methods",
                },
            ],
        },
    ];

    const logoutModel: MenuModel[] = [
        // Logout
        {
            label: "Logout",
            icon: "pi pi-fw pi-sign-out",
            command: handleLogout,
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

export default AppMenuHotel;
