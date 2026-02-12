"use client";
import React from "react";
import { Button } from "primereact/button";
import { useRouter } from "next/navigation";
import { LanguageSelector } from "./LanguageSelector";
import Image from "next/image";

const AuthHeader = () => {
    const router = useRouter();

    return (
        <div style={{ 
            padding: "1rem 2rem", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            position: "relative",
            zIndex: 1,
            backgroundColor: "white",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)"
        }}>
            <div 
                style={{ 
                    fontSize: "1.5rem", 
                    fontWeight: "600",
                    color: "#1e3a5f",
                    cursor: "pointer",
                    border: "none",
                    outline: "none"
                }}
                onClick={() => router.push('/')}
            >
              <Image src="/images/logo-blue.png" alt="logo" width={100} height={90} />
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                     {/* Language Selector */}
                     <div className="ml-3">
                        <LanguageSelector className="w-full" />
                    </div>
                <div className="hidden md:flex" style={{ gap: "1rem" }}>
                    <Button
                        label="Get Started"
                        outlined
                        style={{
                            borderColor: "#6F522F",
                            color: "#6F522F"
                        }}
                        onClick={() => router.push('/register-hotel')}
                    />
                    <Button
                        label="Login"
                        style={{
                            backgroundColor: "#1e3a5f",
                            border: "none",
                            color: "white"
                        }}
                        onClick={() => router.push('/auth/login')}
                    />
                </div>
            </div>
        </div>
    );
};

export default AuthHeader;

