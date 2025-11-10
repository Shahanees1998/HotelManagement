"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { useRef } from "react";
import QRCode from "qrcode";
import { useAuth } from "@/hooks/useAuth";
import FeedbackFormBuilder from "@/components/FeedbackFormBuilder";
import { apiClient } from "@/lib/apiClient";
import { useI18n } from "@/i18n/TranslationProvider";

interface FeedbackForm {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  isPublic: boolean;
  layout: string;
  questionsCount: number;
  totalResponses: number;
  createdAt: string;
  updatedAt: string;
}

export default function HotelForms() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [existingForm, setExistingForm] = useState<FeedbackForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [previewFormId, setPreviewFormId] = useState<string | null>(null);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrFormTitle, setQrFormTitle] = useState<string>("");
  const toast = useRef<Toast>(null);

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadForm = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelForms({
        status: "",
        search: "",
        page: 1,
        limit: 1,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const formsData = (response as any).data || [];
      if (formsData.length > 0) {
        setExistingForm(formsData[0]);
      } else {
        setExistingForm(null);
      }
    } catch (error) {
      console.error("Error loading form:", error);
      showToast("error", t("common.error"), t("hotel.forms.toasts.loadError"));
      setExistingForm(null);
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleEditForm = useCallback(() => {
    if (existingForm) {
      setShowFormBuilder(true);
    }
  }, [existingForm]);

  const handlePreviewForm = useCallback((formId: string) => {
    // Show preview of the public feedback form
    if (user?.hotelSlug) {
      setPreviewFormId(formId);
    } else {
      showToast("error", t("common.error"), t("hotel.forms.toasts.slugMissing"));
    }
  }, [user?.hotelSlug, showToast, t]);

  const handleFormSaved = useCallback(async (form: any) => {
    console.log("handleFormSaved called with:", form);
    try {
      const method = existingForm ? 'PUT' : 'POST';
      const url = existingForm ? `/api/hotel/forms/${existingForm.id}` : '/api/hotel/forms';

      console.log("Saving form to:", url, "with method:", method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form),
      });

      const data = await response.json();
      console.log("Response:", response.status, data);

      if (response.ok) {
        console.log("Form saved successfully");
        // Close the form builder to show the form details view
        setShowFormBuilder(false);
        // Refresh the form data to show the newly created/updated form
        await loadForm();
        const successMessage = existingForm
          ? t("hotel.forms.toasts.updateSuccess")
          : t("hotel.forms.toasts.createSuccess");
        showToast("success", t("common.success"), successMessage);
      } else {
        // Show the actual error message from the API
        const errorMessage = data.error || t("hotel.forms.toasts.saveError");
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      // Extract and show the actual error message
      const errorMessage = error instanceof Error ? error.message : t("hotel.forms.toasts.saveError");
      showToast("error", t("common.error"), errorMessage);
    }
  }, [existingForm, showToast, loadForm, t]);

  const handleShowQrCode = useCallback(async (formId: string, formTitle: string) => {
    try {
      // First try to get existing QR code
      const qrResponse = await fetch(`/api/hotel/qr-codes/by-form/${formId}`);
      
      if (qrResponse.ok) {
        // QR code exists, show it
        const qrData = await qrResponse.json();
        setQrCodeUrl(qrData.url);
        setQrFormTitle(formTitle);
        
        // Generate QR code image
        const qrDataUrl = await QRCode.toDataURL(qrData.url, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(qrDataUrl);
        setShowQrDialog(true);
      } else {
        // QR code doesn't exist, generate it
        const response = await fetch("/api/hotel/qr-codes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hotelId: user?.hotelId,
            formId: formId,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setQrCodeUrl(data.url);
          setQrFormTitle(formTitle);
          
          // Generate QR code image
          const qrDataUrl = await QRCode.toDataURL(data.url, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeDataUrl(qrDataUrl);
          setShowQrDialog(true);
          showToast("success", t("common.success"), t("hotel.forms.toasts.qrGenerated"));
        } else {
          const errorData = await response.json();
          if (response.status === 409 && errorData.existingQrCode) {
            // QR code already exists, show it
            setQrCodeUrl(errorData.existingQrCode.url);
            setQrFormTitle(formTitle);
            
            const qrDataUrl = await QRCode.toDataURL(errorData.existingQrCode.url, {
              width: 300,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });
            setQrCodeDataUrl(qrDataUrl);
            setShowQrDialog(true);
            showToast("info", t("common.info"), t("hotel.forms.toasts.qrExists"));
          } else {
            throw new Error(errorData.error || t("hotel.forms.toasts.qrError"));
          }
        }
      }
    } catch (error) {
      console.error("Error handling QR code:", error);
      showToast("error", t("common.error"), t("hotel.forms.toasts.qrError"));
    }
  }, [user?.hotelId, showToast, t]);

  const downloadQrCode = useCallback(() => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.download = `qr-code-${qrFormTitle.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  }, [qrCodeDataUrl, qrFormTitle]);

  const copyQrUrl = useCallback(async () => {
    if (!qrCodeUrl) {
      showToast("warn", t("common.warning"), t("hotel.forms.toasts.noUrl"));
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(qrCodeUrl);
        showToast("success", t("common.success"), t("hotel.forms.toasts.copiedDetail"));
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = qrCodeUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showToast("success", t("common.success"), t("hotel.forms.toasts.copiedDetail"));
          } else {
            throw new Error('Copy command failed');
          }
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("error", t("common.error"), t("hotel.forms.toasts.copyError"));
    }
  }, [qrCodeUrl, showToast, t]);

  // Delete functionality removed - forms cannot be deleted, only updated

  const getStatusSeverity = useCallback((isActive: boolean) => {
    return isActive ? "success" : "danger";
  }, []);

  const dateFormatter = useMemo(() => {
    const localeMap: Record<string, string> = {
      en: "en-US",
      ar: "ar-EG",
      zh: "zh-CN",
    };
    return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [locale]);

  const formatDate = useCallback((dateString: string) => {
    return dateFormatter.format(new Date(dateString));
  }, [dateFormatter]);

  // Prevent body scroll when preview is active
  useEffect(() => {
    if (previewFormId) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [previewFormId]);

  if (showFormBuilder) {
    return (
      <div className="grid">
        <div className="col-12">
          <FeedbackFormBuilder
            formId={existingForm?.id || undefined}
            onSave={handleFormSaved}
            onCancel={() => setShowFormBuilder(false)}
          />
        </div>
      </div>
    );
  }

  if (previewFormId && user?.hotelSlug) {
    const publicFormUrl = `/feedback/${user.hotelSlug}/${previewFormId}`;
    
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa',
        zIndex: 1000
      }}>
        <div className="flex align-items-center gap-3 mb-4" style={{ padding: '1rem', flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <Button
            icon="pi pi-arrow-left"
            className="p-button-text"
            onClick={() => {
              setPreviewFormId(null);
            }}
            tooltip={t("hotel.forms.preview.tooltipBack")}
          />
          <h1 className="text-3xl font-bold m-0">{t("hotel.forms.preview.title")}</h1>
          <Tag value={t("hotel.forms.preview.tag")} severity="info" className="ml-auto" />
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '0 1rem 1rem 1rem' }}>
            <iframe
              id={`preview-iframe-${previewFormId}`}
              src={publicFormUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px',
                flex: 1,
                overflow: 'auto'
              }}
              title="Form Preview"
              scrolling="yes"
              onLoad={() => {
                // Inject CSS to disable form interactions while allowing scroll
                const iframe = document.getElementById(`preview-iframe-${previewFormId}`) as HTMLIFrameElement;
                try {
                  if (iframe?.contentDocument) {
                    const style = iframe.contentDocument.createElement('style');
                    style.textContent = `
                      input, textarea, button, select,
                      .p-rating, .p-rating-icon, .p-rating-icon-pi-star,
                      [role="button"], [role="slider"],
                      .p-checkbox, .p-radiobutton,
                      .feedback-button, button.p-button,
                      span[style*="cursor: pointer"],
                      .p-float-label input,
                      .p-float-label label {
                        pointer-events: none !important;
                        cursor: not-allowed !important;
                      }
                      span[style*="color: #facc15"], 
                      span[style*="cursor: pointer"] {
                        pointer-events: none !important;
                        cursor: not-allowed !important;
                      }
                      body, html {
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                      }
                      body {
                        user-select: text !important;
                        -webkit-user-select: text !important;
                        -moz-user-select: text !important;
                        -ms-user-select: text !important;
                      }
                    `;
                    iframe.contentDocument.head.appendChild(style);
                  }
                } catch (error) {
                  console.error('Error injecting preview styles:', error);
                }
              }}
            />
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">{t("hotel.forms.header.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.forms.header.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Form Info Card */}
      <div className="col-12">
        {loading ? (
          <Card>
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p className="text-600">{t("hotel.forms.states.loading")}</p>
              </div>
            </div>
          </Card>
        ) : existingForm ? (
          <Card className="shadow-2">
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="mb-4">
                  <label className="text-600 text-sm font-semibold block mb-2" style={{ color: '#64748b' }}>{t("hotel.forms.fields.title")}</label>
                  <p className="text-900 font-semibold text-xl m-0" style={{ color: '#1e293b' }}>{existingForm.title}</p>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="mb-4">
                  <label className="text-600 text-sm font-semibold block mb-2" style={{ color: '#64748b' }}>{t("hotel.forms.fields.status")}</label>
                  <div className="mt-2">
                    <Tag 
                      value={existingForm.isActive ? t("hotel.forms.fields.active") : t("hotel.forms.fields.inactive")} 
                      severity={getStatusSeverity(existingForm.isActive) as any} 
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="mb-4">
                  <label className="text-600 text-sm font-semibold block mb-2" style={{ color: '#64748b' }}>{t("hotel.forms.fields.description")}</label>
                  <p className="text-600 m-0" style={{ lineHeight: '1.6', color: '#64748b' }}>
                    {existingForm.description || t("hotel.forms.fields.noDescription")}
                  </p>
                </div>
              </div>
              <div className="col-12 md:col-6">
                <div className="mb-4">
                  <label className="text-600 text-sm font-semibold block mb-2" style={{ color: '#64748b' }}>{t("hotel.forms.fields.totalResponses")}</label>
                  <p className="text-900 font-bold text-2xl m-0" style={{ color: '#1e293b' }}>{existingForm.totalResponses}</p>
                </div>
              </div>
              <div className="col-12">
                <div className="flex gap-3 mt-4 pt-4 border-top-1 surface-border">
                  <Button
                    label={t("hotel.forms.buttons.edit")}
                    icon="pi pi-pencil"
                    onClick={handleEditForm}
                    className="p-button-primary"
                    style={{ minWidth: '140px' }}
                  />
                  <Button
                    label={t("hotel.forms.buttons.preview")}
                    icon="pi pi-eye"
                    onClick={() => handlePreviewForm(existingForm.id)}
                    className="p-button-outlined"
                    style={{ minWidth: '140px' }}
                  />
                  <Button
                    label={t("hotel.forms.buttons.showQr")}
                    icon="pi pi-qrcode"
                    onClick={() => handleShowQrCode(existingForm.id, existingForm.title)}
                    className="p-button-outlined"
                    style={{ minWidth: '140px' }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="shadow-2">
            <div className="text-center py-8">
              <i className="pi pi-file-edit text-5xl text-400 mb-4" style={{ color: '#94a3b8' }}></i>
              <h3 className="text-900 mb-2" style={{ fontSize: '1.5rem', fontWeight: '600' }}>{t("hotel.forms.empty.title")}</h3>
              <p className="text-600 mb-5" style={{ fontSize: '1rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                {t("hotel.forms.empty.description")}
              </p>
              <Button
                label={t("hotel.forms.buttons.create")}
                icon="pi pi-plus"
                onClick={() => setShowFormBuilder(true)}
                className="p-button-primary"
                style={{ minWidth: '160px' }}
              />
            </div>
          </Card>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog
        header={t("hotel.forms.qrDialog.title").replace("{title}", qrFormTitle)}
        visible={showQrDialog}
        style={{ width: '400px' }}
        onHide={() => setShowQrDialog(false)}
        modal
      >
        <div className="text-center">
          {qrCodeDataUrl && (
            <>
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="mb-4"
                style={{ 
                  maxWidth: "100%", 
                  height: "auto",
                  borderRadius: '8px'
                }}
              />
              <div className="flex flex-column gap-2">
                <Button
                  label={t("hotel.forms.buttons.downloadQr")}
                  icon="pi pi-download"
                  onClick={downloadQrCode}
                  className="w-full"
                />
                <Button
                  label={t("hotel.forms.buttons.copyUrl")}
                  icon="pi pi-copy"
                  onClick={copyQrUrl}
                  className="p-button-outlined w-full"
                />
              </div>
            </>
          )}
        </div>
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
