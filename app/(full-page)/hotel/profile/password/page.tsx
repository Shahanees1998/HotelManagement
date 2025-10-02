"use client";

import { useState, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { Password } from "primereact/password";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const toast = useRef<Toast>(null);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));

    // Calculate password strength when new password changes
    if (field === 'newPassword') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Calculate strength based on criteria met
    Object.values(checks).forEach(check => {
      if (check) strength += 20;
    });

    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 80) return 'Medium';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff6b6b';
    if (passwordStrength < 80) return '#ffa726';
    return '#66bb6a';
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

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      showToast("error", "Error", "New password must contain uppercase, lowercase, numbers, and special characters");
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

  const handleSave = () => {
    if (!validatePassword()) return;
    setShowConfirmDialog(true);
  };

  const confirmPasswordChange = async () => {
    setLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        showToast("success", "Success", "Password changed successfully");
        
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordStrength(0);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to change password");
      }
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
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex justify-content-between align-items-center mb-1">
                    <span className="text-sm text-600">Password Strength:</span>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: getPasswordStrengthColor() }}
                    >
                      {getPasswordStrengthLabel()}
                    </span>
                  </div>
                  <ProgressBar 
                    value={passwordStrength} 
                    style={{ height: '6px' }}
                    color={getPasswordStrengthColor()}
                  />
                </div>
              )}
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
              <i className={`pi ${passwordData.newPassword.length >= 8 ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-600'}`}>
                At least 8 characters long
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[A-Z]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                Contains uppercase letters
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[a-z]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                Contains lowercase letters
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/\d/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                Contains numbers
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                Contains special characters
              </span>
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

      {/* Confirmation Dialog */}
      <Dialog
        header="Confirm Password Change"
        visible={showConfirmDialog}
        style={{ width: '25vw' }}
        onHide={() => setShowConfirmDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowConfirmDialog(false)}
            />
            <Button
              label="Change Password"
              icon="pi pi-key"
              className="p-button-danger"
              onClick={confirmPasswordChange}
              loading={loading}
            />
          </div>
        }
      >
        <div className="flex align-items-center gap-3 mb-3">
          <i className="pi pi-exclamation-triangle text-2xl text-orange-500"></i>
          <div>
            <p className="m-0 font-semibold">Are you sure you want to change your password?</p>
            <p className="m-0 text-600 text-sm mt-1">
              This action will log you out of all devices and you'll need to log in again.
            </p>
          </div>
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
