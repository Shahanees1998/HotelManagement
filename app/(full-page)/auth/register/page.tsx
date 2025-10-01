"use client";
import type { Page } from "@/types/index";
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";
import { useContext, useState, useRef } from "react";
import { LayoutContext } from "../../../../layout/context/layoutcontext";
import AuthFooter from "@/components/AuthFooter";

const Register: Page = () => {
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phone: ''
    });
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const { layoutConfig } = useContext(LayoutContext);
    const dark = layoutConfig.colorScheme !== "light";

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const handleRegister = async () => {
        if (!confirmed) {
            showToast("warn", "Warning", "Please accept the terms and conditions");
            return;
        }

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            showToast("error", "Error", "Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                showToast("success", "Success", data.message);
                setTimeout(() => {
                    router.push('/auth/login');
                }, 2000);
            } else {
                showToast("error", "Error", data.error);
            }
        } catch (error) {
            showToast("error", "Error", "Registration failed. Please try again.");
        } finally {
            setLoading(false);
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
                        <div className="text-900 text-xl font-bold mb-2">
                            Register
                        </div>
                        <span className="text-600 font-medium">
                            Let&lsquo;s get started
                        </span>
                    </div>
                    <div className="flex flex-column">
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-user"></i>
                            <InputText
                                id="firstName"
                                type="text"
                                className="w-full"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                            />
                        </span>
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-user"></i>
                            <InputText
                                id="lastName"
                                type="text"
                                className="w-full"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                            />
                        </span>
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-envelope"></i>
                            <InputText
                                id="email"
                                type="email"
                                className="w-full"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                            />
                        </span>
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-phone"></i>
                            <InputText
                                id="phone"
                                type="tel"
                                className="w-full"
                                placeholder="Phone (Optional)"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                            />
                        </span>
                        <span className="p-input-icon-left w-full mb-4">
                            <i className="pi pi-lock z-2"></i>
                            <Password
                                id="password"
                                type="password"
                                className="w-full"
                                inputClassName="w-full"
                                placeholder="Password"
                                toggleMask
                                inputStyle={{ paddingLeft: "2.5rem" }}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                            />
                        </span>
                        <div className="mb-4 flex flex-wrap">
                            <Checkbox
                                name="checkbox"
                                checked={confirmed}
                                onChange={(e) =>
                                    setConfirmed(e.checked ?? false)
                                }
                                className="mr-2"
                            ></Checkbox>
                            <label
                                htmlFor="checkbox"
                                className="text-900 font-medium mr-2"
                            >
                                I have read the
                            </label>
                            <a className="text-600 cursor-pointer hover:text-primary cursor-pointer">
                                Terms and Conditions
                            </a>
                        </div>
                        <Button
                            label="Sign Up"
                            className="w-full mb-4"
                            style={{
                                backgroundColor: "#1e3a5f",
                                border: "none",
                                padding: "0.75rem"
                            }}
                            onClick={handleRegister}
                            loading={loading}
                            disabled={loading}
                        ></Button>
                        <span className="font-medium text-600">
                            Already have an account?{" "}
                            <a 
                                className="font-semibold cursor-pointer text-900 hover:text-primary transition-colors transition-duration-300"
                                onClick={() => router.push('/auth/login')}
                            >
                                Login
                            </a>
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <AuthFooter />
        </div>
    );
};

export default Register;
