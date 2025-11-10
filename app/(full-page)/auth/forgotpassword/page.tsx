"use client";
import type { Page } from "@/types/index";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useContext, useState, useRef } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import { Toast } from "primereact/toast";
import Image from "next/image";
import AuthFooter from "@/components/AuthFooter";
import { LanguageSelector } from "@/components/LanguageSelector";

const ForgotPassword: Page = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [emailError, setEmailError] = useState("");
    const router = useRouter();
    const { layoutConfig } = useContext(LayoutContext);
    const toast = useRef<Toast>(null);
    const dark = layoutConfig.colorScheme !== "light";

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setEmailError("");

        // Validate email
        if (!email) {
            setEmailError("Email is required");
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Please enter your email address',
                life: 3000
            });
            return;
        }

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Please enter a valid email address',
                life: 3000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitted(true);
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: data.message || 'Password reset email sent successfully',
                    life: 5000
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: data.error || 'Failed to send reset email',
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'An unexpected error occurred. Please try again.',
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) setEmailError("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    return (
        <div style={{ backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Toast ref={toast} />
            
            {/* Header */}
            <div style={{ 
                padding: "1.5rem 2rem", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                position: "relative",
                zIndex: 1,
                backgroundColor: "white",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)"
            }}>
                <div style={{ 
                    fontSize: "1.5rem", 
                    fontWeight: "600",
                    color: "#1e3a5f"
                }}>
                    C-Reviews
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                <li className="ml-3">
                        <LanguageSelector className="w-full" />
                    </li>
                    <Button
                        label="Get Started"
                        outlined
                        style={{
                            borderColor: "#1e3a5f",
                            color: "#1e3a5f"
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

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4">
                        <div className="text-[#1B2A49] text-2xl font-bold mb-3">
                            Forgot password?
                        </div>
                        <span className="text-600 font-thin" style={{ display: "block", lineHeight: "1.5" }}>
                            {submitted 
                                ? "Check your email for password reset instructions"
                                : "Enter the email of username associated with your account and we'll send an email with instructions to reset your password."
                            }
                        </span>
                    </div>
                    {!submitted ? (
                        <div className="flex flex-column">
                            <label htmlFor="email" className="text-900 font-medium mb-2">
                                Email Address<span style={{ color: "red" }}>*</span>
                            </label>
                            <span className="p-input-icon-left w-full mb-1">
                                <InputText
                                    id="email"
                                    type="email"
                                    className={`w-full ${emailError ? 'p-invalid' : ''}`}
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={handleEmailChange}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    autoFocus
                                />
                            </span>
                            {emailError && (
                                <small className="p-error block mb-3">{emailError}</small>
                            )}
                            <Button
                                label={loading ? "Sending..." : "Send Instructions"}
                                className="w-full"
                                style={{
                                    backgroundColor: "#1e3a5f",
                                    border: "none",
                                    padding: "0.75rem",
                                    marginTop: "1rem",
                                    marginBottom: "1rem"
                                }}
                                onClick={handleSubmit}
                                loading={loading}
                                disabled={loading}
                            />
                            <div className="text-center">
                                <a
                                    className="cursor-pointer"
                                    style={{ color: "#1e3a5f", fontWeight: 600, fontSize: "0.875rem" }}
                                    onClick={() => router.push("/auth/login")}
                                >
                                    Back to Login
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-column">
                            <div className="mb-4">
                                <div className="text-[#1B2A49] text-2xl font-bold mb-3">
                                    Check your email!
                                </div>
                                <p className="text-600" style={{ marginBottom: "0.5rem", lineHeight: "1.5" }}>
                                    We have sent an email with password reset link at{" "}
                                    <strong>{email}</strong>
                                </p>
                                <p className="text-600" style={{ lineHeight: "1.5" }}>
                                    Didn't receive the email? Please check your spam folder.
                                </p>
                            </div>
                            <Button
                                label="Resend Email"
                                className="w-full"
                                style={{
                                    backgroundColor: "#1e3a5f",
                                    border: "none",
                                    padding: "0.75rem",
                                    marginBottom: "1rem"
                                }}
                                onClick={async () => {
                                    setSubmitted(false);
                                    // Wait a moment for state to update, then resend
                                    setTimeout(() => {
                                        handleSubmit();
                                    }, 100);
                                }}
                            />
                            <div className="text-center">
                                <a
                                    className="cursor-pointer"
                                    style={{ color: "#6F522F", fontWeight: 600, fontSize: "0.875rem" }}
                                    onClick={() => router.push("/auth/login")}
                                >
                                    Back to Login
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

export default ForgotPassword;
