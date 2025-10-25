"use client";
import type { Page } from "@/types/index";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { useContext, useState, Suspense } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import { useAuth } from "@/hooks/useAuth";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { getDefaultRedirectPath } from "@/lib/rolePermissions";
import Image from "next/image";
import AuthFooter from "@/components/AuthFooter";

const LoginContent = () => {
    const [rememberMe, setRememberMe] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const { layoutConfig } = useContext(LayoutContext);
    const { user, login, loading: authLoading } = useAuth();
    const toast = useRef<Toast>(null);
    const dark = layoutConfig.colorScheme !== "light";
    const [showPassword, setShowPassword] = useState(false);

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
            setEmailError("Email is required");
            hasError = true;
        } else if (!email.includes('@')) {
            setEmailError("Please enter a valid email address");
            hasError = true;
        }

        if (!password) {
            setPasswordError("Password is required");
            hasError = true;
        }

        if (hasError) {
            return;
        }

        setLoading(true);
        try {
            const user = await login(email, password);
            const callbackUrl = searchParams.get('callbackUrl') || getDefaultRedirectPath(user.role);
            router.push(callbackUrl);
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'An unexpected error occurred. Please try again.';

            if (error instanceof Error) {
                errorMessage = error.message;
                if (error.message === 'Invalid email or password') {
                    setPasswordError('Invalid email or password');
                } else if (error.message === 'No account found with this email address') {
                    setEmailError('No account found with this email address');
                } else if (error.message === 'Incorrect password') {
                    setPasswordError('Incorrect password');
                } else if (error.message === 'Account is not active. Please contact admin.') {
                    errorMessage = 'Account is not active. Please contact admin.';
                }
            }

            toast.current?.show({
                severity: 'error',
                summary: 'Login Failed',
                detail: errorMessage,
                life: 4000
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{backgroundColor: "#FDFCF9", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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

            {/* Main Content */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
                <div className="surface-card border-round py-7 px-4 md:px-7 z-1 animate-fade-in" style={{ width: "100%", maxWidth: "480px", boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)" }}>
                    <div className="mb-4 animate-slide-in-left">
                        <div className="text-[#1B2A49] text-3xl font-bold mb-2 flex align-items-center gap-2">
                            <i className="pi pi-user text-blue-500"></i>
                            Welcome back!
                        </div>
                        <span className="text-600 font-thin flex align-items-center gap-2">
                            <i className="pi pi-info-circle text-gray-500"></i>
                            Thank you for getting back to C-Reviews, the easiest way for hotels to collect and improve through guest feedback.
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <label htmlFor="email" className="text-900 font-medium mb-2 flex align-items-center gap-2">
                            <i className="pi pi-envelope text-blue-500"></i>
                            Email Address<span style={{ color: "red" }}>*</span>
                        </label>
                        <span className="p-input-icon-left w-full mb-1">
                            <i className="pi pi-envelope text-gray-500"></i>
                            <InputText
                                id="email"
                                type="email"
                                className={`w-full ${emailError ? 'p-invalid' : ''}`}
                                placeholder="Enter your email address"
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
                            <i className="pi pi-lock text-blue-500"></i>
                            Password<span style={{ color: "red" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }} className="w-full mb-1">
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-lock"></i>
                                <InputText
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`w-full ${passwordError ? 'p-invalid' : ''}`}
                                    placeholder="Enter your password"
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
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}></i>
                            </button>
                        </div>
                        {passwordError && (
                            <small className="p-error block mb-3">{passwordError}</small>
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
                                    Remember me
                                </label>
                            </div>
                            <a
                                className="text-600 cursor-pointer hover:text-primary transition-colors transition-duration-300"
                                style={{ color: "#d97706", fontWeight: 500 }}
                                onClick={() => router.push('/auth/forgotpassword')}
                            >
                                Forgot Password?
                            </a>
                        </div>
                        
                        <Button
                            label={loading || authLoading ? "Logging In..." : "Login"}
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
                               or create account.
                           </span>
                           <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                       </div>
                       
                       <div className="text-center">
                           <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                               Own a Hotel?{" "}
                               <a
                                   className="cursor-pointer"
                                   style={{ color: "#6F522F", fontWeight: 600, textDecoration: "underline" }}
                                   onClick={() => router.push('/register-hotel')}
                               >
                                   Join C-Reviews Now!
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
    return (
        <Suspense fallback={
            <div className="min-h-screen flex justify-content-center align-items-center">
                <div className="text-center">
                    <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
};

export default Login;
