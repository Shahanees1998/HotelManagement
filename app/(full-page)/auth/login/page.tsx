"use client";
import type { Page } from "@/types/index";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { useContext, useState, Suspense, useEffect } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import { useAuth } from "@/hooks/useAuth";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { getDefaultRedirectPath } from "@/lib/rolePermissions";
import Image from "next/image";
import AuthFooter from "@/components/AuthFooter";
import { useI18n } from "@/i18n/TranslationProvider";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AUTH_LOGO_SRC } from "@/lib/constants";

const LoginContent = () => {
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendingVerification, setResendingVerification] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { layoutConfig } = useContext(LayoutContext);
    const { user, login, loading: authLoading } = useAuth();
    const toast = useRef<Toast>(null);
    const toastShownRef = useRef<string | null>(null); // Track which toast was shown
    const dark = layoutConfig.colorScheme !== "light";
    const [showPassword, setShowPassword] = useState(false);
    const { t, setLocale } = useI18n();

    // Check URL params for verification messages
    useEffect(() => {
        const message = searchParams.get('message');
        const error = searchParams.get('error');
        const toastKey = message || error; // Create a unique key for this toast
        
        // Prevent duplicate toasts
        if (!toastKey || toastShownRef.current === toastKey) {
            return;
        }
        
        // Mark this toast as shown
        toastShownRef.current = toastKey;
        
        if (message === 'email_verified') {
            toast.current?.show({
                severity: 'success',
                summary: t('Email Verified'),
                detail: t('Your email has been verified. You can now log in.'),
                life: 5000
            });
        } else if (message === 'already_verified') {
            toast.current?.show({
                severity: 'info',
                summary: t('Already Verified'),
                detail: t('Your email is already verified. You can log in now.'),
                life: 5000
            });
        } else if (error === 'invalid_or_expired_token') {
            toast.current?.show({
                severity: 'error',
                summary: t('Invalid Token'),
                detail: t('The verification link is invalid or has expired. Please request a new one.'),
                life: 5000
            });
        }
    }, [searchParams, t]);

    // Redirect if already logged in
    if (user) {
        const callbackUrl = searchParams.get('callbackUrl') || getDefaultRedirectPath(user.role);
        router.push(callbackUrl);
        return null;
    }

    const handleLogin = async () => {
        // Clear previous errors
        setEmailError("");
        setPasswordError("");

        // Validate inputs
        let hasError = false;
        if (!email) {
            setEmailError(t("Email is required"));
            hasError = true;
        } else if (!email.includes('@')) {
            setEmailError(t("Please enter a valid email address"));
            hasError = true;
        }

        if (!password) {
            setPasswordError(t("Password is required"));
            hasError = true;
        }

        if (hasError) {
            return;
        }

        setLoading(true);
        setRequiresVerification(false);
        try {
            // First try direct API call to check for verification errors
            const apiResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const apiData = await apiResponse.json();

            // Check if email verification is required
            if (!apiResponse.ok && apiData.requiresVerification) {
                setRequiresVerification(true);
                setVerificationEmail(email);
                toast.current?.show({
                    severity: 'warn',
                    summary: t('Email Verification Required'),
                    detail: apiData.error || t('Please verify your email address before logging in. Check your inbox for the verification email.'),
                    life: 6000
                });
                setLoading(false);
                return;
            }

            // If API call failed with other error, throw it
            if (!apiResponse.ok) {
                throw new Error(apiData.error || 'Login failed');
            }

            // If API call succeeded, use NextAuth login
            const loggedInUser = await login(email, password);

            if (loggedInUser?.role === "ADMIN") {
                if (typeof window !== "undefined") {
                    window.localStorage.removeItem("hotel-management-locale");
                }
                setLocale("en");
            }

            const callbackUrl = searchParams.get('callbackUrl') || getDefaultRedirectPath(loggedInUser.role);
            router.push(callbackUrl);
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = t('An unexpected error occurred. Please try again.');

            if (error instanceof Error) {
                errorMessage = error.message;
                if (error.message === 'Invalid email or password') {
                    setPasswordError(t('Invalid email or password'));
                } else if (error.message === 'No account found with this email address') {
                    setEmailError(t('No account found with this email address'));
                } else if (error.message === 'Incorrect password') {
                    setPasswordError(t('Incorrect password'));
                } else if (error.message === 'Account is not active. Please contact admin.') {
                    errorMessage = t('Account is not active. Please contact admin.');
                }
            }

            toast.current?.show({
                severity: 'error',
                summary: t('Login Failed'),
                detail: errorMessage,
                life: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!verificationEmail) return;
        
        setResendingVerification(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: verificationEmail }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                toast.current?.show({
                    severity: 'success',
                    summary: t('Email Sent'),
                    detail: data.message || t('Verification email has been sent. Please check your inbox.'),
                    life: 5000
                });
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: t('Error'),
                    detail: data.error || t('Failed to send verification email. Please try again.'),
                    life: 5000
                });
            }
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: t('Error'),
                detail: t('Failed to send verification email. Please try again.'),
                life: 5000
            });
        } finally {
            setResendingVerification(false);
        }
    };

    return (
        <div style={{backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
                    <Image src={AUTH_LOGO_SRC} alt="logo" width={100} height={90}/>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div className="ml-3">
                        <LanguageSelector className="w-full" />
                    </div>
                    <div className="hidden md:flex" style={{ gap: "1rem" }}>
                        <Button
                            label={t("Get Started")}
                            outlined
                            style={{
                                borderColor: "#6F522F",
                                color: "#6F522F"
                            }}
                            onClick={() => router.push('/register-hotel')}
                        />
                        <Button
                            label={t("Login")}
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
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1 animate-fade-in" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4 animate-slide-in-left">
                        <div className="text-[#1B2A49] text-3xl font-bold mb-2 flex align-items-center gap-2">
                            {t("Welcome back!")}
                        </div>
                        <span className="text-600 font-thin flex align-items-center gap-2">
                            {t("Thank you for getting back to C-Reviews, the easiest way for hotels to collect and improve through guest feedback.")}
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <label htmlFor="email" className="text-900 font-medium mb-2 flex align-items-center gap-2">
                            {t("Email Address")}<span style={{ color: "red" }}>*</span>
                        </label>
                        <span className="p-input-icon-left w-full mb-1">
                            <InputText
                                id="email"
                                type="email"
                                className={`w-full ${emailError ? 'p-invalid' : ''}`}
                                placeholder={t("Enter your email address")}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError("");
                                }}
                                disabled={loading}
                            />
                        </span>
                        {emailError && (
                            <small className="p-error block mb-3">{emailError}</small>
                        )}
                        
                        <label htmlFor="password" className="text-900 font-medium mb-2 mt-3 flex align-items-center gap-2">
                            {t("Password")}<span style={{ color: "red" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }} className="w-full mb-1">
                            <span className="p-input-icon-left w-full">
                                <InputText
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full ${passwordError ? 'p-invalid' : ''}`}
                                    placeholder={t("Enter your password")}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (passwordError) setPasswordError("");
                                    }}
                                    disabled={loading}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
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
                                aria-label={showPassword ? t("Hide password") : t("Show password")}
                            >
                                <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}></i>
                            </button>
                        </div>
                        {passwordError && (
                            <small className="p-error block mb-3">{passwordError}</small>
                        )}
                        
                        {requiresVerification && (
                            <div className="mb-3 p-3 border-round" style={{ 
                                backgroundColor: '#fff3cd', 
                                border: '1px solid #ffc107',
                                borderRadius: '8px'
                            }}>
                                <div className="flex align-items-center gap-2 mb-2">
                                    <i className="pi pi-exclamation-triangle text-orange-500"></i>
                                    <span className="text-900 font-medium">{t('Email Verification Required')}</span>
                                </div>
                                <p className="text-700 text-sm mb-2" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    {t('Please verify your email address before logging in. Check your inbox for the verification email.')}
                                </p>
                                <Button
                                    label={resendingVerification ? t('Sending...') : t('Resend Verification Email')}
                                    icon={resendingVerification ? 'pi pi-spinner pi-spin' : 'pi pi-send'}
                                    onClick={handleResendVerification}
                                    disabled={resendingVerification}
                                    className="p-button-outlined p-button-sm"
                                    style={{ 
                                        borderColor: '#ffc107',
                                        color: '#856404',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>
                        )}
                        
                        <div className="mb-4 flex flex-wrap gap-3 align-items-center justify-content-between mt-2">
                            <div className="flex align-items-center">
                                <Checkbox
                                    inputId="rememberMe"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.checked ?? false)}
                                    className="mr-2"
                                />
                                <label
                                    htmlFor="rememberMe"
                                    className="text-900 font-medium mb-0"
                                    style={{ cursor: "pointer" }}
                                >
                                    {t("Remember me")}
                                </label>
                            </div>
                            <a
                                className="text-600 cursor-pointer hover:text-primary transition-colors transition-duration-300"
                                style={{ color: "#d97706", fontWeight: 500 }}
                                onClick={() => router.push('/auth/forgotpassword')}
                            >
                                {t("Forgot Password?")}
                            </a>
                        </div>
                        
                        <Button
                            label={loading || authLoading ? t("Logging In...") : t("Login")}
                            icon={loading || authLoading ? "pi pi-spinner pi-spin" : "pi pi-sign-in"}
                            className="w-full hover-lift animate-scale-in"
                            style={{
                                backgroundColor: "#1e3a5f",
                                border: "none",
                                padding: "0.75rem",
                                marginBottom: "1rem"
                            }}
                            onClick={handleLogin}
                            loading={loading || authLoading}
                            disabled={loading || authLoading}
                        ></Button>
                        
                       <div className="flex align-items-center mb-3" style={{ gap: "1rem" }}>
                           <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                           <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                               {t("or create account.")}
                           </span>
                           <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                       </div>
                       
                       <div className="text-center">
                           <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                               {t("Own a Hotel?")}{" "}
                               <a
                                   className="cursor-pointer"
                                   style={{ color: "#6F522F", fontWeight: 600, textDecoration: "underline" }}
                                   onClick={() => router.push('/register-hotel')}
                               >
                                   {t("Join C-Reviews Now!")}
                               </a>
                           </span>
                       </div>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

const Login: Page = () => {
    const { t } = useI18n();
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-content-center align-items-center">
                <div className="text-center">
                    <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
                    <p>{t("Loading...")}</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
};

export default Login;
