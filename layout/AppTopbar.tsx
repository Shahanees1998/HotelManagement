'use client'

import type { AppTopbarRef } from "@/types/index";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from "react";
import AppBreadcrumb from "./AppBreadCrumb";
import { LayoutContext } from "./context/layoutcontext";
import { useAuth } from "@/hooks/useAuth";
import { Toast } from "primereact/toast";
import { apiClient } from "@/lib/apiClient";
import { getProfileImageUrl } from "@/lib/cloudinary-client";
import { Avatar } from "primereact/avatar";
import NotificationCenter from "@/components/NotificationCenter";
import { usePathname } from "next/navigation";
import { LanguageSelector } from "@/components/LanguageSelector";

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { onMenuToggle, showProfileSidebar, showConfigSidebar } =
        useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const [profile, setProfile] = useState<any | null>(null);
    const toast = useRef<Toast>(null);
    const pathname = usePathname();

    // Get page title from pathname
    const getPageTitle = () => {
        if (!pathname) return "Dashboard";
        
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        
        // Map route segments to readable titles
        const titleMap: Record<string, string> = {
            'admin': 'Admin Dashboard',
            'hotel': 'Hotel Dashboard',
            'hotels': 'Hotels',
            'forms': 'Forms',
            'users': 'Users',
            'reviews': 'Reviews',
            'support': 'Support',
            'subscriptions': 'Subscriptions',
            'templates': 'Templates',
            'notifications': 'Notifications',
            'escalations': 'Escalations',
            'communications': 'Communications',
            'announcements': 'Announcements',
            'analytics': 'Analytics',
            'registrations': 'Registrations',
            'dashboard': 'Dashboard',
            'profile': 'Profile',
            'settings': 'Settings',
            'qr-codes': 'QR Codes',
            'subscription': 'Subscription',
            'pending': 'Pending',
            'cards': 'Cards',
            'health': 'System Health',
            'integrations': 'Integrations',
            'stats': 'Statistics',
        };
        
        // Get the last meaningful segment
        if (titleMap[lastSegment]) {
            return titleMap[lastSegment];
        }
        
        // Check the second-to-last segment if last is a dynamic route
        if (segments.length > 1 && titleMap[segments[segments.length - 2]]) {
            return titleMap[segments[segments.length - 2]];
        }
        
        // Capitalize and format the segment
        return lastSegment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    useEffect(() => {
        if (user?.id) {
            loadProfile();
        }
    }, [user?.id, user?.profileImage]);

    // Update profile state when user data changes
    useEffect(() => {
        if (user) {
            setProfile(user);
        }
    }, [user]);

    // Listen for custom profile update events
    useEffect(() => {
        const handleProfileUpdate = () => {
            if (user?.id) {
                loadProfile();
            }
        };

        window.addEventListener('profile-updated', handleProfileUpdate);
        
        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, [user?.id]);

    const getUserInitials = () => {
        const firstName = profile?.firstName || user?.firstName;
        const lastName = profile?.lastName || user?.lastName;
        
        if (firstName && lastName) {
            return `${firstName[0]}${lastName[0]}`;
        }
        return 'U';
    };

    const loadProfile = async () => {
        if (!user?.id) return;
        try {
            const response = await apiClient.getCurrentUser();
            if (response.error) {
                throw new Error(response.error);
            }

            const userProfile = (response as any).user as any;
            if (userProfile) {
                setProfile(userProfile);
            }
        }
        catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    const onConfigButtonClick = () => {
        showConfigSidebar();
    };

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
    }));

    return (
        <div className="layout-topbar" style={{backgroundColor:'white', padding:'0'}}>
            <div className="topbar-start">
                <button
                    ref={menubuttonRef}
                    type="button"
                    className="topbar-menubutton p-link p-trigger"
                    onClick={onMenuToggle}
                >
                    <i className="pi pi-bars"></i>
                </button>
                <AppBreadcrumb className="topbar-breadcrumb"></AppBreadcrumb>
            </div>

            <div className="topbar-end">
                <ul className="topbar-menu">
                    {/* Language Selector */}
                    {!isAdmin && (
                        <li className="ml-3">
                            <LanguageSelector className="w-full" />
                        </li>
                    )}

                    {/* Notification Bell */}
                    <li className="ml-3">
                        <NotificationCenter />
                    </li>

                    {/* Profile Button */}
                    <li className="ml-3">
                        <button
                            type="button"
                            style={{
                                border: 'none',
                                cursor: 'pointer',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.25rem'
                            }}
                            onClick={showProfileSidebar}
                        >
                            <Avatar
                                image={profile?.profileImage || user?.profileImage}
                                label={getUserInitials()}
                                size="normal"
                                shape="circle"
                                className="bg-primary"
                            />
                            <span style={{ 
                                fontSize: '0.9375rem',
                                fontWeight: '500',
                                color: 'var(--text-color)'
                            }}>
                                {(profile?.firstName && profile?.lastName) || (user?.firstName && user?.lastName)
                                    ? `${profile?.firstName || user?.firstName}`
                                    : user?.email
                                }
                            </span>
                            <i className="pi pi-angle-down" style={{ fontSize: '0.875rem', color: 'var(--text-color)' }}></i>
                        </button>
                    </li>
                </ul>
            </div>

            <Toast ref={toast} />
        </div>
    );
});

AppTopbar.displayName = "AppTopbar";

export default AppTopbar;
