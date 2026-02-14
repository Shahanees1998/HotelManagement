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

// Complete list of ISO 3166-1 alpha-2 country codes with English names as fallback
const COUNTRY_NAMES: Record<string, string> = {
  "AF": "Afghanistan", "AX": "Åland Islands", "AL": "Albania", "DZ": "Algeria", "AS": "American Samoa",
  "AD": "Andorra", "AO": "Angola", "AI": "Anguilla", "AQ": "Antarctica", "AG": "Antigua and Barbuda",
  "AR": "Argentina", "AM": "Armenia", "AW": "Aruba", "AU": "Australia", "AT": "Austria",
  "AZ": "Azerbaijan", "BS": "Bahamas", "BH": "Bahrain", "BD": "Bangladesh", "BB": "Barbados",
  "BY": "Belarus", "BE": "Belgium", "BZ": "Belize", "BJ": "Benin", "BM": "Bermuda",
  "BT": "Bhutan", "BO": "Bolivia", "BA": "Bosnia and Herzegovina", "BW": "Botswana",
  "BV": "Bouvet Island", "BR": "Brazil", "IO": "British Indian Ocean Territory", "BN": "Brunei Darussalam", "BG": "Bulgaria",
  "BF": "Burkina Faso", "BI": "Burundi", "CV": "Cabo Verde", "KH": "Cambodia", "CM": "Cameroon",
  "CA": "Canada", "KY": "Cayman Islands", "CF": "Central African Republic", "TD": "Chad", "CL": "Chile",
  "CN": "China", "CX": "Christmas Island", "CC": "Cocos (Keeling) Islands", "CO": "Colombia", "KM": "Comoros",
  "CG": "Congo","CK": "Cook Islands", "CR": "Costa Rica", "CI": "Côte d'Ivoire",
  "HR": "Croatia", "CU": "Cuba", "CW": "Curaçao", "CY": "Cyprus", "CZ": "Czechia",
  "DK": "Denmark", "DJ": "Djibouti", "DM": "Dominica", "DO": "Dominican Republic", "EC": "Ecuador",
  "EG": "Egypt", "SV": "El Salvador", "GQ": "Equatorial Guinea", "ER": "Eritrea", "EE": "Estonia",
  "SZ": "Eswatini", "ET": "Ethiopia", "FK": "Falkland Islands (Malvinas)", "FO": "Faroe Islands", "FJ": "Fiji",
  "FI": "Finland", "FR": "France", "GF": "French Guiana", "PF": "French Polynesia", "TF": "French Southern Territories",
  "GA": "Gabon", "GM": "Gambia", "GE": "Georgia", "DE": "Germany", "GH": "Ghana",
  "GI": "Gibraltar", "GR": "Greece", "GL": "Greenland", "GD": "Grenada", "GP": "Guadeloupe",
  "GU": "Guam", "GT": "Guatemala", "GG": "Guernsey", "GN": "Guinea", "GW": "Guinea-Bissau",
  "GY": "Guyana", "HT": "Haiti","VA": "Holy See", "HN": "Honduras",
  "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland", "IN": "India", "ID": "Indonesia",
  "IR": "Iran", "IQ": "Iraq", "IE": "Ireland", "IM": "Isle of Man", "IL": "Israel",
  "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "JE": "Jersey", "JO": "Jordan",
  "KZ": "Kazakhstan", "KE": "Kenya", "KI": "Kiribati","KR": "Korea, Republic of",
  "KW": "Kuwait", "KG": "Kyrgyzstan","LV": "Latvia", "LB": "Lebanon",
  "LS": "Lesotho", "LR": "Liberia", "LY": "Libya", "LI": "Liechtenstein", "LT": "Lithuania",
  "LU": "Luxembourg", "MO": "Macao", "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia",
  "MV": "Maldives", "ML": "Mali", "MT": "Malta", "MH": "Marshall Islands", "MQ": "Martinique",
  "MR": "Mauritania", "MU": "Mauritius", "YT": "Mayotte", "MX": "Mexico", "FM": "Micronesia",
  "MD": "Moldova", "MC": "Monaco", "MN": "Mongolia", "ME": "Montenegro", "MS": "Montserrat",
  "MA": "Morocco", "MZ": "Mozambique", "MM": "Myanmar", "NA": "Namibia", "NR": "Nauru",
  "NP": "Nepal", "NL": "Netherlands", "NC": "New Caledonia", "NZ": "New Zealand", "NI": "Nicaragua",
  "NE": "Niger", "NG": "Nigeria", "NU": "Niue", "NF": "Norfolk Island", "MK": "North Macedonia",
  "NO": "Norway", "OM": "Oman", "PK": "Pakistan", "PW": "Palau",
  "PS": "Palestine, State of", "PA": "Panama", "PG": "Papua New Guinea", "PY": "Paraguay", "PE": "Peru",
  "PH": "Philippines", "PN": "Pitcairn", "PL": "Poland", "PT": "Portugal", "PR": "Puerto Rico",
  "QA": "Qatar", "RE": "Réunion", "RO": "Romania", "RU": "Russian Federation", "RW": "Rwanda",
  "BL": "Saint Barthélemy", "KN": "Saint Kitts and Nevis", "LC": "Saint Lucia",
  "PM": "Saint Pierre and Miquelon","WS": "Samoa", "SM": "San Marino",
  "SA": "Saudi Arabia", "SN": "Senegal", "RS": "Serbia", "SC": "Seychelles", "SL": "Sierra Leone",
  "SG": "Singapore", "SK": "Slovakia", "SI": "Slovenia", "SB": "Solomon Islands",
  "SO": "Somalia", "ZA": "South Africa", "SS": "South Sudan", "ES": "Spain",
  "LK": "Sri Lanka", "SD": "Sudan", "SR": "Suriname","SE": "Sweden",
  "CH": "Switzerland", "SY": "Syrian Arab Republic", "TW": "Taiwan", "TJ": "Tajikistan", "TZ": "Tanzania",
  "TH": "Thailand", "TL": "Timor-Leste", "TG": "Togo", "TK": "Tokelau", "TO": "Tonga",
   "TN": "Tunisia", "TR": "Turkey", "TM": "Turkmenistan",
  "TV": "Tuvalu", "UG": "Uganda", "UA": "Ukraine", "AE": "United Arab Emirates", "GB": "United Kingdom",
  "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VU": "Vanuatu",
  "VE": "Venezuela", "VN": "Viet Nam",
  "EH": "Western Sahara", "YE": "Yemen", "ZM": "Zambia", "ZW": "Zimbabwe"
};

const COUNTRY_CODES = Object.keys(COUNTRY_NAMES) as readonly string[];

export default function RegisterHotel() {
  const { t, direction } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
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
    hotelAddress: "",
    city: "",
    country: "",
    hotelDescription: "",
  });

  const router = useRouter();
  const toast = useRef<Toast>(null);

  const countryOptions = useMemo(
    () =>
      COUNTRY_CODES.map(code => {
        const translatedName = t(`countries.${code}`);
        // Use translation if available and not just the key, otherwise use English name from mapping
        const label = translatedName && translatedName !== `countries.${code}` 
          ? translatedName 
          : (COUNTRY_NAMES[code] || code);
        return {
          label,
          value: code,
        };
      }).sort((a, b) => a.label.localeCompare(b.label)), // Sort alphabetically
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
        website: "", // Will be generated from hotel name
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
        setRegistrationSuccess(true);
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
            className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] align-items-center"
            style={{
              gap: "2rem",
              alignItems: "center",
            }}
          >
          {/* Left Side - Form or Success */}
          <div className="py-7 px-4 md:px-7">
            {registrationSuccess ? (
              <div className="animate-slide-in-left flex flex-column gap-4" style={{ maxWidth: "28rem" }}>
                <div className="flex align-items-center gap-3 mb-2">
                  <div
                    className="flex align-items-center justify-content-center border-circle"
                    style={{
                      width: "3.5rem",
                      height: "3.5rem",
                      backgroundColor: "var(--green-100)",
                      color: "var(--green-600)",
                    }}
                  >
                    <i className="pi pi-check text-3xl" />
                  </div>
                  <span className="text-[#1B2A49] text-2xl font-bold">
                    {t("registerHotel.successScreen.title")}
                  </span>
                </div>
                <p className="text-900 mb-2" style={{ lineHeight: 1.6, fontSize: "1rem" }}>
                  {t("registerHotel.successScreen.message")}
                </p>
                <Button
                  label={t("registerHotel.successScreen.goToLogin")}
                  icon="pi pi-sign-in"
                  iconPos="right"
                  className="w-full hover-lift"
                  style={{
                    backgroundColor: "#1e3a5f",
                    border: "none",
                    padding: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                  onClick={() => router.push("/auth/login")}
                />
              </div>
            ) : step === 1 ? (
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
                        filter
                        filterBy="label"
                        showClear
                        optionLabel="label"
                        optionValue="value"
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

          {/* Right Side - Illustration (hidden on mobile) */}
          <div className="hidden md:block">
            {registrationSuccess ? (
              <img src="/images/hotel-information.svg" alt={t("registerHotel.images.hotelAlt")}
                style={{ width: "100%", height: "100%" }} />
            ) : step === 1 ? (
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
