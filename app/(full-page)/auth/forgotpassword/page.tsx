"use client";
import type { Page } from "@/types/index";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useRef, ChangeEvent, KeyboardEvent } from "react";
import { Toast } from "primereact/toast";
import AuthFooter from "@/components/AuthFooter";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useI18n } from "@/i18n/TranslationProvider";
import Image from "next/image";

const ForgotPassword: Page = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [emailError, setEmailError] = useState("");
    const router = useRouter();
    const { t } = useI18n();
    const toast = useRef<Toast>(null);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setEmailError("");

        // Validate email
        const requiredMessage = t("auth.forgotPassword.validation.required");
        const invalidMessage = t("auth.forgotPassword.validation.invalid");

        if (!email) {
            setEmailError(requiredMessage);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: requiredMessage,
                life: 3000
            });
            return;
        }

        if (!validateEmail(email)) {
            setEmailError(invalidMessage);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: invalidMessage,
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
                    summary: t("common.success"),
                    detail: data.message || t("auth.forgotPassword.toasts.success"),
                    life: 5000
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: t("common.error"),
                    detail: data.error || t("auth.forgotPassword.toasts.error"),
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: t("auth.forgotPassword.toasts.unexpected"),
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) setEmailError("");
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    return (
        <div style={{ backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Toast ref={toast} />
            
            {/* Header */}
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
                <div>
                    <Image src="/images/logo-blue.png" alt="logo" width={100} height={90} />
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div className="ml-3">
                        <LanguageSelector className="w-full" />
                    </div>
                    <div className="hidden md:flex" style={{ gap: "1rem" }}>
                        <Button
                            label={t("common.getStarted")}
                            outlined
                            style={{
                                borderColor: "#1e3a5f",
                                color: "#1e3a5f"
                            }}
                            onClick={() => router.push('/register-hotel')}
                        />
                        <Button
                            label={t("common.login")}
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

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4">
                        <div className="text-[#1B2A49] text-2xl font-bold mb-3">
                            {t("auth.forgotPassword.title")}
                        </div>
                        <span className="text-600 font-thin" style={{ display: "block", lineHeight: "1.5" }}>
                            {submitted 
                                ? t("auth.forgotPassword.messages.instructions")
                                : t("auth.forgotPassword.description")
                            }
                        </span>
                    </div>
                    {!submitted ? (
                        <div className="flex flex-column">
                            <label htmlFor="email" className="text-900 font-medium mb-2">
                                {t("auth.forgotPassword.fields.email")}<span style={{ color: "red" }}>*</span>
                            </label>
                            <span className="p-input-icon-left w-full mb-1">
                                <InputText
                                    id="email"
                                    type="email"
                                    className={`w-full ${emailError ? 'p-invalid' : ''}`}
                                    placeholder={t("auth.forgotPassword.fields.emailPlaceholder")}
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
                                label={loading ? t("auth.forgotPassword.buttons.sending") : t("auth.forgotPassword.buttons.send")}
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
                                    {t("auth.forgotPassword.buttons.backToLogin")}
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-column">
                            <div className="mb-4">
                                <div className="text-[#1B2A49] text-2xl font-bold mb-3">
                                    {t("auth.forgotPassword.submitted.title")}
                                </div>
                                <p className="text-600" style={{ marginBottom: "0.5rem", lineHeight: "1.5" }}>
                                    {t("auth.forgotPassword.submitted.description").replace("{email}", email)}
                                </p>
                                <p className="text-600" style={{ lineHeight: "1.5" }}>
                                    {t("auth.forgotPassword.submitted.hint")}
                                </p>
                            </div>
                            <Button
                                label={t("auth.forgotPassword.buttons.resend")}
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
                                    {t("auth.forgotPassword.buttons.backToLogin")}
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
