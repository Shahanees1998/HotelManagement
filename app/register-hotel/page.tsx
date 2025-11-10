"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import AuthHeader from "@/components/AuthHeader";
import AuthFooter from "@/components/AuthFooter";
import { useI18n } from "@/i18n/TranslationProvider";
import { LanguageSelector } from "@/components/LanguageSelector";

const COUNTRY_CODES = [
  "US",
  "CA",
  "GB",
  "AU",
  "DE",
  "FR",
  "ES",
  "IT",
  "JP",
  "IN",
  "CN",
  "BR",
  "MX",
  "OTHER",
] as const;

export default function RegisterHotel() {
  const { t, direction } = useI18n();
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

  const countryOptions = useMemo(
    () =>
      COUNTRY_CODES.map(code => ({
        label: t(`countries.${code}`),
        value: code,
      })),
    [t]
  );

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
      showToast("warn", t("common.warning"), t("registerHotel.toasts.missingRequired"));
      return false;
    }

    if (formData.password.length < 6) {
      showToast("warn", t("common.warning"), t("registerHotel.toasts.passwordLength"));
      return false;
    }

    if (!confirmedStep1) {
      showToast("warn", t("common.warning"), t("registerHotel.toasts.acceptTerms"));
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.hotelName || !formData.hotelAddress || !formData.city || !formData.country) {
      showToast("warn", t("common.warning"), t("registerHotel.toasts.missingRequired"));
      return false;
    }

    if (!confirmedStep2) {
      showToast("warn", t("common.warning"), t("registerHotel.toasts.acceptTermsPrivacy"));
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBackStep = () => {
    setStep(1);
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
        showToast("success", t("common.success"), t("registerHotel.toasts.success"));
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        showToast("error", t("common.error"), data.error || t("registerHotel.toasts.error"));
      }
    } catch (error) {
      showToast("error", t("common.error"), t("registerHotel.toasts.errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={direction}
      style={{
        backgroundColor: "#FDFCF9",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        direction,
      }}
      className="animate-fade-in"
    >
      <Toast ref={toast} />

      {/* Header */}
      <AuthHeader />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem 1rem" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "1200px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: direction === "rtl" ? "flex-start" : "flex-end",
            }}
          >
            <LanguageSelector style={{ minWidth: "180px" }} />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2rem",
              alignItems: "center",
            }}
          >
          {/* Left Side - Form */}
          <div className="py-7 px-4 md:px-7">
            {step === 1 ? (
              <>
                {/* Step 1: Owner Information */}
                <div className="mb-4 animate-slide-in-left">
                  <div className="text-[#1B2A49] text-2xl font-bold mb-2 flex align-items-center gap-2">
                    <i className="pi pi-user text-blue-500"></i>
                    {t("registerHotel.step1.title")}
                  </div>
                </div>

                <div className="flex flex-column">
                  <label htmlFor="fullName" className="text-900 font-medium mb-2 flex align-items-center gap-2">
                    {t("registerHotel.step1.fields.fullName")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <InputText
                      id="fullName"
                      type="text"
                      className="w-full"
                      placeholder={t("registerHotel.step1.placeholders.fullName")}
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </span>

                  <label htmlFor="email" className="text-900 font-medium mb-2 flex align-items-center gap-2">
                    {t("registerHotel.step1.fields.email")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <InputText
                      id="email"
                      type="email"
                      className="w-full"
                      placeholder={t("registerHotel.step1.placeholders.email")}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </span>

                  <label htmlFor="phone" className="text-900 font-medium mb-2">
                    {t("registerHotel.step1.fields.phone")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="w-full mb-4">
                    <InputText
                      id="phone"
                      type="tel"
                      className="w-full"
                      placeholder={t("registerHotel.step1.placeholders.phone")}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </span>

                  <label htmlFor="password" className="text-900 font-medium mb-2">
                    {t("registerHotel.step1.fields.password")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }} className="w-full mb-4">
                    <span className="p-input-icon-left w-full">
                      <InputText
                        id="password"
                        type={showPassword ? "text" : "password"}
                        className="w-full"
                        placeholder={t("registerHotel.step1.placeholders.password")}
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
                      {t("common.agreeTo")}{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        {t("common.terms")}
                      </a>{" "}
                      {t("common.and")}{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        {t("common.privacy")}
                      </a>
                    </label>
                  </div>

                  <Button
                    label={t("registerHotel.step1.cta")}
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    className="w-full hover-lift animate-scale-in"
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
                    {/* <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      or register via
                    </span> */}
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                  </div>

                  <div className="text-center">
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {t("common.alreadyHaveAccount")} {" "}
                      <a
                        className="cursor-pointer"
                        style={{ color: "#1e3a5f", fontWeight: 600 }}
                        onClick={() => router.push('/auth/login')}
                      >
                        {t("common.login")}
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
                    {t("registerHotel.step2.title")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{t("registerHotel.step2.subtitle")}</span>
                    <i className="pi pi-info-circle" style={{ fontSize: "1rem", color: "#6b7280" }}></i>
                  </div>
                </div>

                <div className="flex flex-column">
                  <label htmlFor="hotelName" className="text-900 font-medium mb-2">
                    {t("registerHotel.step2.fields.hotelName")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <InputText
                      id="hotelName"
                      type="text"
                      className="w-full"
                      placeholder={t("registerHotel.step2.placeholders.hotelName")}
                      value={formData.hotelName}
                      onChange={(e) => handleInputChange('hotelName', e.target.value)}
                    />
                  </span>

                  <label htmlFor="hotelWebsite" className="text-900 font-medium mb-2">
                    {t("registerHotel.step2.fields.hotelWebsite")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <span className="p-input-icon-left w-full mb-4">
                    <InputText
                      id="hotelWebsite"
                      type="url"
                      className="w-full"
                      placeholder={t("registerHotel.step2.placeholders.hotelWebsite")}
                      value={formData.hotelWebsite}
                      onChange={(e) => handleInputChange('hotelWebsite', e.target.value)}
                    />
                  </span>

                  <label htmlFor="hotelAddress" className="text-900 font-medium mb-2">
                    {t("registerHotel.step2.fields.hotelAddress")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <InputText
                    id="hotelAddress"
                    type="text"
                    className="w-full mb-4"
                    placeholder={t("registerHotel.step2.placeholders.hotelAddress")}
                    value={formData.hotelAddress}
                    onChange={(e) => handleInputChange('hotelAddress', e.target.value)}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <label htmlFor="city" className="text-900 font-medium mb-2" style={{ display: "block" }}>
                        {t("registerHotel.step2.fields.city")}<span style={{ color: "red" }}>*</span>
                      </label>
                      <InputText
                        id="city"
                        type="text"
                        className="w-full"
                        placeholder={t("registerHotel.step2.placeholders.city")}
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="text-900 font-medium mb-2" style={{ display: "block" }}>
                        {t("registerHotel.step2.fields.country")}<span style={{ color: "red" }}>*</span>
                      </label>
                      <Dropdown
                        id="country"
                        value={formData.country}
                        options={countryOptions}
                        onChange={(e) => handleInputChange('country', e.value)}
                        placeholder={t("registerHotel.step2.placeholders.country")}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <label htmlFor="hotelDescription" className="text-900 font-medium mb-2">
                    {t("registerHotel.step2.fields.hotelDescription")}<span style={{ color: "red" }}>*</span>
                  </label>
                  <InputTextarea
                    id="hotelDescription"
                    className="w-full mb-4"
                    placeholder={t("registerHotel.step2.placeholders.hotelDescription")}
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
                      {t("common.agreeTo")}{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        {t("common.terms")}
                      </a>{" "}
                      {t("common.and")}{" "}
                      <a href="#" style={{ color: "#6F522F", textDecoration: "underline" }}>
                        {t("common.privacy")}
                      </a>
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <Button
                      label={t("registerHotel.buttons.back")}
                      icon="pi pi-arrow-left"
                      iconPos="left"
                      className="flex-1"
                      style={{
                        backgroundColor: "#6b7280",
                        border: "none",
                        padding: "0.75rem"
                      }}
                      onClick={handleBackStep}
                      disabled={loading}
                    />
                    <Button
                      label={loading ? t("registerHotel.buttons.registering") : t("registerHotel.buttons.register")}
                      icon="pi pi-check"
                      iconPos="right"
                      className="flex-1"
                      style={{
                        backgroundColor: "#1e3a5f",
                        border: "none",
                        padding: "0.75rem"
                      }}
                      onClick={handleRegister}
                      loading={loading}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex align-items-center mb-3" style={{ gap: "1rem" }}>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{t("common.orRegisterVia")}</span>
                    <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }}></div>
                  </div>

                  <div className="text-center">
                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      {t("common.alreadyHaveAccount")} {" "}
                      <a
                        className="cursor-pointer"
                        style={{ color: "#1e3a5f", fontWeight: 600 }}
                        onClick={() => router.push('/auth/login')}
                      >
                        {t("common.login")}
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
              <img src="/images/owner-information.svg" alt={t("registerHotel.images.ownerAlt")}
                style={{ width: "100%", height: "100%" }} />
            ) : (
              <img src="/images/hotel-information.svg" alt={t("registerHotel.images.hotelAlt")}
                style={{ width: "100%", height: "100%" }} />

            )}
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <AuthFooter />
    </div>
  );
}
