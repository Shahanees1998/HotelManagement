import Link from "next/link";
import { useContext } from "react";
import AppMenu from "./AppMenu";
import AppMenuHotel from "./AppMenuHotel";
import { LayoutContext } from "./context/layoutcontext";
import { MenuProvider } from "./context/menucontext";
import { LayoutState } from "../types/layout";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const AppSidebar = () => {
    const { setLayoutState } = useContext(LayoutContext);
    const { user } = useAuth();
    
    const anchor = () => {
        setLayoutState((prevLayoutState: LayoutState) => ({
            ...prevLayoutState,
            anchored: !prevLayoutState.anchored,
        }));
    };

    const isHotelUser = user?.role === "HOTEL";
    const dashboardPath = isHotelUser ? "/hotel/dashboard" : "/admin";
    const title = isHotelUser ? "Hotel" : "Admin";

    return (
        <>
            <div className="sidebar-header">
                <Link style={{display:'flex', alignItems: 'center' }} href={dashboardPath} className="app-logo flex items-center justify-content-center gap-3">
                    <Image 
                        src="/images/logo.png" 
                        alt="HOTEL Logo" 
                        width={100} 
                        height={100}
                        priority
                    />
                    <div style={{fontSize:'2rem'}}>|</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic' }}>{title}</div>
                </Link>
                <button
                    className="layout-sidebar-anchor p-link z-2 mb-2"
                    type="button"
                    onClick={anchor}
                ></button>
            </div>

            <div className="layout-menu-container">
                <MenuProvider>
                    {isHotelUser ? <AppMenuHotel /> : <AppMenu />}
                </MenuProvider>
            </div>
        </>
    );
};

export default AppSidebar;
