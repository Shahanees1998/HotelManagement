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
            to: "/hotel/settings",
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
            <div style={{ 
                marginTop: "auto", 
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                marginLeft: "1rem",
                marginRight: "1rem"
            }}>
                <AppSubMenu model={logoutModel} />
            </div>
        </>
    );
};

export default AppMenuHotel;
