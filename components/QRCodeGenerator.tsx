"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import QRCode from "qrcode";

interface QRCodeData {
  id: string;
  code: string;
  url: string;
  formId?: string;
  formTitle?: string;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
}

interface FeedbackForm {
  id: string;
  title: string;
  isActive: boolean;
}

interface QRCodeGeneratorProps {
  hotelId: string;
  hotelSlug: string;
}

export default function QRCodeGenerator({ hotelId, hotelSlug }: QRCodeGeneratorProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadData();
  }, [hotelId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load QR codes
      const qrResponse = await fetch(`/api/hotel/qr-codes?hotelId=${hotelId}`);
      if (qrResponse.ok) {
        const qrData = await qrResponse.json();
        setQrCodes(Array.isArray(qrData) ? qrData : []);
      }

      // Load feedback forms
      const formsResponse = await fetch(`/api/hotel/forms?hotelId=${hotelId}`);
      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        setForms(Array.isArray(formsData.data) ? formsData.data : []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("error", "Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const generateQRCode = async () => {
    if (!selectedForm) {
      showToast("warn", "Warning", "Please select a feedback form");
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
          hotelId,
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
        
        showToast("success", "Success", "QR code generated successfully");
        loadData(); // Refresh the list
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to generate QR code");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      showToast("error", "Error", "Failed to generate QR code");
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

  const copyToClipboard = () => {
    if (qrCodeUrl) {
      navigator.clipboard.writeText(qrCodeUrl);
      showToast("success", "Success", "URL copied to clipboard");
    }
  };

  const formOptions = Array.isArray(forms) ? forms.map(form => ({
    label: form.title,
    value: form.id,
  })) : [];

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? "success" : "danger";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="grid">
      {/* Generate QR Code */}
      <div className="col-12 lg:col-6">
        <Card title="Generate QR Code" className="mb-4">
          <div className="flex flex-column gap-4">
            <div>
              <label className="block text-900 font-medium mb-2">Select Feedback Form</label>
              <Dropdown
                value={selectedForm}
                options={formOptions}
                onChange={(e) => setSelectedForm(e.value)}
                placeholder="Choose a form"
                className="w-full"
              />
            </div>
            
            <Button
              label="Generate QR Code"
              icon="pi pi-qrcode"
              onClick={generateQRCode}
              loading={generating}
              disabled={!selectedForm || generating}
              className="w-full"
            />
          </div>
        </Card>

        {/* QR Code Display */}
        {qrCodeDataUrl && (
          <Card title="Generated QR Code" className="mb-4">
            <div className="text-center">
              <img
                src={qrCodeDataUrl}
                alt="QR Code"
                className="mb-4"
                style={{ maxWidth: "100%", height: "auto" }}
              />
              <div className="flex flex-column gap-2">
                <Button
                  label="Download QR Code"
                  icon="pi pi-download"
                  onClick={downloadQRCode}
                  className="p-button-outlined"
                />
                <Button
                  label="Copy URL"
                  icon="pi pi-copy"
                  onClick={copyToClipboard}
                  className="p-button-outlined"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* QR Codes List */}
      <div className="col-12 lg:col-6">
        <Card title="Your QR Codes" className="mb-4">
          {loading ? (
            <div className="text-center py-4">
              <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
              <p>Loading QR codes...</p>
            </div>
          ) : qrCodes.length === 0 ? (
            <div className="text-center py-4">
              <i className="pi pi-qrcode text-4xl text-400 mb-3"></i>
              <p className="text-600">No QR codes generated yet</p>
            </div>
          ) : (
            <div className="flex flex-column gap-3">
              {qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="border-1 surface-border border-round p-3">
                  <div className="flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="m-0 mb-1">{qrCode.formTitle || "General Feedback"}</h6>
                      <p className="text-600 text-sm m-0">
                        Created: {formatDate(qrCode.createdAt)}
                      </p>
                    </div>
                    <div className="flex align-items-center gap-2">
                      <span className={`px-2 py-1 border-round text-xs ${
                        qrCode.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {qrCode.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-content-between align-items-center">
                    <div className="text-sm text-600">
                      Scans: {qrCode.scanCount}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        icon="pi pi-external-link"
                        size="small"
                        className="p-button-outlined p-button-sm"
                        onClick={() => window.open(qrCode.url, "_blank")}
                        tooltip="Open URL"
                      />
                      <Button
                        icon="pi pi-copy"
                        size="small"
                        className="p-button-outlined p-button-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(qrCode.url);
                          showToast("success", "Success", "URL copied to clipboard");
                        }}
                        tooltip="Copy URL"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
