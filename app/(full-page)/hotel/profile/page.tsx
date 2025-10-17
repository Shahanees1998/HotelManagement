"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { FileUpload } from "primereact/fileupload";
import { Image } from "primereact/image";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import SubscriptionManager from "@/components/SubscriptionManager";

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

export default function HotelProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [hotelData, setHotelData] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    logo: "",
    tripAdvisorLink: "",
    googleReviewsLink: "",
  });
  const [subscriptionData, setSubscriptionData] = useState({
    status: "TRIAL",
    trialDaysRemaining: 14,
    totalReviews: 0,
    averageRating: 0,
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadHotelData();
    loadSubscriptionData();
  }, []);

  const loadHotelData = async () => {
    try {
      const response = await fetch('/api/hotel/profile');
      if (response.ok) {
        const data = await response.json();
        setHotelData({
          name: data.data.name || "",
          slug: data.data.slug || "",
          description: data.data.description || "",
          address: data.data.address || "",
          city: data.data.city || "",
          country: data.data.country || "",
          phone: data.data.phone || "",
          email: data.data.email || "",
          website: data.data.website || "",
          logo: data.data.logo || "",
          tripAdvisorLink: data.data.tripAdvisorLink || "",
          googleReviewsLink: data.data.googleReviewsLink || "",
        });
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to load hotel profile");
      }
    } catch (error) {
      console.error("Error loading hotel data:", error);
      showToast("error", "Error", "Failed to load hotel profile");
    }
  };

  const loadSubscriptionData = async () => {
    try {
      const response = await fetch('/api/hotel/subscription');
      if (response.ok) {
        const data = await response.json();
        const subData = data.data;
        setSubscriptionData({
          status: subData.hotel.subscriptionStatus,
          trialDaysRemaining: subData.trial.daysRemaining,
          totalReviews: subData.stats.totalReviews,
          averageRating: subData.stats.averageRating,
        });
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleInputChange = (field: string, value: string) => {
    setHotelData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/hotel/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(hotelData),
      });

      if (response.ok) {
        showToast("success", "Success", "Hotel profile updated successfully");
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to update hotel profile");
      }
    } catch (error) {
      console.error("Error saving hotel data:", error);
      showToast("error", "Error", "Failed to update hotel profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: any) => {
    const file = event.files[0];
    if (!file) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", "Error", "Please select a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      showToast("error", "Error", "Image size must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/hotel/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setHotelData(prev => ({
          ...prev,
          logo: data.logoUrl
        }));
        
        // Dispatch custom event to update topbar (in case user profile image is used)
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        showToast("success", "Success", "Hotel logo updated successfully");
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      showToast("error", "Error", "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Hotel Profile</h1>
            <p className="text-600 mt-2 mb-0">Manage your hotel information and settings.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Save Changes"
              icon="pi pi-save"
              onClick={handleSave}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Hotel Logo */}
      <div className="col-12 lg:col-4">
        <div className="col-12">
        <Card title="Hotel Logo" className="mb-4">
          <div className="flex flex-column align-items-center gap-3">
            <div className="border-1 border-300 border-round p-3" style={{ width: '150px', height: '150px' }}>
              {uploadingLogo ? (
                <div className="flex align-items-center justify-content-center h-full">
                  <i className="pi pi-spinner pi-spin text-4xl text-400"></i>
                </div>
              ) : hotelData.logo ? (
                <Image
                  src={hotelData.logo}
                  alt="Hotel Logo"
                  width="100%"
                  height="100%"
                  className="border-round"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="flex align-items-center justify-content-center h-full">
                  <i className="pi pi-building text-4xl text-400"></i>
                </div>
              )}
            </div>
            <FileUpload
              mode="basic"
              name="hotelLogo"
              accept="image/*"
              maxFileSize={5000000}
              customUpload
              uploadHandler={handleLogoUpload}
              chooseLabel={uploadingLogo ? "Uploading..." : "Upload Logo"}
              className="w-full"
              auto
              disabled={uploadingLogo}
            />
            <small className="text-600 text-center">
              JPG, PNG or GIF. Max size 5MB. Recommended: 300x300px
            </small>
          </div>
        </Card>
        </div>
        <div className="col-12">
        <Card title="Actions">
          <div className="flex flex-column gap-2">
            <Button
              label="View Public Page"
              icon="pi pi-external-link"
              className="p-button-outlined"
              onClick={() => window.open(`/feedback/${hotelData.slug}`, '_blank')}
            />
            {/* <Button
              label="Manage Subscription"
              icon="pi pi-credit-card"
              className="p-button-outlined"
              onClick={() => setShowSubscriptionManager(true)}
            /> */}
            <Button
              label="Contact Support"
              icon="pi pi-envelope"
              className="p-button-outlined"
            />
          </div>
        </Card>
</div>
      </div>

      {/* Hotel Information */}
      <div className="col-12 lg:col-8">
        <Card title="Hotel Information" className="mb-4">
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Hotel Name *</label>
              <InputText
                value={hotelData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter hotel name"
                className="w-full"
              />
            </div>

            {/* <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Hotel URL *</label>
              <div className="p-inputgroup">
                <span className="p-inputgroup-addon">yourdomain.com/</span>
                <InputText
                  value={hotelData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="hotel-name"
                  className="w-full"
                />
              </div>
              <small className="text-600">This is your unique hotel URL</small>
            </div> */}

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Description</label>
              <InputTextarea
                value={hotelData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of your hotel"
                rows={3}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Address</label>
              <InputText
                value={hotelData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Street address"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">City</label>
              <InputText
                value={hotelData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Country</label>
              <Dropdown
                value={hotelData.country}
                options={countries}
                onChange={(e) => handleInputChange('country', e.value)}
                placeholder="Select country"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Phone</label>
              <InputText
                value={hotelData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Email</label>
              <InputText
                value={hotelData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="hotel@example.com"
                type="email"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Website</label>
              <InputText
                value={hotelData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://www.yourhotel.com"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* External Links Card */}
        <Card title="External Review Links" className="mb-4">
          <p className="text-600 mb-3">Add links to your TripAdvisor and Google Reviews pages to help guests share positive feedback.</p>
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">
                <div className="flex align-items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="4" fill="#00AF87"/>
                    <path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM12 16.5C9.519 16.5 7.5 14.481 7.5 12C7.5 9.519 9.519 7.5 12 7.5C14.481 7.5 16.5 9.519 16.5 12C16.5 14.481 14.481 16.5 12 16.5Z" fill="white"/>
                    <circle cx="12" cy="12" r="2.5" fill="white"/>
                  </svg>
                  <span>TripAdvisor Link</span>
                </div>
              </label>
              <InputText
                value={hotelData.tripAdvisorLink}
                onChange={(e) => handleInputChange('tripAdvisorLink', e.target.value)}
                placeholder="https://www.tripadvisor.com/..."
                className="w-full"
              />
              <small className="text-600">Optional: Link to your TripAdvisor page</small>
            </div>

            <div className="col-12 mt-3">
              <label className="block text-900 font-medium mb-2">
                <div className="flex align-items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.48 10.92V14.14H17.94C17.72 15.35 16.99 16.38 15.89 17.07V19.28H18.65C20.45 17.64 21.5 15.18 21.5 12.24C21.5 11.56 21.44 10.9 21.32 10.27L12.48 10.92Z" fill="#4285F4"/>
                    <path d="M12.48 10.92V14.14H17.94C17.72 15.35 16.99 16.38 15.89 17.07L18.65 19.28C20.45 17.64 21.5 15.18 21.5 12.24C21.5 11.56 21.44 10.9 21.32 10.27L12.48 10.92Z" fill="#34A853"/>
                    <path d="M5.26 14.2L4.46 14.82L2 17C3.96 20.92 7.7 23.5 12 23.5C14.43 23.5 16.47 22.72 18.02 21.42L15.26 19.21C14.39 19.77 13.3 20.14 12 20.14C9.69 20.14 7.71 18.49 7 16.31L5.26 14.2Z" fill="#FBBC05"/>
                    <path d="M2 7C1.38 8.25 1 9.59 1 11C1 12.41 1.38 13.75 2 15L5.26 12.81C4.86 11.63 4.86 10.37 5.26 9.19L2 7Z" fill="#EA4335"/>
                  </svg>
                  <span>Google Reviews Link</span>
                </div>
              </label>
              <InputText
                value={hotelData.googleReviewsLink}
                onChange={(e) => handleInputChange('googleReviewsLink', e.target.value)}
                placeholder="https://g.page/..."
                className="w-full"
              />
              <small className="text-600">Optional: Link to your Google Reviews page</small>
            </div>
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
      
      <SubscriptionManager
        visible={showSubscriptionManager}
        onHide={() => setShowSubscriptionManager(false)}
      />
    </div>
  );
}
