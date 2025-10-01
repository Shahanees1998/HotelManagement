"use client";
import type { Page } from "@/types/index";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Password } from "primereact/password";
import { useContext } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";

const NewPassword: Page = () => {
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    const dark = layoutConfig.colorScheme !== "light";

    return (
        <div style={{ backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            
            {/* Header */}
            <AuthHeader />

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4">
                        <div className="text-900 text-xl font-bold mb-2">
                            New Password
                        </div>
                        <span className="text-600 font-medium">
                            Enter your new password
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-lock z-2"></i>
                            <Password
                                id="password"
                                className="w-full"
                                type="text"
                                inputClassName="w-full"
                                placeholder="Password"
                                toggleMask
                                inputStyle={{ paddingLeft: "2.5rem" }}
                            />
                        </span>
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-lock z-2"></i>
                            <Password
                                id="password2"
                                className="w-full"
                                type="text"
                                inputClassName="w-full"
                                placeholder="Repeat Password"
                                toggleMask
                                feedback={false}
                                inputStyle={{ paddingLeft: "2.5rem" }}
                            />
                        </span>
                        <div className="flex flex-wrap gap-2 justify-content-between">
                            <Button
                                label="Cancel"
                                outlined
                                className="flex-auto"
                                onClick={() => router.push("/")}
                            ></Button>
                            <Button
                                label="Submit"
                                className="flex-auto"
                                style={{
                                    backgroundColor: "#1e3a5f",
                                    border: "none"
                                }}
                                onClick={() => router.push("/")}
                            ></Button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

export default NewPassword;
