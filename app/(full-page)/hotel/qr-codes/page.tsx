"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import QRCodeGenerator from "@/components/QRCodeGenerator";

export default function HotelQRCodes() {
  const { user } = useAuth();
  const toast = useRef<Toast>(null);

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">QR Codes</h1>
            <p className="text-600 mt-2 mb-0">Generate QR codes for your feedback forms.</p>
          </div>
        </div>
      </div>

      {/* QR Code Generator */}
      <div className="col-12">
        <QRCodeGenerator 
          hotelId={user?.hotelId || ""} 
          hotelSlug={user?.hotelSlug || ""} 
        />
      </div>

      <Toast ref={toast} />
    </div>
  );
}
