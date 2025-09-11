"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    theme: "light",
  });
  const toast = useRef<Toast>(null);

  const languageOptions = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
  ];

  const timezoneOptions = [
    { label: "UTC", value: "UTC" },
    { label: "EST (Eastern Time)", value: "America/New_York" },
    { label: "PST (Pacific Time)", value: "America/Los_Angeles" },
    { label: "CST (Central Time)", value: "America/Chicago" },
    { label: "MST (Mountain Time)", value: "America/Denver" },
  ];

  const dateFormatOptions = [
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
  ];

  const themeOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "Auto", value: "auto" },
  ];

  useEffect(() => {
    // TODO: Load user settings from API
    // For now, use default settings
  }, []);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleDropdownChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement save settings API call
      // await apiClient.updateUserSettings(settings);
      
      showToast("success", "Success", "Settings updated successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("error", "Error", "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: false,
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      theme: "light",
    });
    showToast("info", "Reset", "Settings reset to default values");
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Account Settings</h1>
            <p className="text-600 mt-2 mb-0">Customize your account preferences and notifications.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Reset to Default"
              icon="pi pi-refresh"
              onClick={handleReset}
              className="p-button-outlined"
            />
            <Button
              label="Save Settings"
              icon="pi pi-save"
              onClick={handleSave}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="col-12 lg:col-6">
        <Card title="Notification Preferences" className="mb-4">
          <div className="flex flex-column gap-4">
            <div className="flex align-items-center justify-content-between">
              <div>
                <label className="font-medium">Email Notifications</label>
                <p className="text-600 text-sm m-0">Receive important updates via email</p>
              </div>
              <Checkbox
                checked={settings.emailNotifications}
                onChange={(e) => handleCheckboxChange('emailNotifications', e.checked || false)}
              />
            </div>

            <div className="flex align-items-center justify-content-between">
              <div>
                <label className="font-medium">SMS Notifications</label>
                <p className="text-600 text-sm m-0">Receive urgent alerts via SMS</p>
              </div>
              <Checkbox
                checked={settings.smsNotifications}
                onChange={(e) => handleCheckboxChange('smsNotifications', e.checked || false)}
              />
            </div>

            <div className="flex align-items-center justify-content-between">
              <div>
                <label className="font-medium">Marketing Emails</label>
                <p className="text-600 text-sm m-0">Receive promotional offers and updates</p>
              </div>
              <Checkbox
                checked={settings.marketingEmails}
                onChange={(e) => handleCheckboxChange('marketingEmails', e.checked || false)}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Display Settings */}
      <div className="col-12 lg:col-6">
        <Card title="Display Preferences" className="mb-4">
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Language</label>
              <Dropdown
                value={settings.language}
                options={languageOptions}
                onChange={(e) => handleDropdownChange('language', e.value)}
                placeholder="Select Language"
                className="w-full"
              />
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Timezone</label>
              <Dropdown
                value={settings.timezone}
                options={timezoneOptions}
                onChange={(e) => handleDropdownChange('timezone', e.value)}
                placeholder="Select Timezone"
                className="w-full"
              />
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Date Format</label>
              <Dropdown
                value={settings.dateFormat}
                options={dateFormatOptions}
                onChange={(e) => handleDropdownChange('dateFormat', e.value)}
                placeholder="Select Date Format"
                className="w-full"
              />
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">Theme</label>
              <Dropdown
                value={settings.theme}
                options={themeOptions}
                onChange={(e) => handleDropdownChange('theme', e.value)}
                placeholder="Select Theme"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Privacy Settings */}
      <div className="col-12">
        <Card title="Privacy & Security" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <div className="flex flex-column gap-3">
                <div className="flex align-items-center justify-content-between">
                  <div>
                    <label className="font-medium">Profile Visibility</label>
                    <p className="text-600 text-sm m-0">Make your profile visible to other users</p>
                  </div>
                  <Checkbox checked={true} disabled />
                </div>
                <div className="flex align-items-center justify-content-between">
                  <div>
                    <label className="font-medium">Activity Tracking</label>
                    <p className="text-600 text-sm m-0">Allow tracking of your activity for analytics</p>
                  </div>
                  <Checkbox checked={true} />
                </div>
              </div>
            </div>
            <div className="col-12 md:col-6">
              <div className="flex flex-column gap-2">
                <Button
                  label="Download My Data"
                  icon="pi pi-download"
                  className="p-button-outlined"
                  onClick={() => showToast("info", "Coming Soon", "Data download feature will be available soon")}
                />
                <Button
                  label="Delete Account"
                  icon="pi pi-trash"
                  className="p-button-danger p-button-outlined"
                  onClick={() => showToast("warn", "Warning", "Account deletion is permanent and cannot be undone")}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
