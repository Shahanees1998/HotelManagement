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
  overallRating: number;
  status: string;
  isPublic: boolean;
  isShared: boolean;
  submittedAt: string;
  publishedAt?: string;
  formTitle: string;
}

interface DetailedReview {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  overallRating: number;
  status: string;
  isPublic: boolean;
  isShared: boolean;
  submittedAt: string;
  publishedAt?: string;
  form: {
    title: string;
    description?: string;
    layout: string;
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
    status: "",
    ratings: [] as string[],
    search: "",
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
  const toast = useRef<Toast>(null);


  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getHotelReviews({
        status: filters.status,
        ratings: filters.ratings.join(','),
        search: filters.search,
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
  }, [filters.status, filters.ratings, filters.search, filters.startDate, filters.endDate, currentPage, rowsPerPage, showToast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filters.status, filters.ratings, filters.search, filters.startDate, filters.endDate]);

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

  const renderAnswer = (question: any, answer: any, customRatingItems?: any[]) => {
    switch (question.type) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        return <span className="text-900">{answer || 'No answer provided'}</span>;
      
      case 'STAR_RATING':
        return (
          <div className="flex align-items-center gap-2">
            <Rating value={answer || 0} readOnly stars={5} cancel={false} />
            <span className="text-600">({answer || 0}/5)</span>
          </div>
        );
      
      case 'CUSTOM_RATING':
        return (
          <div className="flex flex-column gap-2">
            {customRatingItems && customRatingItems.length > 0 ? (
              customRatingItems.map((item: any) => (
                <div key={item.id} className="flex align-items-center justify-content-between p-2 border-1 border-200 border-round">
                  <span className="text-900 font-medium">{item.label}</span>
                  <div className="flex align-items-center gap-2">
                    <Rating value={item.rating || 0} readOnly stars={5} cancel={false} />
                    <span className="text-600 text-sm">({item.rating || 0}/5)</span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-600">{answer}</span>
            )}
          </div>
        );
      
      case 'MULTIPLE_CHOICE_SINGLE':
        return <span className="text-900">{answer || 'No answer provided'}</span>;
      
      case 'MULTIPLE_CHOICE_MULTIPLE':
        return (
          <div className="flex flex-wrap gap-1">
            {Array.isArray(answer) && answer.length > 0 ? (
              answer.map((item: string, index: number) => (
                <Tag key={index} value={item} severity="info" />
              ))
            ) : (
              <span className="text-600">No answer provided</span>
            )}
          </div>
        );
      
      case 'YES_NO':
        return (
          <Tag 
            value={answer || 'No answer'} 
            severity={answer === 'Yes' ? 'success' : answer === 'No' ? 'danger' : 'info'} 
          />
        );
      
      default:
        return <span className="text-900">{JSON.stringify(answer) || 'No answer provided'}</span>;
    }
  };

  const ratingBodyTemplate = useMemo(() => (rowData: Review) => {
    return (
      <div className="flex align-items-center gap-2">
        <span className={`font-bold ${getRatingColor(rowData.overallRating)}`}>
          {rowData.overallRating}
        </span>
        <i className="pi pi-star-fill text-yellow-500"></i>
      </div>
    );
  }, []);

  const statusBodyTemplate = useMemo(() => (rowData: Review) => {
    return (
      <Dropdown
        value={rowData.status}
        options={[
          { label: "Pending", value: "PENDING" },
          { label: "Approved", value: "APPROVED" },
          { label: "Rejected", value: "REJECTED" },
        ]}
        onChange={(e) => handleStatusChange(rowData.id, e.value)}
        className="w-full"
      />
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
          label="View Details"
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
      </div>
    );
  }, [loadingDetails]);


  const statusOptions = useMemo(() => [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
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
      status: "",
      ratings: [],
      search: "",
      startDate: null,
      endDate: null,
    });
  }, []);

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
            <div className="col-12 md:col-6 lg:col-3">
              <label className="block text-900 font-medium mb-2">Search Guest</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by guest name..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6 lg:col-3">
              <label className="block text-900 font-medium mb-2">Status</label>
              <Dropdown
                value={filters.status}
                options={statusOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                placeholder="All Statuses"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-6 lg:col-3">
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
            <div className="col-12 md:col-6 lg:col-3">
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
            <div className="col-12 md:col-6 lg:col-3">
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
              >
                <Column field="guestName" header="Guest" sortable />
                <Column field="guestEmail" header="Email" />
                <Column field="overallRating" header="Rating" body={ratingBodyTemplate} sortable />
                {/* <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column field="visibility" header="Visibility" body={visibilityBodyTemplate} />
                <Column field="formTitle" header="Form" /> */}
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
        header="Complete Feedback Details"
        visible={showDetailsDialog}
        onHide={() => setShowDetailsDialog(false)}
        style={{ width: '90vw', maxWidth: '800px' }}
        maximizable
        modal
      >
        {detailedReview && (
          <div className="grid">
            {/* Guest Information */}
            <div className="col-12">
              <Card title="Guest Information" className="mb-4">
                <div className="grid">
                  <div className="col-12 md:col-4">
                    <strong>Name:</strong> {detailedReview.guestName || 'Not provided'}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Email:</strong> {detailedReview.guestEmail || 'Not provided'}
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Phone:</strong> {detailedReview.guestPhone || 'Not provided'}
                  </div>
                </div>
              </Card>
            </div>

            {/* Form Information */}
            <div className="col-12">
              <Card title="Form Information" className="mb-4">
                <div className="grid">
                  <div className="col-12">
                    <strong>Form Title:</strong> {detailedReview.form?.title || 'N/A'}
                  </div>
                  {detailedReview.form?.description && (
                    <div className="col-12">
                      <strong>Description:</strong> {detailedReview.form.description}
                    </div>
                  )}
                  <div className="col-12 md:col-4">
                    <strong>Overall Rating:</strong>
                    <div className="flex align-items-center gap-2 mt-2">
                      <Rating value={detailedReview.overallRating} readOnly stars={5} cancel={false} />
                      <span className="text-600">({detailedReview.overallRating}/5)</span>
                    </div>
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Status:</strong>
                    <Tag 
                      value={detailedReview.status} 
                      severity={getStatusSeverity(detailedReview.status)} 
                      className="ml-2"
                    />
                  </div>
                  <div className="col-12 md:col-4">
                    <strong>Submitted:</strong> {formatDate(detailedReview.submittedAt)}
                  </div>
                </div>
              </Card>
            </div>

            {/* Feedback Answers */}
            <div className="col-12">
              <Card title="Feedback Responses">
                {detailedReview.answers.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="pi pi-info-circle text-2xl text-400 mb-2"></i>
                    <p className="text-600">No detailed responses available for this review.</p>
                  </div>
                ) : (
                  <div className="grid">
                    {detailedReview.answers.map((answer, index) => (
                      <div key={answer.id} className="col-12">
                        <div className="question-item p-3 border-1 border-200 border-round mb-3">
                          <div className="question-header mb-2">
                            <h6 className="text-900 m-0">
                              {answer.question.question}
                              {answer.question.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </h6>
                            <small className="text-600">
                              {answer.question.type.replace('_', ' ').toLowerCase()}
                            </small>
                          </div>
                          <div className="question-answer">
                            {renderAnswer(answer.question, answer.answer, answer.customRatingItems)}
                          </div>
                        </div>
                        {index < detailedReview.answers.length - 1 && <Divider />}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog
        header="Reply to Customer"
        visible={showReplyDialog}
        onHide={() => setShowReplyDialog(false)}
        style={{ width: '90vw', maxWidth: '600px' }}
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

      <Toast ref={toast} />
    </div>
  );
}
