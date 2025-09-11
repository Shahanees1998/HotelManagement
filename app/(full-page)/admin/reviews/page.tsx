"use client";

import { useState, useEffect } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";

interface Review {
  id: string;
  hotelName: string;
  hotelSlug: string;
  guestName: string;
  guestEmail: string;
  overallRating: number;
  status: string;
  isPublic: boolean;
  isShared: boolean;
  formTitle: string;
  submittedAt: string;
  publishedAt?: string;
}

export default function AdminReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    rating: "",
    hotel: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadReviews();
  }, [filters]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminReviews({
        status: filters.status,
        rating: filters.rating,
        hotel: filters.hotel,
        search: filters.search,
      });
      setReviews(response.data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      showToast("error", "Error", "Failed to load reviews");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleStatusChange = async (reviewId: string, newStatus: string) => {
    try {
      // TODO: Implement status change API call
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, status: newStatus } : review
      ));
      showToast("success", "Success", "Review status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update review status");
    }
  };

  const handleManageReview = (review: Review) => {
    // Open review management modal or navigate to review details
    showToast("info", "Manage Review", `Managing review from ${review.guestName} for ${review.hotelName}`);
    // TODO: Implement review management modal or navigation
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "PENDING": return "warning";
      case "REJECTED": return "danger";
      case "PUBLISHED": return "info";
      default: return "info";
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
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

  const hotelBodyTemplate = (rowData: Review) => {
    return (
      <div>
        <div className="font-semibold">{rowData.hotelName}</div>
        <div className="text-sm text-600">/{rowData.hotelSlug}</div>
      </div>
    );
  };

  const guestBodyTemplate = (rowData: Review) => {
    return (
      <div>
        <div className="font-semibold">{rowData.guestName}</div>
        <div className="text-sm text-600">{rowData.guestEmail}</div>
      </div>
    );
  };

  const ratingBodyTemplate = (rowData: Review) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className={`font-bold ${getRatingColor(rowData.overallRating)}`}>
          {rowData.overallRating}
        </span>
        <i className="pi pi-star-fill text-yellow-500"></i>
      </div>
    );
  };

  const statusBodyTemplate = (rowData: Review) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.status} 
          severity={getStatusSeverity(rowData.status) as any} 
        />
        <Button
          icon="pi pi-cog"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleManageReview(rowData)}
          tooltip="Manage Review"
        />
      </div>
    );
  };

  const visibilityBodyTemplate = (rowData: Review) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.isPublic ? "Public" : "Private"} 
          severity={rowData.isPublic ? "success" : "info"} 
        />
        {rowData.isShared && (
          <Tag value="Shared" severity="warning" />
        )}
      </div>
    );
  };

  // Server-side filtering - no client-side filtering needed

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Published", value: "PUBLISHED" },
  ];

  const ratingOptions = [
    { label: "All Ratings", value: "" },
    { label: "5 Stars", value: "5" },
    { label: "4 Stars", value: "4" },
    { label: "3 Stars", value: "3" },
    { label: "2 Stars", value: "2" },
    { label: "1 Star", value: "1" },
  ];

  const hotelOptions = [
    { label: "All Hotels", value: "" },
    ...Array.from(new Set(reviews.map(r => r.hotelName))).map(hotel => ({
      label: hotel,
      value: hotel,
    })),
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">All Reviews</h1>
            <p className="text-600 mt-2 mb-0">Manage all guest reviews across all hotels.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadReviews}
              loading={loading}
              className="p-button-outlined"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="col-12">
        <Card title="Filters" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Search</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by guest or hotel..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Status</label>
              <Dropdown
                value={filters.status}
                options={statusOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                placeholder="All Statuses"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Rating</label>
              <Dropdown
                value={filters.rating}
                options={ratingOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, rating: e.value }))}
                placeholder="All Ratings"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Hotel</label>
              <Dropdown
                value={filters.hotel}
                options={hotelOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, hotel: e.value }))}
                placeholder="All Hotels"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading reviews...</p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-star text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Reviews Found</h3>
              <p className="text-600 mb-4">
                {reviews.length === 0 
                  ? "No reviews have been submitted yet." 
                  : "No reviews match your current filters."
                }
              </p>
            </div>
          ) : (
            <DataTable 
              value={reviews} 
              showGridlines
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
            >
              <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable />
              <Column field="guest" header="Guest" body={guestBodyTemplate} />
              <Column field="overallRating" header="Rating" body={ratingBodyTemplate} sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} sortable />
              <Column field="visibility" header="Visibility" body={visibilityBodyTemplate} />
              <Column field="formTitle" header="Form" />
              <Column 
                field="submittedAt" 
                header="Submitted" 
                body={(rowData) => formatDate(rowData.submittedAt)}
                sortable 
              />
            </DataTable>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
