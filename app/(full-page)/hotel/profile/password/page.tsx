"use client";

import { useState, useRef, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { Dialog } from "primereact/dialog";
import { useI18n } from "@/i18n/TranslationProvider";

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const toast = useRef<Toast>(null);
  const { t } = useI18n();

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

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
    if (passwordStrength < 40) return t("hotel.profile.password.strength.weak");
    if (passwordStrength < 80) return t("hotel.profile.password.strength.medium");
    return t("hotel.profile.password.strength.strong");
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return '#ff6b6b';
    if (passwordStrength < 80) return '#ffa726';
    return '#66bb6a';
  };

  const validatePassword = () => {
    if (!passwordData.currentPassword) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.currentRequired"));
      return false;
    }

    if (!passwordData.newPassword) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.newRequired"));
      return false;
    }

    if (passwordData.newPassword.length < 8) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.minLength"));
      return false;
    }

    // Check for password strength
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.complexity"));
      return false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.confirmMismatch"));
      return false;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      showToast("error", t("common.error"), t("hotel.profile.password.validation.sameAsCurrent"));
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
        showToast("success", t("common.success"), t("hotel.profile.password.toasts.changeSuccess"));
        
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordStrength(0);
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.profile.password.toasts.changeError"));
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showToast("error", t("common.error"), t("hotel.profile.password.toasts.changeError"));
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
            <h1 className="text-3xl font-bold m-0">{t("hotel.profile.password.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.profile.password.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.profile.password.buttons.change")}
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
        <Card title={t("hotel.profile.password.cardTitle")} className="mb-4">
          <div className="grid">
            <div className="col-12">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.password.fields.current")}</label>
              <div style={{ position: "relative" }} className="w-full mb-1">
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-lock"></i>
                  <InputText
                    type={showPasswords.current ? "text" : "password"}
                    className="w-full"
                    placeholder={t("hotel.profile.password.placeholders.current")}
                    value={passwordData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    style={{ paddingRight: "2.5rem" }}
                  />
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
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
                aria-label={showPasswords.current ? t("hotel.profile.password.accessibility.hide") : t("hotel.profile.password.accessibility.show")}
                >
                  <i className={`pi ${showPasswords.current ? "pi-eye-slash" : "pi-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="col-12">
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.password.fields.new")}</label>
              <div style={{ position: "relative" }} className="w-full mb-1">
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-lock"></i>
                  <InputText
                    type={showPasswords.new ? "text" : "password"}
                    className="w-full"
                    placeholder={t("hotel.profile.password.placeholders.new")}
                    value={passwordData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    style={{ paddingRight: "2.5rem" }}
                  />
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
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
                aria-label={showPasswords.new ? t("hotel.profile.password.accessibility.hide") : t("hotel.profile.password.accessibility.show")}
                >
                  <i className={`pi ${showPasswords.new ? "pi-eye-slash" : "pi-eye"}`}></i>
                </button>
              </div>
              {passwordData.newPassword && (
                <div className="mt-2">
                  <div className="flex justify-content-between align-items-center mb-1">
                    <span className="text-sm text-600">{t("hotel.profile.password.strength.label")}</span>
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
              <label className="block text-900 font-medium mb-2">{t("hotel.profile.password.fields.confirm")}</label>
              <div style={{ position: "relative" }} className="w-full mb-1">
                <span className="p-input-icon-left w-full">
                  <i className="pi pi-lock"></i>
                  <InputText
                    type={showPasswords.confirm ? "text" : "password"}
                    className="w-full"
                    placeholder={t("hotel.profile.password.placeholders.confirm")}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    style={{ paddingRight: "2.5rem" }}
                  />
                </span>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
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
                aria-label={showPasswords.confirm ? t("hotel.profile.password.accessibility.hide") : t("hotel.profile.password.accessibility.show")}
                >
                  <i className={`pi ${showPasswords.confirm ? "pi-eye-slash" : "pi-eye"}`}></i>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Tips */}
      <div className="col-12 lg:col-4">
        <Card title={t("hotel.profile.password.requirements.title")} className="mb-4">
          <div className="flex flex-column gap-3">
            <div className="flex align-items-center gap-2">
              <i className={`pi ${passwordData.newPassword.length >= 8 ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-600'}`}>
                {t("hotel.profile.password.requirements.minLength")}
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[A-Z]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                {t("hotel.profile.password.requirements.uppercase")}
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[a-z]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[a-z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                {t("hotel.profile.password.requirements.lowercase")}
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/\d/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/\d/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                {t("hotel.profile.password.requirements.numbers")}
              </span>
            </div>
            <div className="flex align-items-center gap-2">
              <i className={`pi ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'pi-check text-green-500' : 'pi-times text-red-500'}`}></i>
              <span className={`text-sm ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-600'}`}>
                {t("hotel.profile.password.requirements.special")}
              </span>
            </div>
          </div>
        </Card>

        <Card title={t("hotel.profile.password.tips.title")}>
          <div className="flex flex-column gap-3">
            <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-info-circle text-blue-500"></i>
                <span className="text-blue-700 text-sm">
                  {t("hotel.profile.password.tips.tip")}
                </span>
              </div>
            </div>
            <div className="p-3 border-1 border-orange-200 border-round bg-orange-50">
              <div className="flex align-items-center gap-2">
                <i className="pi pi-exclamation-triangle text-orange-500"></i>
                <span className="text-orange-700 text-sm">
                  {t("hotel.profile.password.tips.warning")}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        header={t("hotel.profile.password.confirm.title")}
        visible={showConfirmDialog}
        style={{ width: '25vw' }}
        onHide={() => setShowConfirmDialog(false)}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.profile.password.buttons.cancel")}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowConfirmDialog(false)}
            />
            <Button
              label={t("hotel.profile.password.buttons.confirmChange")}
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
            <p className="m-0 font-semibold">{t("hotel.profile.password.confirm.message")}</p>
            <p className="m-0 text-600 text-sm mt-1">
              {t("hotel.profile.password.confirm.warning")}
            </p>
          </div>
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
