"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
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

      {/* Hotel Information */}
      <div className="col-12 lg:col-8">
        <Card title="Hotel Information" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Hotel Name *</label>
              <InputText
                value={hotelData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter hotel name"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
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
            </div>

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
      </div>

      {/* Quick Info */}
      <div className="col-12 lg:col-4">
        <Card title="Quick Info" className="mb-4">
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between">
              <span className="text-600">Status:</span>
              <Badge 
                value={subscriptionData.status === 'TRIAL' ? 'Trial' : subscriptionData.status === 'ACTIVE' ? 'Active' : subscriptionData.status}
                severity={subscriptionData.status === 'TRIAL' ? 'info' : subscriptionData.status === 'ACTIVE' ? 'success' : 'warning'}
              />
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Subscription:</span>
              <span className="font-semibold">{subscriptionData.status}</span>
            </div>
            {subscriptionData.status === 'TRIAL' && (
              <div className="flex justify-content-between">
                <span className="text-600">Trial Ends:</span>
                <span className="font-semibold">{subscriptionData.trialDaysRemaining} days</span>
              </div>
            )}
            <div className="flex justify-content-between">
              <span className="text-600">Total Reviews:</span>
              <span className="font-semibold">{subscriptionData.totalReviews}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Average Rating:</span>
              <span className="font-semibold">{subscriptionData.averageRating.toFixed(1)} ⭐</span>
            </div>
          </div>
        </Card>

        <Card title="Actions">
          <div className="flex flex-column gap-2">
            <Button
              label="View Public Page"
              icon="pi pi-external-link"
              className="p-button-outlined"
              onClick={() => window.open(`/feedback/${hotelData.slug}`, '_blank')}
            />
            <Button
              label="Manage Subscription"
              icon="pi pi-credit-card"
              className="p-button-outlined"
              onClick={() => setShowSubscriptionManager(true)}
            />
            <Button
              label="Contact Support"
              icon="pi pi-envelope"
              className="p-button-outlined"
            />
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
