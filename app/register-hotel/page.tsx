"use client";

import { useState, useRef } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";

const countries = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  { label: "Australia", value: "AU" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Spain", value: "ES" },
  { label: "Italy", value: "IT" },
  { label: "Japan", value: "JP" },
  { label: "India", value: "IN" },
  { label: "China", value: "CN" },
  { label: "Brazil", value: "BR" },
  { label: "Mexico", value: "MX" },
  { label: "Other", value: "OTHER" },
];

export default function RegisterHotel() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [confirmedStep1, setConfirmedStep1] = useState(false);
  const [confirmedStep2, setConfirmedStep2] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Owner Information
    fullName: "",
    email: "",
    phone: "",
    password: "",
    
    // Hotel Information
    hotelName: "",
    hotelWebsite: "",
    hotelAddress: "",
    city: "",
    country: "",
    hotelDescription: "",
  });
  
  const router = useRouter();
  const toast = useRef<Toast>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.email || !formData.phone || !formData.password) {
      showToast("warn", "Warning", "Please fill in all required fields");
      return false;
    }

    if (formData.password.length < 6) {
      showToast("warn", "Warning", "Password must be at least 6 characters long");
      return false;
    }

    if (!confirmedStep1) {
      showToast("warn", "Warning", "Please accept the terms and conditions");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.hotelName || !formData.hotelAddress || !formData.city || !formData.country) {
      showToast("warn", "Warning", "Please fill in all required fields");
      return false;
    }

    if (!confirmedStep2) {
      showToast("warn", "Warning", "Please accept the terms and conditions and privacy policy");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Split full name into first and last name
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Generate slug from hotel name
      const hotelSlug = formData.hotelName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      const registrationData = {
        firstName,
        lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        hotelName: formData.hotelName,
        hotelSlug: hotelSlug,
        website: formData.hotelWebsite,
        address: formData.hotelAddress,
        city: formData.city,
        country: formData.country,
        description: formData.hotelDescription,
      };

      const response = await fetch('/api/hotel/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", "Hotel registration successful! Please check your email for verification.");
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        showToast("error", "Error", data.error || "Registration failed");
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
      <AuthHeader />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "2rem", 
          width: "100%", 
          maxWidth: "1200px",
          alignItems: "center"
        }}>
          {/* Left Side - Form */}
          <div className="py-7 px-4 md:px-7">
            {step === 1 ? (
              <>
                {/* Step 1: Owner Information */}
                <div className="mb-4">
                  <div className="text-[#1B2A49] text-2xl font-bold mb-2">
                    Owner Information!
              </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Is my data safe?
                    </span>
                    <i className="pi pi-info-circle" style={{ fontSize: "1rem", color: "#6b7280" }}></i>
                  </div>
              </div>

                <div className="flex flex-column">
                  <label htmlFor="fullName" className="text-900 font-medium mb-2">
                    Full Name<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-user"></i>
                    <InputText
                      id="fullName"
                      type="text"
                  className="w-full"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </span>

                  <label htmlFor="email" className="text-900 font-medium mb-2">
                    Email Address<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-envelope"></i>
                <InputText
                      id="email"
                      type="email"
                  className="w-full"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </span>

                  <label htmlFor="phone" className="text-900 font-medium mb-2">
                    Phone Number<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-phone"></i>
                <InputText
                      id="phone"
                      type="tel"
                  className="w-full"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </span>

                  <label htmlFor="password" className="text-900 font-medium mb-2">
                    Password<span style={{ color: "red" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }} className="w-full mb-4">
                    <span className="p-input-icon-left w-full">
                      <i className="pi pi-lock"></i>
                      <InputText
                        id="password"
                        type={showPassword ? "text" : "password"}
                  className="w-full"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
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
                    >
                      <i className={`pi ${showPassword ? "pi-eye-slash" : "pi-eye"}`}></i>
                    </button>
              </div>

                  <div className="flex align-items-start mb-4">
                    <Checkbox
                      inputId="terms1"
                      checked={confirmedStep1}
                      onChange={(e) => setConfirmedStep1(e.checked ?? false)}
                      className="mr-2"
                    />
                    <label htmlFor="terms1" style={{ fontSize: "0.875rem", lineHeight: "1.4" }}>
                      I agree to the{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        Privacy Policy
                      </a>
                    </label>
              </div>

                  <Button
                    label="Let's Keep Going!"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                  className="w-full"
                    style={{
                      backgroundColor: "#1e3a5f",
                      border: "none",
                      padding: "0.75rem",
                      marginBottom: "1rem"
                    }}
                    onClick={handleNextStep}
                  />

                  <div className="flex align-items-center mb-3" style={{ gap: "1rem" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      or register via
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
              </div>

                  <div className="text-center">
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Already have an account?{" "}
                      <a
                        className="cursor-pointer"
                        style={{ color: "#1e3a5f", fontWeight: 600 }}
                        onClick={() => router.push('/auth/login')}
                      >
                        Login
                      </a>
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Step 2: Hotel Information */}
                <div className="mb-4">
                  <div className="text-[#1B2A49] text-2xl font-bold mb-2">
                    Hotel Information!
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Is my data safe?
                    </span>
                    <i className="pi pi-info-circle" style={{ fontSize: "1rem", color: "#6b7280" }}></i>
                  </div>
              </div>

                <div className="flex flex-column">
                  <label htmlFor="hotelName" className="text-900 font-medium mb-2">
                    Hotel Name<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-building"></i>
                <InputText
                      id="hotelName"
                      type="text"
                  className="w-full"
                      placeholder="Enter hotel name"
                      value={formData.hotelName}
                      onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    />
                  </span>

                  <label htmlFor="hotelWebsite" className="text-900 font-medium mb-2">
                    Hotel Website<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <i className="pi pi-globe"></i>
                <InputText
                      id="hotelWebsite"
                      type="url"
                  className="w-full"
                      placeholder="Enter hotel website url"
                      value={formData.hotelWebsite}
                      onChange={(e) => handleInputChange('hotelWebsite', e.target.value)}
                />
                  </span>

                  <label htmlFor="hotelAddress" className="text-900 font-medium mb-2">
                    Hotel Address<span style={{ color: "red" }}>*</span>
                  </label>
                <InputText
                    id="hotelAddress"
                    type="text"
                    className="w-full mb-4"
                    placeholder="Enter hotel street address"
                    value={formData.hotelAddress}
                    onChange={(e) => handleInputChange('hotelAddress', e.target.value)}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label htmlFor="city" className="text-900 font-medium mb-2" style={{ display: "block" }}>
                        City<span style={{ color: "red" }}>*</span>
                      </label>
                      <InputText
                        id="city"
                        type="text"
                        className="w-full"
                        placeholder="Enter hotel city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="text-900 font-medium mb-2" style={{ display: "block" }}>
                        Country<span style={{ color: "red" }}>*</span>
                      </label>
                      <Dropdown
                        id="country"
                        value={formData.country}
                        options={countries}
                        onChange={(e) => handleInputChange('country', e.value)}
                        placeholder="Select Country"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <label htmlFor="hotelDescription" className="text-900 font-medium mb-2">
                    Hotel Description<span style={{ color: "red" }}>*</span>
                  </label>
                  <InputTextarea
                    id="hotelDescription"
                    className="w-full mb-4"
                    placeholder="Enter brief description of your hotel"
                    rows={4}
                    value={formData.hotelDescription}
                    onChange={(e) => handleInputChange('hotelDescription', e.target.value)}
                  />

                  <div className="flex align-items-start mb-4">
                    <Checkbox
                      inputId="terms2"
                      checked={confirmedStep2}
                      onChange={(e) => setConfirmedStep2(e.checked ?? false)}
                      className="mr-2"
                    />
                    <label htmlFor="terms2" style={{ fontSize: "0.875rem", lineHeight: "1.4" }}>
                      I agree to the{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        Privacy Policy
                      </a>
                    </label>
              </div>

                  <Button
                    label={loading ? "Registering..." : "Register Now"}
                    icon="pi pi-check"
                    iconPos="right"
                    className="w-full"
                    style={{
                      backgroundColor: "#1e3a5f",
                      border: "none",
                      padding: "0.75rem",
                      marginBottom: "1rem"
                    }}
                    onClick={handleRegister}
                    loading={loading}
                    disabled={loading}
                  />

                  <div className="flex align-items-center mb-3" style={{ gap: "1rem" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      or register via
                    </span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                  </div>

                  <div className="text-center">
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Already have an account?{" "}
                      <a
                        className="cursor-pointer"
                        style={{ color: "#1e3a5f", fontWeight: 600 }}
                    onClick={() => router.push('/auth/login')}
                      >
                        Login
                      </a>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side - Illustration */}
          <div>
            {step === 1 ? (
            <img src="/images/owner-information.svg" alt="Register Hotel" style={{ width: "100%", height: "100%" }} />
            ) : (
              <img src="/images/hotel-information.svg" alt="Register Hotel" style={{ width: "100%", height: "100%" }} />

            )}
            </div>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
