"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useAuth } from "@/hooks/useAuth";

export default function UserProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement save API call
      // await apiClient.updateUserProfile(userData);
      
      showToast("success", "Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      showToast("error", "Error", "Failed to update profile");
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
            <h1 className="text-3xl font-bold m-0">Personal Information</h1>
            <p className="text-600 mt-2 mb-0">Manage your personal account details.</p>
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

      {/* Personal Information */}
      <div className="col-12 lg:col-8">
        <Card title="Personal Information" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">First Name *</label>
              <InputText
                value={userData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Last Name *</label>
              <InputText
                value={userData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Email Address *</label>
              <InputText
                value={userData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                type="email"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Phone Number</label>
              <InputText
                value={userData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Account Info */}
      <div className="col-12 lg:col-4">
        <Card title="Account Information" className="mb-4">
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between">
              <span className="text-600">Account Type:</span>
              <span className="font-semibold">Hotel Owner</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Status:</span>
              <span className="font-semibold text-green-500">Active</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Member Since:</span>
              <span className="font-semibold">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">Last Login:</span>
              <span className="font-semibold">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Security">
          <div className="flex flex-column gap-2">
            <Button
              label="Change Password"
              icon="pi pi-key"
              className="p-button-outlined"
              onClick={() => window.location.href = '/hotel/profile/password'}
            />
            <Button
              label="Two-Factor Authentication"
              icon="pi pi-shield"
              className="p-button-outlined"
              onClick={() => showToast("info", "Coming Soon", "Two-factor authentication will be available soon")}
            />
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
