"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface FeedbackForm {
  id: string;
  title: string;
  description?: string;
  layout: string;
  isActive: boolean;
  isPublic: boolean;
}

export default function HotelFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { hotelSlug } = params;
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadHotelData();
  }, [hotelSlug]);

  const loadHotelData = async () => {
    try {
      // Load hotel information
      const hotelResponse = await fetch(`/api/public/hotel/${hotelSlug}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (hotelResponse.ok) {
        const hotelData = await hotelResponse.json();
        setHotel(hotelData.data);
      }

      // Load available feedback forms for this hotel
      const formsResponse = await fetch(`/api/public/hotel/${hotelSlug}/forms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        setForms(formsData.data || []);
      }
    } catch (error) {
      console.error("Error loading hotel data:", error);
      showToast("error", "Error", "Failed to load hotel information");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleFormSelect = (formId: string) => {
    router.push(`/feedback/${hotelSlug}/${formId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="pi pi-spinner pi-spin text-4xl mb-3"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3"></i>
          <h2 className="text-900 mb-2">Hotel Not Found</h2>
          <p className="text-600">The hotel you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Hotel Information */}
        <Card className="mb-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-900 mb-3">{hotel.name}</h1>
            {hotel.description && (
              <p className="text-600 text-lg mb-4">{hotel.description}</p>
            )}
            <div className="flex flex-column md:flex-row gap-4 justify-content-center">
              {hotel.address && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-map-marker text-blue-500"></i>
                  <span className="text-600">{hotel.address}</span>
                </div>
              )}
              {hotel.phone && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-phone text-blue-500"></i>
                  <span className="text-600">{hotel.phone}</span>
                </div>
              )}
              {hotel.email && (
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-envelope text-blue-500"></i>
                  <span className="text-600">{hotel.email}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Feedback Forms */}
        <Card>
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-900 mb-2">Share Your Feedback</h2>
            <p className="text-600">Help us improve by sharing your experience with us</p>
          </div>

          {forms.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-clipboard text-4xl text-gray-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Feedback Forms Available</h3>
              <p className="text-600">There are currently no feedback forms available for this hotel.</p>
            </div>
          ) : (
            <div className="grid">
              {forms.map((form) => (
                <div key={form.id} className="col-12 md:col-6">
                  <Card className="h-full">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-900 mb-2">{form.title}</h3>
                      {form.description && (
                        <p className="text-600 mb-4">{form.description}</p>
                      )}
                      <div className="flex align-items-center justify-content-center gap-2 mb-4">
                        <span className={`badge ${form.layout === 'excellent' ? 'bg-green-100 text-green-800' : form.layout === 'good' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {form.layout.charAt(0).toUpperCase() + form.layout.slice(1)} Layout
                        </span>
                      </div>
                      <Button
                        label="Start Feedback"
                        icon="pi pi-pencil"
                        onClick={() => handleFormSelect(form.id)}
                        className="w-full"
                      />
                    </div>
                  </Card>
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
