"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { Divider } from "primereact/divider";
import { Rating } from "primereact/rating";
import { Calendar } from "primereact/calendar";
import { MultiSelect } from "primereact/multiselect";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { CustomPaginator } from "@/components/CustomPaginator";
import { apiClient } from "@/lib/apiClient";

interface Review {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  overallRating: number;
  status: string;
  isPublic: boolean;
  isShared: boolean;
  submittedAt: string;
  publishedAt?: string;
  formTitle: string;
  isChecked: boolean;
  isUrgent: boolean;
  isReplied: boolean;
  isDeleted: boolean;
  predefinedAnswers?: string;
}

interface DetailedReview {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  roomNumber?: string;
  overallRating: number;
  status: string;
  isPublic: boolean;
  isShared: boolean;
  submittedAt: string;
  publishedAt?: string;
  predefinedAnswers?: string;
  isChecked: boolean;
  isUrgent: boolean;
  isReplied: boolean;
  isDeleted: boolean;
  form: {
    title: string;
    description?: string;
    layout: string;
    predefinedQuestions?: {
      hasRateUs: boolean;
      hasCustomRating: boolean;
      hasFeedback: boolean;
      customRatingItems: Array<{
        id: string;
        label: string;
        order: number;
      }>;
    };
  };
  answers: Array<{
    id: string;
    question: {
      id: string;
      question: string;
      type: string;
      isRequired: boolean;
      options: string[];
    };
    answer: any;
    customRatingItems?: Array<{
      id: string;
      label: string;
      order: number;
      rating?: number;
    }>;
  }>;
}

export default function HotelReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filters, setFilters] = useState({
    filter: "",
    ratings: [] as string[],
    search: "",
    roomNumber: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
  });
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [detailedReview, setDetailedReview] = useState<DetailedReview | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showInlineReply, setShowInlineReply] = useState(false);
  const [inlineReplyText, setInlineReplyText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const toast = useRef<Toast>(null);


  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelReviews({
        filter: filters.filter,
        ratings: filters.ratings.join(','),
        search: filters.search,
        roomNumber: filters.roomNumber,
        startDate: filters.startDate ? filters.startDate.toISOString() : undefined,
        endDate: filters.endDate ? filters.endDate.toISOString() : undefined,
        page: currentPage,
        limit: rowsPerPage,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setReviews((response as any).data || []);
      setTotalRecords(response.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading reviews:", error);
      showToast("error", "Error", "Failed to load reviews");
      setReviews([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.filter, filters.ratings, filters.search, filters.roomNumber, filters.startDate, filters.endDate, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Check for reviewId URL parameter to auto-open detailed review
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reviewId = urlParams.get('reviewId');
    if (reviewId) {
      // Load and show the detailed review
      loadDetailedReview(reviewId);
      setShowDetailsDialog(true);
      
      // Clean up URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.filter, filters.ratings, filters.search, filters.roomNumber, filters.startDate, filters.endDate]);

  const loadDetailedReview = async (reviewId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${reviewId}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedReview(data.data);
        setShowDetailsDialog(true);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to load review details");
      }
    } catch (error) {
      console.error("Error loading review details:", error);
      showToast("error", "Error", "Failed to load review details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleStatusUpdate = async (reviewId: string, field: 'isChecked' | 'isUrgent' | 'isReplied', value: boolean) => {
    try {
      const response = await fetch(`/api/hotel/reviews/${reviewId}/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? { ...review, [field]: value } : review
        ));
        // Also update the detailed review if it's the same review
        setDetailedReview(prev => 
          prev && prev.id === reviewId ? { ...prev, [field]: value } : prev
        );
        showToast("success", "Success", `Review ${field.replace('is', '').toLowerCase()} updated`);
      } else {
        const errorData = await response.json();
        showToast("error", "Error", errorData.error || "Failed to update review status");
      }
    } catch (error) {
      showToast("error", "Error", "Failed to update review status");
    }
  };

  const handleReplyClick = (review: Review) => {
    setSelectedReview(review);
    setReplyText("");
    setShowReplyDialog(true);
  };

  const handleReplySubmit = async () => {
    if (!selectedReview || !replyText.trim()) {
      showToast("warn", "Warning", "Please enter a reply message");
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyText: replyText.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", `Reply sent successfully to ${data.sentTo}`);
        setShowReplyDialog(false);
        setReplyText("");
        setSelectedReview(null);
        // Update the review to mark as replied
        setReviews(prev => prev.map(review => 
          review.id === selectedReview.id ? { ...review, isReplied: true } : review
        ));
      } else {
        showToast("error", "Error", data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      showToast("error", "Error", "Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleInlineReplySubmit = async () => {
    if (!detailedReview || !inlineReplyText.trim()) {
      showToast("warn", "Warning", "Please enter a reply message");
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${detailedReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replyText: inlineReplyText.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", `Reply sent successfully to ${data.sentTo}`);
        setShowInlineReply(false);
        setInlineReplyText("");
        // Update the review to mark as replied
        setReviews(prev => prev.map(review => 
          review.id === detailedReview.id ? { ...review, isReplied: true } : review
        ));
        // Update detailed review
        setDetailedReview(prev => prev ? { ...prev, isReplied: true } : null);
      } else {
        showToast("error", "Error", data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      showToast("error", "Error", "Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "PENDING": return "warning";
      case "REJECTED": return "danger";
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

  const getRateUsRating = (predefinedAnswers?: string): number | null => {
    if (!predefinedAnswers) return null;
    
    try {
      const parsed = JSON.parse(predefinedAnswers);
      return parsed['rate-us'] || null;
    } catch {
      return null;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i
        key={index}
        className={`pi ${index < rating ? 'pi-star-fill' : 'pi-star'}`}
        style={{ color: index < rating ? '#FFD700' : '#E0E0E0' }}
      />
    ));
  };

  const renderAnswer = (answer: any, type: string) => {
    if (typeof answer === 'string') {
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
        return parsed;
      } catch {
        // If it's not JSON, clean up repetitive text
        if (answer.includes('Please give us your honest feed')) {
          const cleanAnswer = answer.replace(/Please give us your honest feed/g, '').trim();
          return cleanAnswer.length > 0 ? cleanAnswer : 'No specific feedback provided';
        }
        return answer;
      }
    }
    return answer;
  };

  const ratingBodyTemplate = useMemo(() => (rowData: Review) => {
    // Try to get the "rate-us" rating from predefined answers first
    const rateUsRating = getRateUsRating(rowData.predefinedAnswers);
    const displayRating = rateUsRating !== null ? rateUsRating : rowData.overallRating;
    
    return (
      <div className="flex align-items-center gap-2">
        <div className="flex align-items-center gap-1">
          {renderStars(displayRating)}
        </div>
        {/* <span className={`font-bold ${getRatingColor(displayRating)}`}>
          {displayRating}/5
        </span> */}
      </div>
    );
  }, []);

  const statusBodyTemplate = useMemo(() => (rowData: Review) => {
    return (
      <div className="flex flex-column gap-1">
        <div className="flex align-items-center gap-1">
          <i className={`pi ${rowData.isChecked ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-400'}`}></i>
          <span className={`text-sm ${rowData.isChecked ? 'text-green-600' : 'text-gray-500'}`}>
            {rowData.isChecked ? 'Checked' : 'Not Checked'}
          </span>
        </div>
        <div className="flex align-items-center gap-1">
          <i className={`pi ${rowData.isReplied ? 'pi-reply text-blue-500' : 'pi-times-circle text-gray-400'}`}></i>
          <span className={`text-sm ${rowData.isReplied ? 'text-blue-600' : 'text-gray-500'}`}>
            {rowData.isReplied ? 'Replied' : 'Not Replied'}
          </span>
        </div>
        <div className="flex align-items-center gap-1">
          <i className={`pi ${rowData.isUrgent ? 'pi-exclamation-triangle text-orange-500' : 'pi-circle text-gray-400'}`}></i>
          <span className={`text-sm ${rowData.isUrgent ? 'text-orange-600' : 'text-gray-500'}`}>
            {rowData.isUrgent ? 'Urgent' : 'Not Urgent'}
          </span>
        </div>
      </div>
    );
  }, []);

  const visibilityBodyTemplate = useMemo(() => (rowData: Review) => {
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
  }, []);

  const actionsBodyTemplate = useMemo(() => (rowData: Review) => {
    const hasEmail = rowData.guestEmail && rowData.guestEmail.trim() !== "";
    
    return (
      <div className="flex gap-2">
        <Button
          label="View"
          icon="pi pi-eye"
          size="small"
          className="p-button-outlined"
          onClick={() => loadDetailedReview(rowData.id)}
          loading={loadingDetails}
        />
        <Button
          label="Reply"
          icon="pi pi-reply"
          size="small"
          className="p-button-outlined p-button-success"
          onClick={() => handleReplyClick(rowData)}
          disabled={!hasEmail}
          title={!hasEmail ? "No email available for this review" : "Reply to customer"}
        />
        <Button
          label="Delete"
          icon="pi pi-trash"
          size="small"
          className="p-button-outlined p-button-danger"
          onClick={() => handleDeleteClick(rowData)}
          title="Delete this review"
        />
      </div>
    );
  }, [loadingDetails]);


  const filterOptions = useMemo(() => [
    { label: "All Reviews", value: "" },
    { label: "Replied", value: "replied" },
    { label: "Not Replied", value: "not-replied" },
    { label: "Checked", value: "checked" },
    { label: "Not Checked", value: "not-checked" },
    { label: "Urgent", value: "urgent" },
    { label: "Not Urgent", value: "not-urgent" },
  ], []);

  const ratingOptions = useMemo(() => [
    { label: "5 Stars", value: "5" },
    { label: "4 Stars", value: "4" },
    { label: "3 Stars", value: "3" },
    { label: "2 Stars", value: "2" },
    { label: "1 Star", value: "1" },
  ], []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      filter: "",
      ratings: [],
      search: "",
      roomNumber: "",
      startDate: null,
      endDate: null,
    });
  }, []);

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    setDeletingReview(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${reviewToDelete.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", "Review deleted successfully");
        setShowDeleteDialog(false);
        setReviewToDelete(null);
        // Remove the review from the list
        setReviews(prev => prev.filter(review => review.id !== reviewToDelete.id));
        setTotalRecords(prev => prev - 1);
      } else {
        showToast("error", "Error", data.error || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast("error", "Error", "Failed to delete review");
    } finally {
      setDeletingReview(false);
    }
  };

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Guest Reviews</h1>
            <p className="text-600 mt-2 mb-0">Manage and review guest feedback submissions.</p>
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
        <Card className="mb-4">
          <div className="flex justify-content-between align-items-center mb-3">
            <h3 className="m-0">Filters</h3>
            <Button
              label="Clear Filters"
              icon="pi pi-filter-slash"
              onClick={handleClearFilters}
              className="p-button-outlined p-button-secondary"
              size="small"
            />
          </div>
          <div className="grid">
            {/* First Row - Search, Status, Star Ratings */}
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Search Reviews</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by guest name or feedback text..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Room Number</label>
              <InputText
                value={filters.roomNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, roomNumber: e.target.value }))}
                placeholder="Filter by room number..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Filter</label>
              <Dropdown
                value={filters.filter}
                options={filterOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, filter: e.value }))}
                placeholder="All Reviews"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">Star Ratings</label>
              <MultiSelect
                value={filters.ratings}
                options={ratingOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, ratings: e.value }))}
                placeholder="All Ratings"
                className="w-full"
                display="chip"
                showClear
              />
            </div>
            
            {/* Date Range Section */}
            <div className="col-12 mt-4">
              <h4 className="text-900 font-medium mb-3">Date Range</h4>
            </div>
            
            {/* Second Row - Start Date and End Date */}
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">Start Date</label>
              <Calendar
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.value as Date | null }))}
                placeholder="From date"
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                showButtonBar
                maxDate={filters.endDate || new Date()}
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">End Date</label>
              <Calendar
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.value as Date | null }))}
                placeholder="To date"
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                showButtonBar
                minDate={filters.startDate || undefined}
                maxDate={new Date()}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Reviews Table */}
      <div className="col-12">
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
            <>
              <DataTable 
                value={reviews}
                onRowClick={(e) => {
                  // Don't open details if clicking on action buttons
                  if (!e.originalEvent) return;
                  const target = e.originalEvent.target as HTMLElement;
                  if (target.closest('button') || target.closest('.p-button')) return;
                  loadDetailedReview(e.data.id);
                }}
                rowHover
                selectionMode="single"
              >
                <Column field="guestName" header="Guest" sortable />
                <Column field="guestEmail" header="Email" />
                <Column field="roomNumber" header="Room" sortable />
                <Column field="overallRating" header="Rating" body={ratingBodyTemplate} sortable />
                <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column 
                  field="submittedAt" 
                  header="Submitted" 
                  body={(rowData) => formatDate(rowData.submittedAt)}
                  sortable 
                />
                <Column header="Actions" body={actionsBodyTemplate} />
              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={totalRecords}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
      </div>

      {/* Detailed Review Dialog */}
      <Dialog
        header={
          <div className="flex align-items-center gap-2">
            <i className="pi pi-star text-yellow-500" style={{ fontSize: '1.2rem' }}></i>
            <span>Guest Feedback Details</span>
            <i className="pi pi-info-circle text-blue-500" style={{ fontSize: '1rem' }}></i>
          </div>
        }
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '90vw', maxWidth: '800px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        maximizable
        modal
        className="feedback-popup animate-fade-in"
      >
        {detailedReview && (
          <div className="space-y-6">
            {/* Guest Information */}
            <div className="border-1 border-200 border-round p-4 animate-slide-in-left">
              <h3 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                <i className="pi pi-user text-blue-500"></i>
                Guest Information
              </h3>
                <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-id-card text-gray-500"></i>
                    <strong>Name:</strong> {detailedReview.guestName || 'Anonymous'}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-envelope text-gray-500"></i>
                    <strong>Email:</strong> {detailedReview.guestEmail || 'Not provided'}
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-phone text-gray-500"></i>
                    <strong>Phone:</strong> {detailedReview.guestPhone || 'Not provided'}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-home text-gray-500"></i>
                    <strong>Room Number:</strong> {detailedReview.roomNumber || 'Not provided'}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-calendar text-gray-500"></i>
                    <strong>Submitted:</strong> {formatDate(detailedReview.submittedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3">Overall Rating</h3>
              <div className="flex align-items-center gap-3 mb-3">
                <div className="flex align-items-center gap-1">
                  {renderStars(detailedReview.overallRating)}
                </div>
                <span className="text-xl font-bold">{detailedReview.overallRating}/5</span>
                <Tag
                  value={detailedReview.status}
                  severity={getStatusSeverity(detailedReview.status)}
                />
              </div>
            </div>

            {/* Quick Feedback */}
            {detailedReview.predefinedAnswers && (
              <div className="border-1 border-200 border-round p-4">
                <h3 className="text-lg font-semibold mb-3">Quick Feedback</h3>
                <div className="space-y-3">
                  {Object.entries(JSON.parse(detailedReview.predefinedAnswers)).map(([questionId, answer]) => {
                    // Handle different question types
                    let questionLabel = '';
                    let displayAnswer = answer;
                    
                    if (questionId === 'rate-us') {
                      questionLabel = 'How do you rate us?';
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'feedback') {
                      questionLabel = 'Please give us your honest feedback?';
                      // Clean up repetitive placeholder text
                      let cleanAnswer = String(answer);
                      if (cleanAnswer.includes('Please give us your honest feed')) {
                        // Remove repetitive placeholder text
                        cleanAnswer = cleanAnswer.replace(/Please give us your honest feed/g, '').trim();
                        if (cleanAnswer.length === 0) {
                          cleanAnswer = 'No specific feedback provided';
                        }
                      }
                      displayAnswer = cleanAnswer;
                    } else if (questionId.startsWith('custom-rating-')) {
                      // This is a custom rating item - get the actual label from form data
                      const customRatingItemId = questionId.replace('custom-rating-', '');
                      let customRatingItem = detailedReview.form?.predefinedQuestions?.customRatingItems?.find(
                        item => item.id === customRatingItemId
                      );
                      
                      // If not found by ID, try to match by order/index
                      if (!customRatingItem && detailedReview.form?.predefinedQuestions?.customRatingItems && detailedReview.predefinedAnswers) {
                        const items = detailedReview.form.predefinedQuestions.customRatingItems;
                        const predefinedAnswersKeys = Object.keys(JSON.parse(detailedReview.predefinedAnswers));
                        const index = predefinedAnswersKeys.indexOf(questionId);
                        if (index >= 0 && index < items.length) {
                          customRatingItem = items[index];
                        }
                      }
                      
                      questionLabel = customRatingItem?.label || `Custom Rating Item (${customRatingItemId})`;
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'custom-rating') {
                      questionLabel = 'Custom Rating:';
                      displayAnswer = String(answer);
                    } else {
                      questionLabel = questionId;
                      displayAnswer = typeof answer === 'object' ? JSON.stringify(answer) : String(answer);
                    }
                    
                    return (
                      <div key={questionId} className="border-bottom-1 border-200 pb-3">
                        <div className="font-semibold mb-1">{questionLabel}</div>
                        <div className="text-600">
                          {questionId === 'rate-us' || questionId.startsWith('custom-rating-') ? (
                            <span style={{ 
                              fontSize: '18px', 
                              color: '#facc15',
                              letterSpacing: '2px'
                            }}>
                              {String(displayAnswer)}
                            </span>
                          ) : (
                            String(displayAnswer)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Information */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                <i className="pi pi-file text-green-500"></i>
                Form Information
              </h3>
                <div className="grid">
                  <div className="col-12">
                  <div className="mb-2">
                    <strong>Form Title:</strong> {detailedReview.form?.title || 'N/A'}
                  </div>
                  {detailedReview.form?.description && (
                    <div className="mb-2">
                      <strong>Description:</strong> {detailedReview.form.description}
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>Layout:</strong> 
                    <Tag 
                      value={detailedReview.form?.layout || 'basic'} 
                      severity="info" 
                      className="ml-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Responses */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3 flex align-items-center gap-2">
                <i className="pi pi-comments text-purple-500"></i>
                Feedback Responses
              </h3>
                {detailedReview.answers.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="pi pi-info-circle text-2xl text-400 mb-2"></i>
                    <p className="text-600">No detailed responses available for this review.</p>
                  </div>
                ) : (
                <div className="space-y-4">
                    {detailedReview.answers.map((answer, index) => (
                    <div key={answer.id} className="border-bottom-1 border-200 pb-3">
                      <div className="font-semibold mb-2 flex align-items-center gap-2">
                        <i className="pi pi-question-circle text-blue-500"></i>
                              {answer.question.question}
                              {answer.question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="text-600 ml-4">
                        {answer.question.type === 'STAR_RATING' ? (
                          <div className="flex align-items-center gap-2">
                            <span style={{ 
                              fontSize: '18px', 
                              color: '#facc15',
                              letterSpacing: '2px'
                            }}>
                              {Array.from({ length: 5 }, (_, i) => 
                                i < (answer.answer || 0) ? '★' : '☆'
                              ).join('')}
                            </span>
                            <span className="text-sm">({answer.answer || 0}/5)</span>
                          </div>
                        ) : answer.question.type === 'CUSTOM_RATING' && answer.customRatingItems ? (
                          <div className="space-y-2">
                            {answer.customRatingItems.map((item: any) => (
                              <div key={item.id} className="flex align-items-center justify-content-between p-2 border-1 border-200 border-round">
                                <span className="text-900 font-medium">{item.label}</span>
                                <div className="flex align-items-center gap-2">
                                  <span style={{ 
                                    fontSize: '16px', 
                                    color: '#facc15',
                                    letterSpacing: '1px'
                                  }}>
                                    {Array.from({ length: 5 }, (_, i) => 
                                      i < (item.rating || 0) ? '★' : '☆'
                                    ).join('')}
                                  </span>
                                  <span className="text-600 text-sm">({item.rating || 0}/5)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : answer.question.type === 'MULTIPLE_CHOICE_MULTIPLE' ? (
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(answer.answer) && answer.answer.length > 0 ? (
                              answer.answer.map((item: string, idx: number) => (
                                <Tag key={idx} value={item} severity="info" />
                              ))
                            ) : (
                              <span className="text-600">No answer provided</span>
                            )}
                          </div>
                        ) : answer.question.type === 'YES_NO' ? (
                          <Tag 
                            value={answer.answer || 'No answer'} 
                            severity={answer.answer === 'Yes' ? 'success' : answer.answer === 'No' ? 'danger' : 'info'} 
                          />
                        ) : (
                          <div className="text-900">
                            {renderAnswer(answer.answer, answer.question.type)}
                        </div>
                        )}
                      </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-content-between align-items-center pt-4 border-top-1 border-200">
              <div className="flex gap-2">
                <Button
                  label={detailedReview.isChecked ? "Checked" : "Mark as Checked"}
                  icon={detailedReview.isChecked ? "pi pi-check-circle" : "pi pi-check-circle"}
                  onClick={() => handleStatusUpdate(detailedReview.id, 'isChecked', true)}
                  className={detailedReview.isChecked ? "p-button-success" : "p-button-outlined p-button-success"}
                  disabled={detailedReview.isChecked}
                />
                <Button
                  label={detailedReview.isUrgent ? "Urgent" : "Mark as Urgent"}
                  icon={detailedReview.isUrgent ? "pi pi-exclamation-triangle" : "pi pi-exclamation-triangle"}
                  onClick={() => handleStatusUpdate(detailedReview.id, 'isUrgent', true)}
                  className={detailedReview.isUrgent ? "p-button-warning" : "p-button-outlined p-button-warning"}
                  disabled={detailedReview.isUrgent}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  label="Close"
                  icon="pi pi-times"
                  onClick={() => setShowDetailsDialog(false)}
                  className="p-button-outlined"
                />
                <Button
                  label="Reply to Customer"
                  icon="pi pi-reply"
                  onClick={() => setShowInlineReply(true)}
                  className="p-button-success"
                  disabled={!detailedReview.guestEmail}
                />
              </div>
            </div>

            {/* Inline Reply Section */}
            {showInlineReply && (
              <div className="border-1 border-200 border-round p-4 mt-4">
                <h4 className="text-lg font-semibold mb-3">Reply to Customer</h4>
                <InputTextarea
                  value={inlineReplyText}
                  onChange={(e) => setInlineReplyText(e.target.value)}
                  placeholder="Type your reply message here..."
                  rows={4}
                  className="w-full mb-3"
                  autoResize
                />
                <div className="flex justify-content-end gap-2">
                  <Button
                    label="Cancel"
                    icon="pi pi-times"
                    onClick={() => {
                      setShowInlineReply(false);
                      setInlineReplyText("");
                    }}
                    className="p-button-outlined"
                    disabled={submittingReply}
                  />
                  <Button
                    label="Send Reply"
                    icon="pi pi-send"
                    onClick={handleInlineReplySubmit}
                    loading={submittingReply}
                    disabled={!inlineReplyText.trim()}
                    className="p-button-success"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog
        header="Reply to Customer"
        visible={showReplyDialog}
        onHide={() => setShowReplyDialog(false)}
        style={{ width: '90vw', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowReplyDialog(false)}
              className="p-button-outlined"
              disabled={submittingReply}
            />
            <Button
              label="Send Reply"
              icon="pi pi-send"
              onClick={handleReplySubmit}
              loading={submittingReply}
              disabled={!replyText.trim()}
            />
          </div>
        }
      >
        {selectedReview && (
          <div className="grid">
            <div className="col-12">
              <div className="mb-4">
                <h4 className="text-900 mb-2">Customer Information</h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <strong>Name:</strong> {selectedReview.guestName || 'Not provided'}
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Email:</strong> {selectedReview.guestEmail || 'Not provided'}
                  </div>
                </div>
              </div>
              
              <Divider />
              
              <div className="mb-3">
                <label className="block text-900 font-medium mb-2">
                  Your Reply Message
                </label>
                <InputTextarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply message here..."
                  rows={6}
                  className="w-full"
                  autoResize
                />
                <small className="text-600">
                  This message will be sent to {selectedReview.guestEmail}
                </small>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header="Delete Review"
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        style={{ width: '90vw', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowDeleteDialog(false)}
              className="p-button-outlined"
              disabled={deletingReview}
            />
            <Button
              label="Delete"
              icon="pi pi-trash"
              onClick={handleDeleteConfirm}
              loading={deletingReview}
              className="p-button-danger"
            />
          </div>
        }
      >
        {reviewToDelete && (
          <div className="grid">
            <div className="col-12">
              <div className="text-center mb-4">
                <i className="pi pi-exclamation-triangle text-6xl text-orange-500 mb-3"></i>
                <h3 className="text-900 mb-2">Are you sure you want to delete this review?</h3>
                <p className="text-600 mb-4">
                  This action cannot be undone. The review will be permanently removed from your system.
                </p>
              </div>
              
              <div className="border-1 border-200 border-round p-3 bg-gray-50">
                <h4 className="text-900 mb-2">Review Details:</h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <strong>Guest:</strong> {reviewToDelete.guestName || 'Anonymous'}
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>Rating:</strong> {reviewToDelete.overallRating}/5 ⭐
                  </div>
                  <div className="col-12">
                    <strong>Submitted:</strong> {formatDate(reviewToDelete.submittedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
