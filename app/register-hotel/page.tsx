"use client";

import { useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { Toast } from "primereact/toast";
import { useRouter } from "next/navigation";
import { LayoutContext } from "@/layout/context/layoutcontext";
import { useContext } from "react";

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
  { label: "Other", value: "OTHER" },
];

export default function RegisterHotel() {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [slugValidating, setSlugValidating] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    available: boolean;
    message: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    // Hotel Information
    hotelName: "",
    hotelSlug: "",
    description: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    website: "",
    
    // Owner Information
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    // Auto-generate slug from hotel name
    if (field === "hotelName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData(prev => ({
        ...prev,
        hotelSlug: slug
      }));
      
      // Validate the auto-generated slug
      if (slug.length >= 3) {
        validateSlug(slug);
      }
    }

    // Validate slug when manually changed
    if (field === "hotelSlug") {
      if (value.length >= 3) {
        // Debounce the validation
        const timeoutId = setTimeout(() => {
          validateSlug(value);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      } else {
        setSlugStatus(null);
      }
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const validateSlug = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugStatus(null);
      return;
    }

    setSlugValidating(true);
    try {
      const response = await fetch(`/api/hotel/validate-slug?slug=${encodeURIComponent(slug)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSlugStatus({
          available: data.available,
          message: data.message,
        });
      } else {
        setSlugStatus({
          available: false,
          message: "Error checking availability",
        });
      }
    } catch (error) {
      setSlugStatus({
        available: false,
        message: "Error checking availability",
      });
    } finally {
      setSlugValidating(false);
    }
  };

  const validateForm = () => {
    if (!formData.hotelName || !formData.hotelSlug || !formData.firstName || 
        !formData.lastName || !formData.email || !formData.password) {
      showToast("warn", "Warning", "Please fill in all required fields");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast("warn", "Warning", "Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      showToast("warn", "Warning", "Password must be at least 6 characters long");
      return false;
    }

    if (!confirmed) {
      showToast("warn", "Warning", "Please accept the terms and conditions");
      return false;
    }

    if (slugStatus && !slugStatus.available) {
      showToast("warn", "Warning", "Hotel URL is not available. Please choose a different one.");
      return false;
    }

    if (slugValidating) {
      showToast("warn", "Warning", "Please wait while we check the hotel URL availability.");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/hotel/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
    <>
      <div className="min-h-screen flex align-items-center justify-content-center py-6">
        <div className="w-full max-w-4xl px-4">
          <Card className="shadow-2">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-900 mb-2">Register Your Hotel</h1>
              <p className="text-600">Join our guest feedback management platform</p>
            </div>

            <div className="grid">
              {/* Hotel Information */}
              <div className="col-12">
                <h3 className="text-xl font-semibold mb-4 text-900">Hotel Information</h3>
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Hotel Name *</label>
                <InputText
                  value={formData.hotelName}
                  onChange={(e) => handleInputChange('hotelName', e.target.value)}
                  placeholder="Enter hotel name"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Hotel URL *</label>
                <div className="p-inputgroup">
                  <span className="p-inputgroup-addon">yourdomain.com/</span>
                  <InputText
                    value={formData.hotelSlug}
                    onChange={(e) => handleInputChange('hotelSlug', e.target.value)}
                    placeholder="hotel-name"
                    className={`w-full ${slugStatus && !slugStatus.available ? 'p-invalid' : ''}`}
                  />
                  {slugValidating && (
                    <span className="p-inputgroup-addon">
                      <i className="pi pi-spinner pi-spin"></i>
                    </span>
                  )}
                  {slugStatus && !slugValidating && (
                    <span className={`p-inputgroup-addon ${slugStatus.available ? 'text-green-500' : 'text-red-500'}`}>
                      <i className={`pi ${slugStatus.available ? 'pi-check' : 'pi-times'}`}></i>
                    </span>
                  )}
                </div>
                <small className="text-600">This will be your unique hotel URL</small>
                {slugStatus && (
                  <div className={`text-sm mt-1 ${slugStatus.available ? 'text-green-600' : 'text-red-600'}`}>
                    <i className={`pi ${slugStatus.available ? 'pi-check-circle' : 'pi-times-circle'} mr-1`}></i>
                    {slugStatus.message}
                  </div>
                )}
              </div>

              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Description</label>
                <InputTextarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your hotel"
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Address</label>
                <InputText
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">City</label>
                <InputText
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Country</label>
                <Dropdown
                  value={formData.country}
                  options={countries}
                  onChange={(e) => handleInputChange('country', e.value)}
                  placeholder="Select country"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Phone</label>
                <InputText
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full"
                />
              </div>

              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Website</label>
                <InputText
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://www.yourhotel.com"
                  className="w-full"
                />
              </div>

              {/* Owner Information */}
              <div className="col-12">
                <h3 className="text-xl font-semibold mb-4 text-900 mt-4">Owner Information</h3>
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">First Name *</label>
                <InputText
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Your first name"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Last Name *</label>
                <InputText
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Your last name"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Email *</label>
                <InputText
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  type="email"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-6">
                <label className="block text-900 font-medium mb-2">Password *</label>
                <Password
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>

              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Confirm Password *</label>
                <Password
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  toggleMask
                  className="w-full"
                  inputClassName="w-full"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="col-12">
                <div className="flex align-items-start gap-3 mt-4">
                  <Checkbox
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.checked || false)}
                    className="mt-1"
                  />
                  <div>
                    <label className="text-900 font-medium">
                      I agree to the{" "}
                      <a href="#" className="text-primary cursor-pointer">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary cursor-pointer">
                        Privacy Policy
                      </a>
                    </label>
                    <p className="text-600 text-sm mt-2 mb-0">
                      By registering, you agree to our terms and understand that your hotel will be subject to our subscription billing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="col-12">
                <div className="flex flex-column md:flex-row gap-3 mt-6">
                  <Button
                    label="Register Hotel"
                    icon="pi pi-building"
                    onClick={handleRegister}
                    loading={loading}
                    disabled={loading || slugValidating || (slugStatus?.available === false)}
                    className="flex-1"
                    size="large"
                  />
                  <Button
                    label="Already have an account?"
                    icon="pi pi-sign-in"
                    onClick={() => router.push('/auth/login')}
                    className="p-button-outlined flex-1"
                    size="large"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Toast ref={toast} />
    </>
  );
}
