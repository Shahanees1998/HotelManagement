"use client";
import type { Page } from "@/types/index";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { Toast } from "primereact/toast";
import AuthFooter from "@/components/AuthFooter";
import { useI18n } from "@/i18n/TranslationProvider";

const ResetPasswordContent = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const [token, setToken] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useRef<Toast>(null);
    const { t } = useI18n();

    const validateToken = useCallback(async (resetToken: string) => {
        try {
            const response = await fetch('/api/auth/validate-reset-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: resetToken }),
            });

            if (response.ok) {
                setTokenValid(true);
            } else {
                const data = await response.json().catch(() => undefined);
                toast.current?.show({
                    severity: 'error',
                    summary: t("common.error"),
                    detail: data?.error || t("auth.resetPassword.toasts.invalidOrExpired"),
                    life: 4000
                });
                router.push('/auth/login');
            }
        } catch (error) {
            console.error('Token validation error:', error);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: t("auth.resetPassword.toasts.failedValidation"),
                life: 4000
            });
            router.push('/auth/login');
        }
    }, [router, t]);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
            validateToken(tokenParam);
        } else {
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: t("auth.resetPassword.toasts.invalidLink"),
                life: 3000
            });
            router.push('/auth/login');
        }
    }, [searchParams, validateToken, router, t]);

    const validatePassword = (password: string) => {
        if (password.length < 6) {
            return t("auth.resetPassword.errors.passwordMin");
        }
        if (password.length > 128) {
            return t("auth.resetPassword.errors.passwordMax");
        }
        return "";
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (passwordError) setPasswordError("");
        
        // Clear confirm password error if passwords now match
        if (confirmPassword && value === confirmPassword && confirmPasswordError) {
            setConfirmPasswordError("");
        }
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfirmPassword(value);
        if (confirmPasswordError) setConfirmPasswordError("");
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setPasswordError("");
        setConfirmPasswordError("");

        // Validate password
        const passwordValidation = validatePassword(password);
        if (passwordValidation) {
            setPasswordError(passwordValidation);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: passwordValidation,
                life: 4000
            });
            return;
        }

        // Validate confirm password
        if (!confirmPassword) {
            const message = t("auth.resetPassword.errors.confirmRequired");
            setConfirmPasswordError(message);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: message,
                life: 4000
            });
            return;
        }

        if (password !== confirmPassword) {
            const message = t("auth.resetPassword.errors.mismatch");
            setConfirmPasswordError(message);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: message,
                life: 4000
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    token,
                    password 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: t("common.success"),
                    detail: t("auth.resetPassword.toasts.success"),
                    life: 5000
                });
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: t("common.error"),
                    detail: data.error || t("auth.resetPassword.toasts.failure"),
                    life: 4000
                });
            }
        } catch (error) {
            console.error('Reset password error:', error);
            toast.current?.show({
                severity: 'error',
                summary: t("common.error"),
                detail: t("auth.resetPassword.toasts.unexpected"),
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    if (!tokenValid) {
        return (
            <div className="px-5 min-h-screen flex justify-content-center align-items-center">
                <div className="text-center">
                    <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
                    <p>{t("auth.resetPassword.states.validating")}</p>
                </div>
            </div>
        );
    }

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

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4">
                        <div className="text-[#1B2A49] text-2xl font-bold mb-3">
                            {t("auth.resetPassword.title")}
                        </div>
                        <span className="text-600 font-thin" style={{ display: "block", lineHeight: "1.5" }}>
                            {t("auth.resetPassword.subtitle")}
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <label htmlFor="password" className="text-900 font-medium mb-2">
                            {t("auth.resetPassword.fields.newPassword")}<span style={{ color: "red" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }} className="w-full mb-1">
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-lock"></i>
                                <InputText
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full ${passwordError ? 'p-invalid' : ''}`}
                                    placeholder={t("auth.resetPassword.placeholders.password")}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    style={{ paddingRight: "2.5rem" }}
                                />
                            </span>
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword((v) => !v)}
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    zIndex: 2,
                                }}
                                aria-label={showPassword ? t("auth.resetPassword.accessibility.hidePassword") : t("auth.resetPassword.accessibility.showPassword")}
                            >
                                <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}></i>
                            </button>
                        </div>
                        {passwordError && (
                            <small className="p-error block mb-3">{passwordError}</small>
                        )}
                        
                        <label htmlFor="confirmPassword" className="text-900 font-medium mb-2 mt-3">
                            {t("auth.resetPassword.fields.confirmPassword")}<span style={{ color: "red" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }} className="w-full mb-1">
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-lock"></i>
                                <InputText
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`w-full ${confirmPasswordError ? 'p-invalid' : ''}`}
                                    placeholder={t("auth.resetPassword.placeholders.confirmPassword")}
                                    value={confirmPassword}
                                    onChange={handleConfirmPasswordChange}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                    style={{ paddingRight: "2.5rem" }}
                                />
                            </span>
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                style={{
                                    position: "absolute",
                                    right: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                    zIndex: 2,
                                }}
                                aria-label={showConfirmPassword ? t("auth.resetPassword.accessibility.hidePassword") : t("auth.resetPassword.accessibility.showPassword")}
                            >
                                <i className={`pi ${showConfirmPassword ? "pi-eye-slash" : "pi-eye"}`}></i>
                            </button>
                        </div>
                        {confirmPasswordError && (
                            <small className="p-error block mb-3">{confirmPasswordError}</small>
                        )}
                        
                        <Button
                            label={loading ? t("auth.resetPassword.buttons.resetting") : t("auth.resetPassword.buttons.reset")}
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
                                style={{ color: "#6F522F", fontWeight: 600, fontSize: "0.875rem" }}
                                onClick={() => router.push("/auth/login")}
                            >
                                {t("auth.resetPassword.link.backToLogin")}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

const ResetPassword: Page = () => {
    const { t } = useI18n();
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-content-center align-items-center">
                <div className="text-center">
                    <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
                    <p>{t("auth.resetPassword.states.loading")}</p>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPassword; 
