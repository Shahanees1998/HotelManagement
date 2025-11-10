"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import { Avatar } from "primereact/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/TranslationProvider";

export default function UserProfilePage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profileImage: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (user) {
      setUserData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const formatDate = useCallback(
    (dateString?: string | null) => {
      if (!dateString) {
        return t("hotel.profile.user.account.notAvailable");
      }
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric"
        }).format(new Date(dateString));
      } catch {
        return new Date(dateString).toLocaleDateString();
      }
    },
    [locale, t]
  );

  const handleInputChange = (field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        showToast("success", t("common.success"), t("hotel.profile.user.toasts.saveSuccess"));
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.profile.user.toasts.saveError"));
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      showToast("error", t("common.error"), t("hotel.profile.user.toasts.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: any) => {
    const file = event.files[0];
    if (!file || !user?.id) return;

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast("error", t("common.error"), t("hotel.profile.user.toasts.imageTypeError"));
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      showToast("error", t("common.error"), t("hotel.profile.user.toasts.imageSizeError"));
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const response = await fetch('/api/users/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(prev => ({
          ...prev,
          profileImage: data.imageUrl
        }));
        
        // Dispatch custom event to update topbar
        window.dispatchEvent(new CustomEvent('profile-updated'));
        
        showToast("success", t("common.success"), t("hotel.profile.user.toasts.imageSuccess"));
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.profile.user.toasts.imageError"));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("error", t("common.error"), t("hotel.profile.user.toasts.imageError"));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">{t("hotel.profile.user.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.profile.user.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.profile.user.buttons.save")}
              icon="pi pi-save"
              onClick={handleSave}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Profile Image */}
      <div className="col-12 lg:col-4">
        <Card title={t("hotel.profile.user.images.cardTitle")} className="mb-4 p-4">
          <div className="flex flex-column align-items-center gap-3">
            <Avatar
              image={userData.profileImage}
              icon={uploadingImage ? "pi pi-spinner pi-spin" : "pi pi-user"}
              size="xlarge"
              shape="circle"
              className="mb-3"
            />
            <FileUpload
              mode="basic"
              name="profileImage"
              accept="image/*"
              maxFileSize={5000000}
              customUpload
              uploadHandler={handleImageUpload}
              chooseLabel={uploadingImage ? t("hotel.profile.user.buttons.uploading") : t("hotel.profile.user.buttons.changePhoto")}
              className="w-full"
              auto
              disabled={uploadingImage}
            />
            <small className="text-600 text-center">
              {t("hotel.profile.user.images.hint")}
            </small>
          </div>
        </Card>
      </div>

      {/* Personal Information */}
      <div className="col-12 lg:col-8">
        <Card title={t("hotel.profile.user.cards.personalInfo")} className="mb-4 p-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.user.fields.firstName")}</label>
              <InputText
                value={userData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder={t("hotel.profile.user.placeholders.firstName")}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.user.fields.lastName")}</label>
              <InputText
                value={userData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder={t("hotel.profile.user.placeholders.lastName")}
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.user.fields.email")}</label>
              <InputText
                value={userData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder={t("hotel.profile.user.placeholders.email")}
                type="email"
                className="w-full"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.user.fields.phone")}</label>
              <InputText
                value={userData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder={t("hotel.profile.user.placeholders.phone")}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Account Info */}
      <div className="col-12 lg:col-6">
        <Card title={t("hotel.profile.user.cards.accountInfo")} className="mb-4 p-4">
          <div className="flex flex-column gap-3">
            <div className="flex justify-content-between">
              <span className="text-600">{t("hotel.profile.user.account.type")}</span>
              <span className="font-semibold">{t("hotel.profile.user.account.typeValue")}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">{t("hotel.profile.user.account.status")}</span>
              <span className="font-semibold text-green-500">{t("hotel.profile.user.account.statusActive")}</span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">{t("hotel.profile.user.account.memberSince")}</span>
              <span className="font-semibold">
                {formatDate(user?.createdAt)}
              </span>
            </div>
            <div className="flex justify-content-between">
              <span className="text-600">{t("hotel.profile.user.account.lastLogin")}</span>
              <span className="font-semibold">
                {formatDate(user?.lastLogin)}
              </span>
            </div>
          </div>
        </Card>
</div>
<div className="col-12 lg:col-6">

        <Card title={t("hotel.profile.user.cards.security")} className="mb-4 p-5">
          <div className="flex flex-column gap-2">
            <Button
              label={t("hotel.profile.user.buttons.changePassword")}
              icon="pi pi-key"
              className="p-button-outlined"
              onClick={() => window.location.href = '/hotel/profile/password'}
            />
            <Button
              label={t("hotel.profile.user.buttons.twoFactor")}
              icon="pi pi-shield"
              className="p-button-outlined mt-3"
              onClick={() => showToast("info", t("common.info"), t("hotel.profile.user.toasts.twoFactorInfo"))}
            />
          </div>
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
