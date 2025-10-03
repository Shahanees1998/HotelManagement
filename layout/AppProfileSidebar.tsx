import { Badge } from "primereact/badge";
import { Sidebar } from "primereact/sidebar";
import { useContext, useState, useEffect } from "react";
import { LayoutContext } from "./context/layoutcontext";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Avatar } from "primereact/avatar";
import { Skeleton } from "primereact/skeleton";
import { apiClient } from "@/lib/apiClient";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        firstName: string;
        lastName: string;
        profileImage?: string;
    };
}

const AppProfileSidebar = () => {
    const { layoutState, setLayoutState } = useContext(LayoutContext);
    const { user, logout } = useAuth();
    const router = useRouter();
    
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    const onProfileSidebarHide = () => {
        setLayoutState((prevState) => ({
            ...prevState,
            profileSidebarVisible: false,
        }));
    };

    useEffect(() => {
        if (layoutState.profileSidebarVisible && user?.id) {
            loadSidebarData();
        }
    }, [layoutState.profileSidebarVisible, user?.id]);

    // Listen for notification updates
    useEffect(() => {
        const handleNotificationUpdate = () => {
            if (layoutState.profileSidebarVisible && user?.id) {
                loadSidebarData();
            }
        };

        window.addEventListener('notification-updated', handleNotificationUpdate);
        
        return () => {
            window.removeEventListener('notification-updated', handleNotificationUpdate);
        };
    }, [layoutState.profileSidebarVisible, user?.id]);

    const loadSidebarData = async () => {
        setLoading(true);
        try {
            // Load recent notifications using the correct endpoint
            const notificationsResponse = await fetch('/api/notifications?limit=3&status=unread', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (notificationsResponse.ok) {
                const data = await notificationsResponse.json();
                setNotifications(data.notifications || []);
            } else {
                console.error('Failed to load notifications:', notificationsResponse.statusText);
                setNotifications([]);
            }

            // Chat functionality removed - not relevant to hotel management system
            setMessages([]);
        } catch (error) {
            console.error('Error loading sidebar data:', error);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await logout();
        router.push('/auth/login');
    };

    const handleProfileClick = () => {
        // Redirect based on user role
        const profileRoute = user?.role === 'ADMIN' ? '/admin/profile' : '/hotel/profile';
        router.push(profileRoute);
        onProfileSidebarHide();
    };

    const handleSettingsClick = () => {
        // Redirect based on user role
        const settingsRoute = user?.role === 'ADMIN' ? '/admin/settings' : '/hotel/settings';
        router.push(settingsRoute);
        onProfileSidebarHide();
    };

    const handleNotificationClick = async (notificationId: string) => {
        try {
            // Mark as read using the correct API endpoint
            await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
        
        // Redirect based on user role
        const notificationsRoute = user?.role === 'ADMIN' ? '/admin/communications/notifications' : '/hotel/notifications';
        router.push(notificationsRoute);
        onProfileSidebarHide();
    };

    const handleMessageClick = () => {
        router.push('/admin/communications/chat');
        onProfileSidebarHide();
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'NEW_REVIEW': return 'pi-star';
            case 'REVIEW_APPROVED': return 'pi-check-circle';
            case 'REVIEW_REJECTED': return 'pi-times-circle';
            case 'SUBSCRIPTION_EXPIRING': return 'pi-exclamation-triangle';
            case 'SUBSCRIPTION_CANCELLED': return 'pi-ban';
            case 'ESCALATION_RECEIVED': return 'pi-question-circle';
            case 'ESCALATION_RESPONDED': return 'pi-reply';
            case 'SYSTEM_ALERT': return 'pi-exclamation-circle';
            case 'NEW_HOTEL_REGISTRATION': return 'pi-building';
            case 'NEW_FORM_CREATED': return 'pi-file-edit';
            case 'SUCCESS': return 'pi-check';
            case 'INFO': return 'pi-info-circle';
            case 'WARNING': return 'pi-exclamation-triangle';
            case 'ERROR': return 'pi-times';
            default: return 'pi-bell';
        }
    };

    return (
        <Sidebar
            visible={layoutState.profileSidebarVisible}
            onHide={onProfileSidebarHide}
            position="right"
            className="layout-profile-sidebar w-full sm:w-25rem"
        >
            <div className="flex flex-column mx-auto md:mx-0">
                <span className="mb-2 font-semibold">Welcome</span>
                <span className="text-color-secondary font-medium mb-5">
                    {user ? `${user.firstName}` : 'Admin User'}
                </span>

                <ul className="list-none m-0 p-0">
                    <li>
                        <button 
                            onClick={handleProfileClick}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-user text-xl text-primary" />
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    Profile
                                </span>
                                <p className="text-color-secondary m-0">
                                    Manage your account settings
                                </p>
                            </div>
                        </button>
                    </li>
                    {/* <li>
                        <button 
                            onClick={handleSettingsClick}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-cog text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    Settings
                                </span>
                                <p className="text-color-secondary m-0">
                                    Configure system preferences
                                </p>
                            </div>
                        </button>
                    </li> */}
                    <li>
                        <button 
                            onClick={handleSignOut}
                            className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                        >
                            <span>
                                <i className="pi pi-power-off text-xl text-primary"></i>
                            </span>
                            <div className="ml-3">
                                <span className="mb-2 font-semibold">
                                    Sign Out
                                </span>
                                <p className="text-color-secondary m-0">
                                    Logout from your account
                                </p>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>

            <div className="flex flex-column mt-5 mx-auto md:mx-0">
                <span className="mb-2 font-semibold">Recent Notifications</span>
                <span className="text-color-secondary font-medium mb-5">
                    {loading ? (
                        <Skeleton width="60%" height="1rem" />
                    ) : (
                        `You have ${notifications.length} unread notifications`
                    )}
                </span>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex align-items-center p-3 border-1 surface-border border-round">
                                <Skeleton shape="circle" size="2rem" className="mr-3" />
                                <div className="flex-1">
                                    <Skeleton width="80%" height="1rem" className="mb-2" />
                                    <Skeleton width="60%" height="0.8rem" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <ul className="list-none m-0 p-0">
                        {notifications.slice(0, 3).map((notification) => (
                            <li key={notification.id}>
                                <button 
                                    onClick={() => handleNotificationClick(notification.id)}
                                    className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                                >
                                    <span>
                                        <i className={`pi ${getNotificationIcon(notification.type)} text-xl text-primary`}></i>
                                    </span>
                                    <div className="ml-3 flex-1">
                                        <span className="mb-2 font-semibold block text-left">
                                            {notification.title}
                                        </span>
                                        <p className="text-color-secondary m-0 text-left">
                                            {formatRelativeTime(notification.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-3 text-color-secondary">
                        <i className="pi pi-bell text-2xl mb-2"></i>
                        <p className="m-0">No new notifications</p>
                    </div>
                )}
            </div>

            {/* <div className="flex flex-column mt-5 mx-auto md:mx-0">
                <span className="mb-2 font-semibold">Recent Messages</span>
                <span className="text-color-secondary font-medium mb-5">
                    {loading ? (
                        <Skeleton width="50%" height="1rem" />
                    ) : (
                        "Latest chat activity"
                    )}
                </span>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex align-items-center p-3 border-1 surface-border border-round">
                                <Skeleton shape="circle" size="2rem" className="mr-3" />
                                <div className="flex-1">
                                    <Skeleton width="70%" height="1rem" className="mb-2" />
                                    <Skeleton width="50%" height="0.8rem" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : messages.length > 0 ? (
                    <ul className="list-none m-0 p-0">
                        {messages.slice(0, 3).map((message) => (
                            <li key={message.id}>
                                <button 
                                    onClick={handleMessageClick}
                                    className="cursor-pointer flex surface-border mb-3 p-3 align-items-center border-1 surface-border border-round hover:surface-hover transition-colors transition-duration-150 w-full text-left"
                                >
                                    <span>
                                        {message.sender.profileImage ? (
                                            <img
                                                src={message.sender.profileImage}
                                                alt="Avatar"
                                                className="w-2rem h-2rem border-circle"
                                            />
                                        ) : (
                                            <Avatar 
                                                label={`${message.sender.firstName[0]}${message.sender.lastName[0]}`}
                                                size="normal"
                                                className="bg-primary"
                                            />
                                        )}
                                    </span>
                                    <div className="ml-3 flex-1">
                                        <span className="mb-2 font-semibold block text-left">
                                            {`${message.sender.firstName} ${message.sender.lastName}`}
                                        </span>
                                        <p className="text-color-secondary m-0 text-left">
                                            {formatRelativeTime(message.createdAt)}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center p-3 text-color-secondary">
                        <i className="pi pi-comments text-2xl mb-2"></i>
                        <p className="m-0">No recent messages</p>
                    </div>
                )}
            </div> */}
        </Sidebar>
    );
};

export default AppProfileSidebar;
