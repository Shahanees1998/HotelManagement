"use client";

import { useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Password } from "primereact/password";

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const toast = useRef<Toast>(null);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      showToast("error", "Error", "Current password is required");
      return false;
    }

    if (!passwordData.newPassword) {
      showToast("error", "Error", "New password is required");
      return false;
    }

    if (passwordData.newPassword.length < 8) {
      showToast("error", "Error", "New password must be at least 8 characters long");
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("error", "Error", "New password and confirmation do not match");
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showToast("error", "Error", "New password must be different from current password");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      // TODO: Implement password change API call
      // await apiClient.changePassword(passwordData);
      
      showToast("success", "Success", "Password changed successfully");
      
      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      showToast("error", "Error", "Failed to change password");
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
            <h1 className="text-3xl font-bold m-0">Change Password</h1>
            <p className="text-600 mt-2 mb-0">Update your account password for better security.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Change Password"
              icon="pi pi-key"
              onClick={handleSave}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Password Change Form */}
      <div className="col-12 lg:col-8">
        <Card title="Password Change" className="mb-4">
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Current Password *</label>
              <Password
                value={passwordData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Enter your current password"
                className="w-full"
                toggleMask
                feedback={false}
              />
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">New Password *</label>
              <Password
                value={passwordData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Enter your new password"
                className="w-full"
                toggleMask
                feedback={true}
              />
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Confirm New Password *</label>
              <Password
                value={passwordData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your new password"
                className="w-full"
                toggleMask
                feedback={false}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Security Tips */}
      <div className="col-12 lg:col-4">
        <Card title="Password Requirements" className="mb-4">
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check text-green-500"></i>
              <span className="text-sm">At least 8 characters long</span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check text-green-500"></i>
              <span className="text-sm">Contains uppercase letters</span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check text-green-500"></i>
              <span className="text-sm">Contains lowercase letters</span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check text-green-500"></i>
              <span className="text-sm">Contains numbers</span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className="pi pi-check text-green-500"></i>
              <span className="text-sm">Contains special characters</span>
            </div>
          </div>
        </Card>

        <Card title="Security Tips">
          <div className="flex flex-column gap-3">
            <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle text-blue-500"></i>
                <span className="text-blue-700 text-sm">
                  <strong>Tip:</strong> Use a unique password that you don't use elsewhere.
                </span>
              </div>
            </div>
            <div className="p-3 border-1 border-orange-200 border-round bg-orange-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-exclamation-triangle text-orange-500"></i>
                <span className="text-orange-700 text-sm">
                  <strong>Warning:</strong> Never share your password with anyone.
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
