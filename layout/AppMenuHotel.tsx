import { useMemo } from "react";
import type { MenuModel } from "@/types/index";
import AppSubMenu from "./AppSubMenu";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/TranslationProvider";

const AppMenuHotel = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const { t } = useI18n();
    
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
    
    const mainMenuModel: MenuModel[] = useMemo(
        () => [
            {
                label: t("hotel.menu.dashboard"),
                icon: "pi pi-fw pi-th-large",
                to: "/hotel/dashboard",
            },
            {
                label: t("hotel.menu.feedbackForm"),
                icon: "pi pi-fw pi-file-edit",
                to: "/hotel/forms",
            },
            {
                label: t("hotel.menu.qrCodes"),
                icon: "pi pi-fw pi-qrcode",
                to: "/hotel/qr-codes",
            },
            {
                label: t("hotel.menu.allReviews"),
                icon: "pi pi-fw pi-star",
                to: "/hotel/reviews",
            },
            {
                label: t("hotel.menu.notifications"),
                icon: "pi pi-fw pi-bell",
                to: "/hotel/communications/notifications",
            },
            {
                label: t("hotel.menu.contactAdmin"),
                icon: "pi pi-fw pi-envelope",
                to: "/hotel/support",
            },
            {
                label: t("hotel.menu.settings"),
                icon: "pi pi-fw pi-cog",
                items: [
                    {
                        label: t("hotel.menu.settingsItems.userProfile"),
                        icon: "pi pi-fw pi-user",
                        to: "/hotel/profile/user",
                    },
                    {
                        label: t("hotel.menu.settingsItems.hotelProfile"),
                        icon: "pi pi-fw pi-building",
                        to: "/hotel/profile",
                    },
                    {
                        label: t("hotel.menu.settingsItems.changePassword"),
                        icon: "pi pi-fw pi-key",
                        to: "/hotel/profile/password",
                    },
                    {
                        label: t("hotel.menu.settingsItems.subscriptions"),
                        icon: "pi pi-fw pi-credit-card",
                        to: "/hotel/subscription",
                    },
                    {
                        label: t("hotel.menu.settingsItems.paymentMethods"),
                        icon: "pi pi-fw pi-wallet",
                        to: "/hotel/payment-methods",
                    },
                ],
            },
        ],
        [t]
    );

    return (
        <>
            <div style={{ flex: 1 }}>
                <AppSubMenu model={mainMenuModel} />
            </div>
            <div onClick={handleLogout} className="flex gap-2 text-white cursor-pointer" style={{ paddingLeft: '10px', marginTop: '20px' }}>
                <img src="/images/logout.svg" alt={t("common.logout")} style={{ width: '18px' }} />
                {t("common.logout")}
            </div>
        </>
    );
};

export default AppMenuHotel;
