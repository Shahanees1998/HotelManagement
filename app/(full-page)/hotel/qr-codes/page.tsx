"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import QRCode from "qrcode";
import { useI18n } from "@/i18n/TranslationProvider";

interface FeedbackForm {
  id: string;
  title: string;
  isActive: boolean;
  hasQrCode?: boolean;
  qrCode?: {
    id: string;
    code: string;
    url: string;
    scanCount: number;
    isActive: boolean;
    createdAt: string;
  };
}

export default function HotelQRCodes() {
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useRef<Toast>(null);
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hotel/forms?hotelId=${user?.hotelId}`);
      if (response.ok) {
        const data = await response.json();
        const formsData = Array.isArray(data.data) ? data.data : [];
        
        // Check for existing QR codes for each form
        const formsWithQrStatus = await Promise.all(
          formsData.map(async (form: FeedbackForm) => {
            try {
              const qrResponse = await fetch(`/api/hotel/qr-codes/by-form/${form.id}`);
              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                return {
                  ...form,
                  hasQrCode: true,
                  qrCode: qrData
                };
              } else {
                return {
                  ...form,
                  hasQrCode: false
                };
              }
            } catch (error) {
              return {
                ...form,
                hasQrCode: false
              };
            }
          })
        );
        
        setForms(formsWithQrStatus);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const generateQRCode = async () => {
    if (!selectedForm) {
      showToast("warn", t("Warning"), t("Please select a feedback form"));
      return;
    }

    // Check if form already has QR code
    const selectedFormData = forms.find(form => form.id === selectedForm);
    if (selectedFormData?.hasQrCode && selectedFormData.qrCode) {
      // Show existing QR code
      setQrCodeUrl(selectedFormData.qrCode.url);
      
      // Generate QR code image
      const qrDataUrl = await QRCode.toDataURL(selectedFormData.qrCode.url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
      
        showToast("info", t("Info"), t("Showing existing QR code for this form"));
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/hotel/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hotelId: user?.hotelId,
          formId: selectedForm,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.url);
        
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
        
        showToast("success", t("Success"), t("QR code generated successfully"));
        loadForms(); // Refresh forms to update QR code status
      } else {
        const errorData = await response.json();
        if (response.status === 409 && errorData.existingQrCode) {
          // QR code already exists, show it
          setQrCodeUrl(errorData.existingQrCode.url);
          
          const qrDataUrl = await QRCode.toDataURL(errorData.existingQrCode.url, {
            width: 300,
            margin: 2,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          setQrCodeDataUrl(qrDataUrl);
          
          showToast("info", t("Info"), t("QR code already exists for this form"));
          loadForms(); // Refresh forms to update QR code status
        } else {
          showToast("error", t("Error"), errorData.error || t("Failed to generate QR code"));
        }
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      showToast("error", t("Error"), t("Failed to generate QR code"));
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement("a");
      link.download = `qr-code-${selectedForm}.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const copyQrUrl = async () => {
    if (!qrCodeUrl) return;
    try {
      await navigator.clipboard.writeText(qrCodeUrl);
      showToast("success", t("Copied"), t("QR URL copied to clipboard"));
    } catch (e) {
      showToast("error", t("Error"), t("Failed to copy URL"));
    }
  };

  const formOptions = useMemo(() => forms.map(form => ({
    label: `${form.title}${form.hasQrCode ? ` (${t("QR Code Generated")})` : ''}`,
    value: form.id,
  })), [forms, t]);

  return (
    <div style={{ backgroundColor: '#fcfcfc', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold m-0 mb-2" style={{ color: '#333333' }}>{t("Your QR Codes")}</h1>
        <p className="text-lg m-0" style={{ color: '#4a4a4a' }}>{t("Generate QR codes for your feedback forms.")}</p>
      </div>

      <div className="grid">
        {/* Generate QR Code Card */}
        <div className="col-12 flex justify-content-center">
          <Card 
          className="col-8"
            style={{ 
              border: 'none',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
              backgroundColor: '#ffffff',
              borderRadius: '12px'
            }}
          >
            <div className="p-4">
              <h2 className="text-2xl font-bold m-0 mb-4" style={{ color: '#333333' }}>{t("Generate QR Code")}</h2>
              
              <div className="mb-4">
                <label className="block text-900 font-medium mb-2" style={{ color: '#333333' }}>
                  {t("Select Feedback Form*")}
                </label>
                <Dropdown
                  value={selectedForm}
                  options={formOptions}
                  onChange={(e) => {
                    setSelectedForm(e.value);
                    // Auto-show QR code if form already has one
                    const selectedFormData = forms.find(form => form.id === e.value);
                    if (selectedFormData?.hasQrCode && selectedFormData.qrCode) {
                      setQrCodeUrl(selectedFormData.qrCode.url);
                      QRCode.toDataURL(selectedFormData.qrCode.url, {
                        width: 300,
                        margin: 2,
                        color: {
                          dark: "#000000",
                          light: "#FFFFFF",
                        },
                      }).then(qrDataUrl => {
                        setQrCodeDataUrl(qrDataUrl);
                      });
                    } else {
                      // Clear QR code display if form doesn't have one
                      setQrCodeUrl("");
                      setQrCodeDataUrl("");
                    }
                  }}
                  placeholder={t("Select form from the list")}
                  className="w-full"
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                  }}
                />
              </div>
              
              {/* Status Message */}
              {selectedForm && (
                <div className="mb-4">
                  {forms.find(f => f.id === selectedForm)?.hasQrCode ? (
                    <div className="flex align-items-center gap-2 p-3" style={{ backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                      <i className="pi pi-check-circle text-green-600"></i>
                      <span className="text-green-700 font-medium">{t("QR Code already generated for this form")}</span>
                    </div>
                  ) : (
                    <div className="flex align-items-center gap-2 p-3" style={{ backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                      <i className="pi pi-info-circle text-yellow-600"></i>
                      <span className="text-yellow-700 font-medium">{t(`No QR code generated yet. Click "Generate QR Code" to create one.`)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                label={selectedForm && forms.find(f => f.id === selectedForm)?.hasQrCode ? t("Show QR Code") : t("Generate QR Code")}
                onClick={generateQRCode}
                loading={generating}
                disabled={!selectedForm || generating}
                className="w-full"
                style={{
                  backgroundColor: selectedForm && forms.find(f => f.id === selectedForm)?.hasQrCode ? '#28a745' : '#1a2b48',
                  borderColor: selectedForm && forms.find(f => f.id === selectedForm)?.hasQrCode ? '#28a745' : '#1a2b48',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              />
            </div>
          </Card>
        </div>

        {/* QR Code Display Card */}
        <div className="col-12 flex justify-content-center">
          <Card 
          className="col-8"
            style={{ 
              border: 'none',
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
              backgroundColor: '#ffffff',
              borderRadius: '12px'
            }}
          >
            <div className="p-4">
              <h2 className="text-2xl font-bold m-0 mb-4" style={{ color: '#333333' }}>{t("Your QR Code")}</h2>
              
              {qrCodeDataUrl ? (
                <div className="text-center">
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
                  <Button
                    label={t("Download QR Code")}
                    onClick={downloadQRCode}
                    className="w-full"
                    style={{
                      backgroundColor: '#1a2b48',
                      borderColor: '#1a2b48',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                  {qrCodeUrl && (
                    <div className="mt-3" style={{ position: 'relative', textAlign: 'left' }}>
                      <div className="p-3" style={{
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        wordBreak: 'break-all',
                        position: 'relative',
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center'
                      }}>
                        <span>{qrCodeUrl}</span>
                        <Button
                          icon="pi pi-copy"
                          onClick={copyQrUrl}
                          className="p-button-rounded"
                          style={{
                            position: 'absolute',
                            top: '0px',
                            right: '-20px',
                            backgroundColor: '#1a2b48',
                            borderColor: '#1a2b48',
                            borderRadius: '8px',
                            padding: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}
                          aria-label={t("Copy URL")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="pi pi-qrcode text-6xl mb-4" style={{ color: '#e0e0e0' }}></i>
                  <p className="text-lg" style={{ color: '#a0a0a0' }}>{t("Generate a QR code to see it here")}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
