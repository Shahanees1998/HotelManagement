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
import { useI18n } from "@/i18n/TranslationProvider";

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
  const { t, locale } = useI18n();
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
      showToast("error", t("common.error"), t("hotel.reviews.toasts.loadError"));
      setReviews([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [filters.filter, filters.ratings, filters.search, filters.roomNumber, filters.startDate, filters.endDate, currentPage, rowsPerPage, showToast, t]);

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

  const loadDetailedReview = useCallback(async (reviewId: string) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/hotel/reviews/${reviewId}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedReview(data.data);
        setShowDetailsDialog(true);
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.reviews.toasts.detailsLoadError"));
      }
    } catch (error) {
      console.error("Error loading review details:", error);
      showToast("error", t("common.error"), t("hotel.reviews.toasts.detailsLoadError"));
    } finally {
      setLoadingDetails(false);
    }
  }, [showToast, t]);

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
        const statusKey = field === "isChecked" ? "checked" : field === "isUrgent" ? "urgent" : "replied";
        showToast("success", t("common.success"), t(`hotel.reviews.toasts.statusUpdate.${statusKey}`));
      } else {
        const errorData = await response.json();
        showToast("error", t("common.error"), errorData.error || t("hotel.reviews.toasts.statusUpdateError"));
      }
    } catch (error) {
      showToast("error", t("common.error"), t("hotel.reviews.toasts.statusUpdateError"));
    }
  };

  const handleReplyClick = useCallback((review: Review) => {
    setSelectedReview(review);
    setReplyText("");
    setShowReplyDialog(true);
  }, []);

  const handleReplySubmit = async () => {
    if (!selectedReview || !replyText.trim()) {
      showToast("warn", t("common.warning"), t("hotel.reviews.toasts.replyMissing"));
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
        showToast("success", t("common.success"), t("hotel.reviews.toasts.replySuccess").replace("{sentTo}", data.sentTo ?? ""));
        setShowReplyDialog(false);
        setReplyText("");
        setSelectedReview(null);
        // Update the review to mark as replied
        setReviews(prev => prev.map(review => 
          review.id === selectedReview.id ? { ...review, isReplied: true } : review
        ));
      } else {
        showToast("error", t("common.error"), data.error || t("hotel.reviews.toasts.replyError"));
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      showToast("error", t("common.error"), t("hotel.reviews.toasts.replyError"));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleInlineReplySubmit = async () => {
    if (!detailedReview || !inlineReplyText.trim()) {
      showToast("warn", t("common.warning"), t("hotel.reviews.toasts.replyMissing"));
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
        showToast("success", t("common.success"), t("hotel.reviews.toasts.replySuccess").replace("{sentTo}", data.sentTo ?? ""));
        setShowInlineReply(false);
        setInlineReplyText("");
        // Update the review to mark as replied
        setReviews(prev => prev.map(review => 
          review.id === detailedReview.id ? { ...review, isReplied: true } : review
        ));
        // Update detailed review
        setDetailedReview(prev => prev ? { ...prev, isReplied: true } : null);
      } else {
        showToast("error", t("common.error"), data.error || t("hotel.reviews.toasts.replyError"));
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      showToast("error", t("common.error"), t("hotel.reviews.toasts.replyError"));
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

  const formatDate = useCallback(
    (dateString: string) => {
      try {
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date(dateString));
      } catch {
        return dateString;
      }
    },
    [locale]
  );

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
          return cleanAnswer.length > 0 ? cleanAnswer : t("hotel.reviews.detailsDialog.noSpecificFeedback");
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

  const statusBodyTemplate = useMemo(
    () => (rowData: Review) => {
      return (
        <div className="flex flex-column gap-1">
          <div className="flex align-items-center gap-1">
            <i className={`pi ${rowData.isChecked ? 'pi-check-circle text-green-500' : 'pi-circle text-gray-400'}`}></i>
            <span className={`text-sm ${rowData.isChecked ? 'text-green-600' : 'text-gray-500'}`}>
              {rowData.isChecked ? t("hotel.reviews.table.checkedStatus") : t("hotel.reviews.table.notCheckedStatus")}
            </span>
          </div>
          <div className="flex align-items-center gap-1">
            <i className={`pi ${rowData.isReplied ? 'pi-reply text-blue-500' : 'pi-times-circle text-gray-400'}`}></i>
            <span className={`text-sm ${rowData.isReplied ? 'text-blue-600' : 'text-gray-500'}`}>
              {rowData.isReplied ? t("hotel.reviews.table.repliedStatus") : t("hotel.reviews.table.notRepliedStatus")}
            </span>
          </div>
          <div className="flex align-items-center gap-1">
            <i className={`pi ${rowData.isUrgent ? 'pi-exclamation-triangle text-orange-500' : 'pi-circle text-gray-400'}`}></i>
            <span className={`text-sm ${rowData.isUrgent ? 'text-orange-600' : 'text-gray-500'}`}>
              {rowData.isUrgent ? t("hotel.reviews.table.urgentStatus") : t("hotel.reviews.table.notUrgentStatus")}
            </span>
          </div>
        </div>
      );
    },
    [t]
  );

  const visibilityBodyTemplate = useMemo(
    () => (rowData: Review) => {
      return (
        <div className="flex align-items-center gap-2">
          <Tag
            value={rowData.isPublic ? t("hotel.reviews.table.public") : t("hotel.reviews.table.private")}
            severity={rowData.isPublic ? "success" : "info"}
          />
          {rowData.isShared && <Tag value={t("hotel.reviews.table.shared")} severity="warning" />}
        </div>
      );
    },
    [t]
  );

  const handleDeleteClick = useCallback((review: Review) => {
    setReviewToDelete(review);
    setShowDeleteDialog(true);
  }, []);

  const actionsBodyTemplate = useMemo(
    () => (rowData: Review) => {
      const hasEmail = rowData.guestEmail && rowData.guestEmail.trim() !== "";

      return (
        <div className="flex gap-2">
          <Button
            label={t("hotel.reviews.buttons.view")}
            icon="pi pi-eye"
            size="small"
            className="p-button-outlined"
            onClick={() => loadDetailedReview(rowData.id)}
            loading={loadingDetails}
          />
          <Button
            label={t("hotel.reviews.buttons.reply")}
            icon="pi pi-reply"
            size="small"
            className="p-button-outlined p-button-success"
            onClick={() => handleReplyClick(rowData)}
            disabled={!hasEmail}
            title={!hasEmail ? t("hotel.reviews.table.noEmailAvailable") : t("hotel.reviews.buttons.replyToCustomer")}
          />
          <Button
            label={t("hotel.reviews.buttons.delete")}
            icon="pi pi-trash"
            size="small"
            className="p-button-outlined p-button-danger"
            onClick={() => handleDeleteClick(rowData)}
            title={t("hotel.reviews.deleteDialog.confirmTitle")}
          />
        </div>
      );
    },
    [handleDeleteClick, handleReplyClick, loadDetailedReview, loadingDetails, t]
  );


  const filterOptions = useMemo(
    () => [
      { label: t("hotel.reviews.filters.allReviews"), value: "" },
      { label: t("hotel.reviews.filters.replied"), value: "replied" },
      { label: t("hotel.reviews.filters.notReplied"), value: "not-replied" },
      { label: t("hotel.reviews.filters.checked"), value: "checked" },
      { label: t("hotel.reviews.filters.notChecked"), value: "not-checked" },
      { label: t("hotel.reviews.filters.urgent"), value: "urgent" },
      { label: t("hotel.reviews.filters.notUrgent"), value: "not-urgent" },
    ],
    [t]
  );

  const ratingOptions = useMemo(
    () => [
      { label: t("hotel.reviews.filters.5Stars"), value: "5" },
      { label: t("hotel.reviews.filters.4Stars"), value: "4" },
      { label: t("hotel.reviews.filters.3Stars"), value: "3" },
      { label: t("hotel.reviews.filters.2Stars"), value: "2" },
      { label: t("hotel.reviews.filters.1Star"), value: "1" },
    ],
    [t]
  );

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
        showToast("success", t("common.success"), t("hotel.reviews.toasts.deleteSuccess"));
        setShowDeleteDialog(false);
        setReviewToDelete(null);
        // Remove the review from the list
        setReviews(prev => prev.filter(review => review.id !== reviewToDelete.id));
        setTotalRecords(prev => prev - 1);
      } else {
        showToast("error", t("common.error"), data.error || t("hotel.reviews.toasts.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      showToast("error", t("common.error"), t("hotel.reviews.toasts.deleteError"));
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
            <h1 className="text-3xl font-bold m-0">{t("hotel.reviews.title")}</h1>
            <p className="text-600 mt-2 mb-0">{t("hotel.reviews.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              label={t("hotel.reviews.buttons.refresh")}
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
            <h3 className="m-0">{t("hotel.reviews.filters.title")}</h3>
            <Button
              label={t("hotel.reviews.buttons.clearFilters")}
              icon="pi pi-filter-slash"
              onClick={handleClearFilters}
              className="p-button-outlined p-button-secondary"
              size="small"
            />
          </div>
          <div className="grid">
            {/* First Row - Search, Status, Star Ratings */}
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.searchReviews")}</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder={t("hotel.reviews.filters.searchPlaceholder")}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.roomNumber")}</label>
              <InputText
                value={filters.roomNumber}
                onChange={(e) => setFilters(prev => ({ ...prev, roomNumber: e.target.value }))}
                placeholder={t("hotel.reviews.filters.roomNumberPlaceholder")}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.filter")}</label>
              <Dropdown
                value={filters.filter}
                options={filterOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, filter: e.value }))}
                placeholder={t("hotel.reviews.filters.allReviews")}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.starRatings")}</label>
              <MultiSelect
                value={filters.ratings}
                options={ratingOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, ratings: e.value }))}
                placeholder={t("hotel.reviews.filters.allRatings")}
                className="w-full"
                display="chip"
                showClear
              />
            </div>
            
            {/* Date Range Section */}
            <div className="col-12 mt-4">
              <h4 className="text-900 font-medium mb-3">{t("hotel.reviews.filters.dateRange")}</h4>
            </div>
            
            {/* Second Row - Start Date and End Date */}
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.startDate")}</label>
              <Calendar
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.value as Date | null }))}
                placeholder={t("hotel.reviews.filters.fromDate")}
                className="w-full"
                showIcon
                dateFormat="yy-mm-dd"
                showButtonBar
                maxDate={filters.endDate || new Date()}
              />
            </div>
            <div className="col-12 md:col-6">
              <label className="block text-900 font-medium mb-2">{t("hotel.reviews.filters.endDate")}</label>
              <Calendar
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.value as Date | null }))}
                placeholder={t("hotel.reviews.filters.toDate")}
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
                <p>{t("hotel.reviews.states.loadingReviews")}</p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-star text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">{t("hotel.reviews.states.noReviewsFound")}</h3>
              <p className="text-600 mb-4">
                {reviews.length === 0
                  ? t("hotel.reviews.states.noReviewsYet")
                  : t("hotel.reviews.states.noReviewsMatchFilters")}
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
                <Column field="guestName" header={t("hotel.reviews.table.guest")} sortable />
                <Column field="guestEmail" header={t("hotel.reviews.table.email")} />
                <Column field="roomNumber" header={t("hotel.reviews.table.room")} sortable />
                <Column field="overallRating" header={t("hotel.reviews.table.rating")} body={ratingBodyTemplate} sortable />
                <Column field="status" header={t("hotel.reviews.table.status")} body={statusBodyTemplate} />
                <Column 
                  field="submittedAt" 
                  header={t("hotel.reviews.table.submitted")} 
                  body={(rowData) => formatDate(rowData.submittedAt)}
                  sortable 
                />
                <Column header={t("hotel.reviews.table.actions")} body={actionsBodyTemplate} />
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
            <span>{t("hotel.reviews.detailsDialog.header")}</span>
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
                {t("hotel.reviews.detailsDialog.guestInfo")}
              </h3>
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-id-card text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.name")}</strong> {detailedReview.guestName || t("hotel.reviews.detailsDialog.anonymous")}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-envelope text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.email")}</strong> {detailedReview.guestEmail || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                </div>
                <div className="col-12 md:col-6">
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-home text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.roomNumber")}</strong> {detailedReview.roomNumber || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                  <div className="mb-2 flex align-items-center gap-2">
                    <i className="pi pi-calendar text-gray-500"></i>
                    <strong>{t("hotel.reviews.detailsDialog.submitted")}</strong> {formatDate(detailedReview.submittedAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Rating */}
            <div className="border-1 border-200 border-round p-4">
              <h3 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.overallRating")}</h3>
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
                <h3 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.quickFeedback")}</h3>
                <div className="space-y-3">
                  {Object.entries(JSON.parse(detailedReview.predefinedAnswers)).map(([questionId, answer]) => {
                    // Handle different question types
                    let questionLabel = '';
                    let displayAnswer = answer;
                    
                    if (questionId === 'rate-us') {
                      questionLabel = t("hotel.reviews.detailsDialog.howDoYouRateUs");
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'feedback') {
                      questionLabel = t("hotel.reviews.detailsDialog.honestFeedback");
                      // Clean up repetitive placeholder text
                      let cleanAnswer = String(answer);
                      if (cleanAnswer.includes('Please give us your honest feed')) {
                        // Remove repetitive placeholder text
                        cleanAnswer = cleanAnswer.replace(/Please give us your honest feed/g, '').trim();
                        if (cleanAnswer.length === 0) {
                          cleanAnswer = t("hotel.reviews.detailsDialog.noSpecificFeedback");
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
                      
                      questionLabel = customRatingItem?.label || t("hotel.reviews.detailsDialog.customRatingItem").replace("{itemId}", customRatingItemId);
                      // Show visual stars instead of text
                      const rating = parseInt(String(answer));
                      displayAnswer = Array.from({ length: 5 }, (_, i) => 
                        i < rating ? '★' : '☆'
                      ).join('');
                    } else if (questionId === 'custom-rating') {
                      questionLabel = t("hotel.reviews.detailsDialog.customRatingItem").replace("{itemId}", "custom-rating");
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
                {t("hotel.reviews.detailsDialog.formInfo")}
              </h3>
                <div className="grid">
                  <div className="col-12">
                  <div className="mb-2">
                    <strong>{t("hotel.reviews.detailsDialog.formTitle")}</strong> {detailedReview.form?.title || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                  {detailedReview.form?.description && (
                    <div className="mb-2">
                      <strong>{t("hotel.reviews.detailsDialog.description")}</strong> {detailedReview.form.description}
                    </div>
                  )}
                  <div className="mb-2">
                    <strong>{t("hotel.reviews.detailsDialog.layout")}</strong> 
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
                {t("hotel.reviews.detailsDialog.feedbackResponses")}
              </h3>
                {detailedReview.answers.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="pi pi-info-circle text-2xl text-400 mb-2"></i>
                    <p className="text-600">{t("hotel.reviews.detailsDialog.noDetailedResponses")}</p>
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
                              <span className="text-600">{t("hotel.reviews.detailsDialog.noAnswer")}</span>
                            )}
                          </div>
                        ) : answer.question.type === 'YES_NO' ? (
                          <Tag 
                            value={answer.answer || t("hotel.reviews.detailsDialog.noAnswer")} 
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
                  label={detailedReview.isChecked ? t("hotel.reviews.buttons.checked") : t("hotel.reviews.buttons.markAsChecked")}
                  icon={detailedReview.isChecked ? "pi pi-check-circle" : "pi pi-check-circle"}
                  onClick={() => handleStatusUpdate(detailedReview.id, 'isChecked', true)}
                  className={detailedReview.isChecked ? "p-button-success" : "p-button-outlined p-button-success"}
                  disabled={detailedReview.isChecked}
                />
                <Button
                  label={detailedReview.isUrgent ? t("hotel.reviews.buttons.urgent") : t("hotel.reviews.buttons.markAsUrgent")}
                  icon={detailedReview.isUrgent ? "pi pi-exclamation-triangle" : "pi pi-exclamation-triangle"}
                  onClick={() => handleStatusUpdate(detailedReview.id, 'isUrgent', true)}
                  className={detailedReview.isUrgent ? "p-button-warning" : "p-button-outlined p-button-warning"}
                  disabled={detailedReview.isUrgent}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  label={t("hotel.reviews.buttons.close")}
                  icon="pi pi-times"
                  onClick={() => setShowDetailsDialog(false)}
                  className="p-button-outlined"
                />
                <Button
                  label={t("hotel.reviews.buttons.replyToCustomer")}
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
                <h4 className="text-lg font-semibold mb-3">{t("hotel.reviews.detailsDialog.replyToCustomer")}</h4>
                <InputTextarea
                  value={inlineReplyText}
                  onChange={(e) => setInlineReplyText(e.target.value)}
                  placeholder={t("hotel.reviews.detailsDialog.replyPlaceholder")}
                  rows={4}
                  className="w-full mb-3"
                  autoResize
                />
                <div className="flex justify-content-end gap-2">
                  <Button
                    label={t("hotel.reviews.buttons.cancel")}
                    icon="pi pi-times"
                    onClick={() => {
                      setShowInlineReply(false);
                      setInlineReplyText("");
                    }}
                    className="p-button-outlined"
                    disabled={submittingReply}
                  />
                  <Button
                    label={t("hotel.reviews.buttons.sendReply")}
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
        header={t("hotel.reviews.buttons.replyToCustomer")}
        visible={showReplyDialog}
        onHide={() => setShowReplyDialog(false)}
        style={{ width: '90vw', maxWidth: '600px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.reviews.buttons.cancel")}
              icon="pi pi-times"
              onClick={() => setShowReplyDialog(false)}
              className="p-button-outlined"
              disabled={submittingReply}
            />
            <Button
              label={t("hotel.reviews.buttons.sendReply")}
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
                <h4 className="text-900 mb-2">{t("hotel.reviews.detailsDialog.guestInfo")}</h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <strong>{t("hotel.reviews.detailsDialog.name")}</strong> {selectedReview.guestName || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>{t("hotel.reviews.detailsDialog.email")}</strong> {selectedReview.guestEmail || t("hotel.reviews.detailsDialog.notProvided")}
                  </div>
                </div>
              </div>
              
              <Divider />
              
              <div className="mb-3">
                <label className="block text-900 font-medium mb-2">
                  {t("hotel.reviews.detailsDialog.replyToCustomer")}
                </label>
                <InputTextarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={t("hotel.reviews.detailsDialog.replyPlaceholder")}
                  rows={6}
                  className="w-full"
                  autoResize
                />
                <small className="text-600">
                  {t("hotel.reviews.detailsDialog.replyMessageHint").replace("{guestEmail}", selectedReview.guestEmail || t("hotel.reviews.detailsDialog.notProvided"))}
                </small>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        header={t("hotel.reviews.deleteDialog.header")}
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        style={{ width: '90vw', maxWidth: '500px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        modal
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={t("hotel.reviews.buttons.cancel")}
              icon="pi pi-times"
              onClick={() => setShowDeleteDialog(false)}
              className="p-button-outlined"
              disabled={deletingReview}
            />
            <Button
              label={t("hotel.reviews.buttons.delete")}
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
                <h3 className="text-900 mb-2">{t("hotel.reviews.deleteDialog.confirmTitle")}</h3>
                <p className="text-600 mb-4">
                  {t("hotel.reviews.deleteDialog.confirmMessage")}
                </p>
              </div>
              
              <div className="border-1 border-200 border-round p-3 bg-gray-50">
                <h4 className="text-900 mb-2">{t("hotel.reviews.deleteDialog.reviewDetails")}</h4>
                <div className="grid">
                  <div className="col-12 md:col-6">
                    <strong>{t("hotel.reviews.deleteDialog.guest")}</strong> {reviewToDelete.guestName || t("hotel.reviews.detailsDialog.anonymous")}
                  </div>
                  <div className="col-12 md:col-6">
                    <strong>{t("hotel.reviews.deleteDialog.rating")}</strong> {reviewToDelete.overallRating}/5 ⭐
                  </div>
                  <div className="col-12">
                    <strong>{t("hotel.reviews.deleteDialog.submitted")}</strong> {formatDate(reviewToDelete.submittedAt)}
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
