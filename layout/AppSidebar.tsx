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

    return (
        <>
            <div className="sidebar-header" style={{ padding: "2rem 1.5rem", textAlign: 'center' }}>
                <Link 
                    href={dashboardPath} 
                    className="app-logo"
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'white',
                        textDecoration: 'none',
                        letterSpacing: '0.5px'
                    }}
                >
                    C-Reviews
                </Link>
                <button
                    className="layout-sidebar-anchor p-link z-2"
                    type="button"
                    onClick={anchor}
                    style={{ display: 'none' }}
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
