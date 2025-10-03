"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { CustomPaginator } from "@/components/CustomPaginator";
import { InputTextarea } from "primereact/inputtextarea";
import { Dialog } from "primereact/dialog";

interface Escalation {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  hotelName?: string;
  hotelSlug?: string;
  userName: string;
  userEmail: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export default function AdminEscalations() {
  const { user } = useAuth();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [responseText, setResponseText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const toast = useRef<Toast>(null);

  // Helper function to update filters and reset page
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const loadEscalations = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getAdminEscalations();
      setEscalations((response as any).data || []);
    } catch (error) {
      console.error("Error loading escalations:", error);
      showToast("error", "Error", "Failed to load escalations");
      setEscalations([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const handleStatusChange = useCallback(async (escalationId: string, newStatus: string) => {
    try {
      // TODO: Implement status change API call
      setEscalations(prev => prev.map(esc => 
        esc.id === escalationId 
          ? { 
              ...esc, 
              status: newStatus,
              resolvedAt: newStatus === "RESOLVED" ? new Date().toISOString() : undefined
            }
          : esc
      ));
      showToast("success", "Success", "Escalation status updated");
    } catch (error) {
      showToast("error", "Error", "Failed to update escalation status");
    }
  }, [showToast]);

  const handleSubmitStatusChange = useCallback(async () => {
    if (!selectedEscalation || !newStatus) {
      showToast("warn", "Warning", "Please select a status");
      return;
    }

    if (newStatus === selectedEscalation.status) {
      showToast("warn", "Warning", "Status is already set to this value");
      return;
    }

    try {
      await handleStatusChange(selectedEscalation.id, newStatus);
      setShowStatusModal(false);
      setNewStatus("");
    } catch (error) {
      showToast("error", "Error", "Failed to update escalation status");
    }
  }, [selectedEscalation, newStatus, handleStatusChange, showToast]);

  const handleRespond = useCallback((escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setResponseText(escalation.adminResponse || "");
    setShowResponseModal(true);
  }, []);

  const handleViewDetails = useCallback((escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setShowDetailsModal(true);
  }, []);

  const handleChangeStatus = useCallback((escalation: Escalation) => {
    setSelectedEscalation(escalation);
    setNewStatus(escalation.status);
    setShowStatusModal(true);
  }, []);

  const handleSubmitResponse = useCallback(async () => {
    if (!selectedEscalation || !responseText.trim()) {
      showToast("warn", "Warning", "Please enter a response");
      return;
    }

    try {
      // TODO: Implement response submission API call
      setEscalations(prev => prev.map(esc => 
        esc.id === selectedEscalation.id 
          ? { ...esc, adminResponse: responseText, status: "IN_PROGRESS" }
          : esc
      ));
      setShowResponseModal(false);
      setResponseText("");
      showToast("success", "Success", "Response submitted successfully");
    } catch (error) {
      showToast("error", "Error", "Failed to submit response");
    }
  }, [selectedEscalation, responseText, showToast]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case "OPEN": return "danger";
      case "IN_PROGRESS": return "warning";
      case "RESOLVED": return "success";
      case "CLOSED": return "info";
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

  const hotelBodyTemplate = useCallback((rowData: Escalation) => {
    return (
      <div>
        <div className="font-semibold">{rowData.hotelName || "N/A"}</div>
        {rowData.hotelSlug && (
          <div className="text-sm text-600">/{rowData.hotelSlug}</div>
        )}
      </div>
    );
  }, []);

  const userBodyTemplate = useCallback((rowData: Escalation) => {
    return (
      <div>
        <div className="font-semibold">{rowData.userName}</div>
        <div className="text-sm text-600">{rowData.userEmail}</div>
      </div>
    );
  }, []);

  const subjectBodyTemplate = useCallback((rowData: Escalation) => {
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

  const statusBodyTemplate = useCallback((rowData: Escalation) => {
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

  const priorityBodyTemplate = useCallback((rowData: Escalation) => {
    return (
      <Tag 
        value={rowData.priority} 
        severity={getPrioritySeverity(rowData.priority) as any} 
      />
    );
  }, []);

  const actionsBodyTemplate = useCallback((rowData: Escalation) => {
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
      </div>
    );
  }, [handleRespond, handleViewDetails]);

  const dateBodyTemplate = useCallback((rowData: Escalation) => {
    return formatDate(rowData.createdAt);
  }, [formatDate]);

  const filteredEscalations = useMemo(() => {
    return escalations.filter(esc => {
      if (filters.status && esc.status !== filters.status) return false;
      if (filters.priority && esc.priority !== filters.priority) return false;
      if (filters.search && !esc.subject.toLowerCase().includes(filters.search.toLowerCase()) && 
          !esc.userName.toLowerCase().includes(filters.search.toLowerCase()) &&
          !esc.hotelName?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [escalations, filters.status, filters.priority, filters.search]);

  // Paginate the filtered escalations
  const paginatedEscalations = useMemo(() => {
    return filteredEscalations.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredEscalations, currentPage, rowsPerPage]);

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
            <h1 className="text-3xl font-bold m-0">Escalations</h1>
            <p className="text-600 mt-2 mb-0">Manage escalated issues and requests from hotels.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadEscalations}
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
                placeholder="Search by subject, user, or hotel..."
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

      {/* Escalations Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading escalations...</p>
              </div>
            </div>
          ) : filteredEscalations.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-exclamation-triangle text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Escalations Found</h3>
              <p className="text-600 mb-4">
                {escalations.length === 0 
                  ? "No escalations have been submitted yet." 
                  : "No escalations match your current filters."
                }
              </p>
            </div>
          ) : (
            <>
              <DataTable 
                value={paginatedEscalations}
                dataKey="id"
                emptyMessage="No escalations found"
                className="p-datatable-sm"
                scrollable
                scrollHeight="400px"
              >
                <Column field="hotel" header="Hotel" body={hotelBodyTemplate} sortable style={{ minWidth: '150px' }} />
                <Column field="user" header="User" body={userBodyTemplate} style={{ minWidth: '150px' }} />
                <Column field="subject" header="Subject" body={subjectBodyTemplate} sortable style={{ minWidth: '300px' }} />
                <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable style={{ minWidth: '120px' }} />
                <Column field="status" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '150px' }} />
                <Column 
                  field="createdAt" 
                  header="Created" 
                  body={dateBodyTemplate}
                  sortable 
                  style={{ minWidth: '150px' }}
                />
                <Column 
                  header="Actions" 
                  body={actionsBodyTemplate} 
                  style={{ minWidth: '120px' }}
                  frozen
                  alignFrozen="right"
                />
              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={filteredEscalations.length}
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
        header={`Respond to: ${selectedEscalation?.subject || 'Escalation'}`}
        visible={showResponseModal && !!selectedEscalation}
        style={{ width: '50vw' }}
        onHide={() => setShowResponseModal(false)}
        modal
        maximizable
        blockScroll
      >
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Original Message</label>
          <div className="p-3 border-1 surface-border border-round bg-gray-50">
            {selectedEscalation?.message}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-900 font-medium mb-2">Your Response</label>
          <InputTextarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="w-full"
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
        header={`Escalation Details: ${selectedEscalation?.subject || 'Escalation'}`}
        visible={showDetailsModal && !!selectedEscalation}
        style={{ width: '60vw' }}
        onHide={() => setShowDetailsModal(false)}
        modal
        maximizable
        blockScroll
      >
        {selectedEscalation && (
          <div className="flex flex-column gap-4">
            {/* Basic Information */}
            <div className="grid">
              <div className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round">
                  <h4 className="text-lg font-semibold mb-3 text-primary">Escalation Information</h4>
                  <div className="flex flex-column gap-2">
                    <div className="flex justify-content-between">
                      <span className="font-medium">Subject:</span>
                      <span className="text-right">{selectedEscalation.subject}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Status:</span>
                      <Tag 
                        value={selectedEscalation.status} 
                        severity={getStatusSeverity(selectedEscalation.status) as any} 
                      />
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Priority:</span>
                      <Tag 
                        value={selectedEscalation.priority} 
                        severity={getPrioritySeverity(selectedEscalation.priority) as any} 
                      />
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(selectedEscalation.createdAt)}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Last Updated:</span>
                      <span>{formatDate(selectedEscalation.updatedAt)}</span>
                    </div>
                    {selectedEscalation.resolvedAt && (
                      <div className="flex justify-content-between">
                        <span className="font-medium">Resolved:</span>
                        <span>{formatDate(selectedEscalation.resolvedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-12 md:col-6">
                <div className="p-3 border-1 surface-border border-round">
                  <h4 className="text-lg font-semibold mb-3 text-primary">Hotel & User Information</h4>
                  <div className="flex flex-column gap-2">
                    <div className="flex justify-content-between">
                      <span className="font-medium">Hotel:</span>
                      <span className="text-right">{selectedEscalation.hotelName || "N/A"}</span>
                    </div>
                    {selectedEscalation.hotelSlug && (
                      <div className="flex justify-content-between">
                        <span className="font-medium">Hotel Slug:</span>
                        <span className="text-right">/{selectedEscalation.hotelSlug}</span>
                      </div>
                    )}
                    <div className="flex justify-content-between">
                      <span className="font-medium">User:</span>
                      <span className="text-right">{selectedEscalation.userName}</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-medium">Email:</span>
                      <span className="text-right">{selectedEscalation.userEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="p-3 border-1 surface-border border-round">
              <h4 className="text-lg font-semibold mb-3 text-primary">Original Message</h4>
              <div className="p-3 bg-gray-50 border-round" style={{ whiteSpace: 'pre-wrap' }}>
                {selectedEscalation.message}
              </div>
            </div>

            {/* Admin Response */}
            {selectedEscalation.adminResponse && (
              <div className="p-3 border-1 surface-border border-round">
                <h4 className="text-lg font-semibold mb-3 text-primary">Admin Response</h4>
                <div className="p-3 bg-blue-50 border-round" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedEscalation.adminResponse}
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
                  handleRespond(selectedEscalation);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog
        header={`Change Status: ${selectedEscalation?.subject || 'Escalation'}`}
        visible={showStatusModal && !!selectedEscalation}
        style={{ width: '400px' }}
        onHide={() => setShowStatusModal(false)}
        modal
        blockScroll
      >
        {selectedEscalation && (
          <div className="flex flex-column gap-4">
            {/* Current Status */}
            <div className="p-3 border-1 surface-border border-round">
              <h4 className="text-lg font-semibold mb-3 text-primary">Current Status</h4>
              <div className="flex align-items-center gap-2">
                <Tag 
                  value={selectedEscalation.status} 
                  severity={getStatusSeverity(selectedEscalation.status) as any} 
                />
                <span className="text-600">({selectedEscalation.status})</span>
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
                  {newStatus === "OPEN" && "The escalation is newly created and awaiting attention."}
                  {newStatus === "IN_PROGRESS" && "The escalation is being actively worked on by the admin team."}
                  {newStatus === "RESOLVED" && "The escalation has been resolved and the issue is fixed."}
                  {newStatus === "CLOSED" && "The escalation is closed and no further action is required."}
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
                disabled={!newStatus || newStatus === selectedEscalation.status}
              />
            </div>
          </div>
        )}
      </Dialog>

      <Toast ref={toast} />
    </div>
  );
}
