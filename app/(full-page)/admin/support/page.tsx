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
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";

interface SupportRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  hotel?: {
    name: string;
    slug: string;
  };
  adminResponse?: string;
}

export default function AdminSupport() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [escalationReason, setEscalationReason] = useState("");
  const toast = useRef<Toast>(null);

  // Helper function to update filters and reset page
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  useEffect(() => {
    loadSupportRequests();
  }, []);

  const loadSupportRequests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminSupportRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error("Error loading support requests:", error);
      showToast("error", "Error", "Failed to load support requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      // TODO: Implement status change API call
      setRequests(prev => prev.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
      showToast("success", "Success", "Support request status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update support request status");
    }
  };

  const handleRespond = useCallback((request: SupportRequest) => {
    setSelectedRequest(request);
    setResponseText(request.adminResponse || "");
    setShowResponseModal(true);
  }, []);

  const handleViewDetails = useCallback((request: SupportRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  }, []);

  const handleChangeStatus = useCallback((request: SupportRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setShowStatusModal(true);
  }, []);

  const handleEscalate = useCallback((request: SupportRequest) => {
    setSelectedRequest(request);
    setEscalationReason("");
    setShowEscalateModal(true);
  }, []);

  const handleSubmitResponse = useCallback(async () => {
    if (!selectedRequest || !responseText.trim()) {
      showToast("warn", "Warning", "Please enter a response");
      return;
    }

    try {
      // TODO: Implement response submission API call
      setRequests(prev => prev.map(req =>
        req.id === selectedRequest.id
          ? { ...req, adminResponse: responseText, status: "IN_PROGRESS" }
          : req
      ));
      setShowResponseModal(false);
      setResponseText("");
      showToast("success", "Success", "Response submitted successfully");
    } catch (error) {
      showToast("error", "Error", "Failed to submit response");
    }
  }, [selectedRequest, responseText]);

  const handleSubmitStatusChange = useCallback(async () => {
    if (!selectedRequest || !newStatus) {
      showToast("warn", "Warning", "Please select a status");
      return;
    }

    if (newStatus === selectedRequest.status) {
      showToast("warn", "Warning", "Status is already set to this value");
      return;
    }

    try {
      await handleStatusChange(selectedRequest.id, newStatus);
      setShowStatusModal(false);
      setNewStatus("");
    } catch (error) {
      showToast("error", "Error", "Failed to update support request status");
    }
  }, [selectedRequest, newStatus]);

  const handleSubmitEscalation = useCallback(async () => {
    if (!selectedRequest || !escalationReason.trim()) {
      showToast("warn", "Warning", "Please provide a reason for escalation");
      return;
    }

    try {
      // Call the escalation API
      const response = await fetch('/api/admin/escalations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supportRequestId: selectedRequest.id,
          subject: `ESCALATED: ${selectedRequest.subject}`,
          message: `Original Request: ${selectedRequest.message}\n\nEscalation Reason: ${escalationReason}`,
          priority: selectedRequest.priority === 'URGENT' ? 'URGENT' : 'HIGH',
          escalationReason: escalationReason,
        }),
      });

      if (response.ok) {
        // Update the support request status to escalated
        setRequests(prev => prev.map(req =>
          req.id === selectedRequest.id
            ? { ...req, status: 'ESCALATED', adminResponse: `Escalated: ${escalationReason}` }
            : req
        ));

        setShowEscalateModal(false);
        setEscalationReason("");
        showToast("success", "Success", "Support request escalated successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to escalate support request');
      }
    } catch (error) {
      console.error('Error escalating support request:', error);
      showToast("error", "Error", "Failed to escalate support request");
    }
  }, [selectedRequest, escalationReason]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "OPEN": return "danger";
      case "IN_PROGRESS": return "warning";
      case "RESOLVED": return "success";
      case "CLOSED": return "info";
      case "ESCALATED": return "danger";
      default: return "info";
    }
  };

  const getPrioritySeverity = (priority: string) => {
    switch (priority) {
      case "LOW": return "info";
      case "MEDIUM": return "warning";
      case "HIGH": return "danger";
      case "URGENT": return "danger";
      default: return "info";
    }
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const subjectBodyTemplate = useCallback((rowData: SupportRequest) => {
    return (
      <div style={{ maxWidth: '300px' }}>
        <div className="font-semibold" style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {rowData.subject}
        </div>
        <div className="text-sm text-600 line-height-3" style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.4'
        }}>
          {rowData.message}
        </div>
      </div>
    );
  }, []);

  const userBodyTemplate = useCallback((rowData: SupportRequest) => {
    return (
      <div>
        <div className="font-semibold">{`${rowData.user.firstName} ${rowData.user.lastName}`}</div>
        <div className="text-sm text-600">{rowData.user.email}</div>
        {rowData.hotel && (
          <div className="text-sm text-500">{rowData.hotel.name}</div>
        )}
      </div>
    );
  }, []);

  const statusBodyTemplate = useCallback((rowData: SupportRequest) => {
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
          onClick={() => handleChangeStatus(rowData)}
          tooltip="Change Status"
        />
      </div>
    );
  }, [handleChangeStatus]);

  const priorityBodyTemplate = useCallback((rowData: SupportRequest) => {
    return (
      <Tag
        value={rowData.priority}
        severity={getPrioritySeverity(rowData.priority) as any}
      />
    );
  }, []);

  const actionsBodyTemplate = useCallback((rowData: SupportRequest) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-reply"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleRespond(rowData)}
          tooltip="Respond"
        />
        <Button
          icon="pi pi-eye"
          size="small"
          className="p-button-outlined p-button-sm"
          onClick={() => handleViewDetails(rowData)}
          tooltip="View Details"
        />
        {rowData.status !== 'ESCALATED' && rowData.status !== 'RESOLVED' && rowData.status !== 'CLOSED' && (
          <Button
            icon="pi pi-arrow-up"
            size="small"
            className="p-button-outlined p-button-sm p-button-danger"
            onClick={() => handleEscalate(rowData)}
            tooltip="Escalate to Management"
          />
        )}
      </div>
    );
  }, [handleRespond, handleViewDetails, handleEscalate]);

  const dateBodyTemplate = useCallback((rowData: SupportRequest) => {
    return formatDate(rowData.createdAt);
  }, [formatDate]);

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (filters.status && req.status !== filters.status) return false;
      if (filters.priority && req.priority !== filters.priority) return false;
      if (filters.search && !req.subject.toLowerCase().includes(filters.search.toLowerCase()) &&
        !req.user.firstName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !req.user.lastName.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [requests, filters.status, filters.priority, filters.search]);

  // Paginate the filtered requests
  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredRequests, currentPage, rowsPerPage]);

  const statusOptions = useMemo(() => [
    { label: "All Statuses", value: "" },
    { label: "Open", value: "OPEN" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Closed", value: "CLOSED" },
  ], []);

  const priorityOptions = useMemo(() => [
    { label: "All Priorities", value: "" },
    { label: "Low", value: "LOW" },
    { label: "Medium", value: "MEDIUM" },
    { label: "High", value: "HIGH" },
    { label: "Urgent", value: "URGENT" },
  ], []);

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">Support Requests</h1>
            <p className="text-600 mt-2 mb-0">Manage all support requests from hotels.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadSupportRequests}
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
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Search</label>
              <InputText
                value={filters.search}
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Search by subject or user..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Status</label>
              <Dropdown
                value={filters.status}
                options={statusOptions}
                onChange={(e) => updateFilters({ status: e.value })}
                placeholder="All Statuses"
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Priority</label>
              <Dropdown
                value={filters.priority}
                options={priorityOptions}
                onChange={(e) => updateFilters({ priority: e.value })}
                placeholder="All Priorities"
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Support Requests Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading support requests...</p>
              </div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-question-circle text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Support Requests Found</h3>
              <p className="text-600 mb-4">
                {requests.length === 0
                  ? "No support requests have been submitted yet."
                  : "No support requests match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable
                value={paginatedRequests}
              >
              <Column field="subject" header="Subject" body={subjectBodyTemplate} sortable />
              <Column field="user" header="User" body={userBodyTemplate} />
              <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} sortable />
              <Column
                field="createdAt"
                header="Created"
                body={dateBodyTemplate}
                sortable
              />
              <Column header="Actions" body={actionsBodyTemplate} />
              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={filteredRequests.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
          )}
        </Card>
      </div>

      {/* Response Dialog */}
      <Dialog
        header={`Respond to: ${selectedRequest?.subject || 'Support Request'}`}
        visible={showResponseModal && !!selectedRequest}
        style={{ width: '50vw' }}
        onHide={() => setShowResponseModal(false)}
        modal
        maximizable
        blockScroll
      >
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Original Message</label>
          <div className="p-3 border-1 surface-border border-round bg-gray-50">
            {selectedRequest?.message}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Your Response</label>
          <InputTextarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}className="w-full"
            placeholder="Enter your response..."
          />
        </div>
        <div className="flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            className="p-button-outlined"
            onClick={() => setShowResponseModal(false)}
          />
          <Button
            label="Submit Response"
            icon="pi pi-send"
            onClick={handleSubmitResponse}
          />
        </div>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        header={`Support Request Details: ${selectedRequest?.subject || 'Support Request'}`}
        visible={showDetailsModal && !!selectedRequest}
        style={{ width: '60vw' }}
        onHide={() => setShowDetailsModal(false)}
        modal
        maximizable
        blockScroll
      >
        {selectedRequest && (
          <div className="flex flex-column gap-4">
            {/* Basic Information */}
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round">
                  <h4 className="text-lg font-semibold mb-3 text-primary">Request Information</h4>
                  <div className="flex flex-column gap-2">
                    <div className="flex justify-content-between">
                      <span className="font-medium">Subject:</span>
                      <span className="text-right">{selectedRequest.subject}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Status:</span>
                      <Tag 
                        value={selectedRequest.status} 
                        severity={getStatusSeverity(selectedRequest.status) as any} 
                      />
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Priority:</span>
                      <Tag 
                        value={selectedRequest.priority} 
                        severity={getPrioritySeverity(selectedRequest.priority) as any} 
                      />
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(selectedRequest.createdAt)}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Last Updated:</span>
                      <span>{formatDate(selectedRequest.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round">
                  <h4 className="text-lg font-semibold mb-3 text-primary">User Information</h4>
                  <div className="flex flex-column gap-2">
                    <div className="flex justify-content-between">
                      <span className="font-medium">Name:</span>
                      <span className="text-right">{`${selectedRequest.user.firstName} ${selectedRequest.user.lastName}`}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-right">{selectedRequest.user.email}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Role:</span>
                      <span className="text-right">{selectedRequest.user.role}</span>
                    </div>
                    {selectedRequest.hotel && (
                      <>
                        <div className="flex justify-content-between">
                          <span className="font-medium">Hotel:</span>
                          <span className="text-right">{selectedRequest.hotel.name}</span>
                        </div>
                        <div className="flex justify-content-between">
                          <span className="font-medium">Hotel Slug:</span>
                          <span className="text-right">/{selectedRequest.hotel.slug}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="p-3 border-1 surface-border border-round">
              <h4 className="text-lg font-semibold mb-3 text-primary">Original Message</h4>
              <div className="p-3 bg-gray-50 border-round" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedRequest.message}
              </div>
            </div>

            {/* Admin Response */}
            {selectedRequest.adminResponse && (
              <div className="p-3 border-1 surface-border border-round">
                <h4 className="text-lg font-semibold mb-3 text-primary">Admin Response</h4>
                <div className="p-3 bg-blue-50 border-round" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedRequest.adminResponse}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-content-end gap-2">
              <Button
                label="Close"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setShowDetailsModal(false)}
              />
              <Button
                label="Respond"
                icon="pi pi-reply"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleRespond(selectedRequest);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        header={`Change Status: ${selectedRequest?.subject || 'Support Request'}`}
        visible={showStatusModal && !!selectedRequest}
        style={{ width: '400px' }}
        onHide={() => setShowStatusModal(false)}
        modal
        blockScroll
      >
        {selectedRequest && (
          <div className="flex flex-column gap-4">
            {/* Current Status */}
            <div className="p-3 border-1 surface-border border-round">
              <h4 className="text-lg font-semibold mb-3 text-primary">Current Status</h4>
              <div className="flex align-items-center gap-2">
                <Tag 
                  value={selectedRequest.status} 
                  severity={getStatusSeverity(selectedRequest.status) as any} 
                />
                <span className="text-600">({selectedRequest.status})</span>
              </div>
            </div>

            {/* New Status Selection */}
            <div>
              <label className="block text-900 font-medium mb-2">Select New Status</label>
              <Dropdown
                value={newStatus}
                options={[
                  { label: "Open", value: "OPEN" },
                  { label: "In Progress", value: "IN_PROGRESS" },
                  { label: "Resolved", value: "RESOLVED" },
                  { label: "Closed", value: "CLOSED" },
                ]}
                onChange={(e) => setNewStatus(e.value)}
                placeholder="Select status"
                className="w-full"
              />
            </div>

            {/* Status Description */}
            {newStatus && (
              <div className="p-3 bg-blue-50 border-round">
                <h5 className="font-semibold mb-2">Status Description:</h5>
                <p className="text-sm text-600 m-0">
                  {newStatus === "OPEN" && "The support request is newly created and awaiting attention."}
                  {newStatus === "IN_PROGRESS" && "The support request is being actively worked on by the support team."}
                  {newStatus === "RESOLVED" && "The support request has been resolved and the issue is fixed."}
                  {newStatus === "CLOSED" && "The support request is closed and no further action is required."}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-content-end gap-2">
              <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setShowStatusModal(false)}
              />
              <Button
                label="Update Status"
                icon="pi pi-check"
                onClick={handleSubmitStatusChange}
                disabled={!newStatus || newStatus === selectedRequest.status}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Escalation Dialog */}
      <Dialog
        header={`Escalate Support Request: ${selectedRequest?.subject || 'Support Request'}`}
        visible={showEscalateModal && !!selectedRequest}
        style={{ width: '500px' }}
        onHide={() => setShowEscalateModal(false)}
        modal
        blockScroll
      >
        {selectedRequest && (
          <div className="flex flex-column gap-4">
            {/* Current Request Info */}
            <div className="p-3 border-1 surface-border border-round">
              <h4 className="text-lg font-semibold mb-3 text-primary">Request Information</h4>
              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between">
                  <span className="font-medium">Subject:</span>
                  <span className="text-right">{selectedRequest.subject}</span>
                </div>
                <div className="flex justify-content-between">
                  <span className="font-medium">Priority:</span>
                  <Tag 
                    value={selectedRequest.priority} 
                    severity={getPrioritySeverity(selectedRequest.priority) as any} 
                  />
                </div>
                <div className="flex justify-content-between">
                  <span className="font-medium">Current Status:</span>
                  <Tag 
                    value={selectedRequest.status} 
                    severity={getStatusSeverity(selectedRequest.status) as any} 
                  />
                </div>
                <div className="flex justify-content-between">
                  <span className="font-medium">Hotel:</span>
                  <span className="text-right">{selectedRequest.hotel?.name || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Escalation Reason */}
            <div>
              <label className="block text-900 font-medium mb-2">
                Escalation Reason <span className="text-red-500">*</span>
              </label>
              <InputTextarea
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                placeholder="Please provide a detailed reason for escalating this support request..."
                className="w-full"
                rows={4}
              />
              <small className="text-600">
                This will help management understand why this request needs immediate attention.
              </small>
            </div>

            {/* Escalation Impact */}
            <div className="p-3 bg-orange-50 border-round">
              <h5 className="font-semibold mb-2 text-orange-700">⚠️ Escalation Impact</h5>
              <ul className="text-sm text-600 m-0 pl-3">
                <li>This request will be moved to the escalations queue</li>
                <li>Management will be notified immediately</li>
                <li>Priority will be automatically set to HIGH or URGENT</li>
                <li>Status will be updated to ESCALATED</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-content-end gap-2">
              <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-outlined"
                onClick={() => setShowEscalateModal(false)}
              />
              <Button
                label="Escalate Request"
                icon="pi pi-arrow-up"
                className="p-button-danger"
                onClick={handleSubmitEscalation}
                disabled={!escalationReason.trim()}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
} 
