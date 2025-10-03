"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Toast } from "primereact/toast";
import { useAuth } from "@/hooks/useAuth";
import { CustomPaginator } from "@/components/CustomPaginator";
import { apiClient } from "@/lib/apiClient";

interface SupportRequest {
    id: string;
    subject: string;
    message: string;
    status: string;
    priority: string;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
}

export default function HotelSupportPage() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        search: "",
    });
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createForm, setCreateForm] = useState({
        subject: "",
        message: "",
        priority: "MEDIUM",
    });
    const [submitting, setSubmitting] = useState(false);
    const toast = useRef<Toast>(null);

    const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const loadSupportRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.getHotelSupportRequests({
                status: filters.status,
                priority: filters.priority,
                search: filters.search,
                page: currentPage,
                limit: rowsPerPage,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setRequests((response as any).data || []);
            setTotalRecords(response.pagination?.total || 0);
        } catch (error) {
            console.error("Error loading support requests:", error);
            showToast("error", "Error", "Failed to load support requests");
            setRequests([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.priority, filters.search, currentPage, rowsPerPage, showToast]);

    useEffect(() => {
        loadSupportRequests();
    }, [loadSupportRequests]);

    // Reset to page 1 when filters change
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [filters.status, filters.priority, filters.search]);


    const openCreateDialog = () => {
        setCreateForm({
            subject: "",
            message: "",
            priority: "MEDIUM",
        });
        setShowCreateDialog(true);
    };

    const createSupportRequest = async () => {
        if (!createForm.subject.trim() || !createForm.message.trim()) {
            showToast("error", "Error", "Please fill in all required fields");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch('/api/hotel/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subject: createForm.subject,
                    message: createForm.message,
                    priority: createForm.priority,
                }),
            });

            if (response.ok) {
                showToast("success", "Success", "Support request created successfully! We'll get back to you soon.");
                setShowCreateDialog(false);
                loadSupportRequests(); // Reload the list
            } else {
                const errorData = await response.json();
                showToast("error", "Error", errorData.error || "Failed to create support request");
            }
        } catch (error) {
            console.error("Error creating support request:", error);
            showToast("error", "Error", "Failed to create support request");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusSeverity = (status: string) => {
        switch (status) {
            case "OPEN": return "danger";
            case "IN_PROGRESS": return "warning";
            case "RESOLVED": return "success";
            case "CLOSED": return "secondary";
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

    const messageBodyTemplate = useMemo(() => (rowData: SupportRequest) => {
        return (
            <div className="max-w-xs">
                <div className="text-sm">
                    {rowData.message.length > 100 
                        ? `${rowData.message.substring(0, 100)}...` 
                        : rowData.message
                    }
                </div>
            </div>
        );
    }, []);

    const responseBodyTemplate = useMemo(() => (rowData: SupportRequest) => {
        return rowData.adminResponse ? (
            <div className="max-w-xs">
                <div className="text-sm">
                    {rowData.adminResponse.length > 100 
                        ? `${rowData.adminResponse.substring(0, 100)}...` 
                        : rowData.adminResponse
                    }
                </div>
            </div>
        ) : (
            <span className="text-600">No response yet</span>
        );
    }, []);

    const statusBodyTemplate = useMemo(() => (rowData: SupportRequest) => (
        <Tag value={rowData.status.replace('_', ' ')} severity={getStatusSeverity(rowData.status)} />
    ), []);

    const priorityBodyTemplate = useMemo(() => (rowData: SupportRequest) => (
        <Tag value={rowData.priority} severity={getPrioritySeverity(rowData.priority)} />
    ), []);

    const dateBodyTemplate = useMemo(() => (rowData: SupportRequest) => (
        new Date(rowData.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    ), []);


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
                        <p className="text-600 mt-2 mb-0">Create and track your support requests with our team.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label="Create Request"
                            icon="pi pi-plus"
                            onClick={openCreateDialog}
                            severity="success"
                        />
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
                            <label className="block text-900 font-medium mb-2">Search Subject</label>
                            <InputText
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                placeholder="Search by subject..."
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block text-900 font-medium mb-2">Status</label>
                            <Dropdown
                                value={filters.status}
                                options={statusOptions}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                                placeholder="All Statuses"
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block text-900 font-medium mb-2">Priority</label>
                            <Dropdown
                                value={filters.priority}
                                options={priorityOptions}
                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.value }))}
                                placeholder="All Priorities"
                                className="w-full"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Support Requests Table */}
            <div className="col-12">
                {loading ? (
                    <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
                        <div className="text-center">
                            <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                            <p>Loading support requests...</p>
                        </div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-6">
                        <i className="pi pi-life-ring text-4xl text-400 mb-3"></i>
                        <h3 className="text-900 mb-2">No Support Requests Found</h3>
                        <p className="text-600 mb-4">
                            {requests.length === 0 
                                ? "No support requests have been created yet." 
                                : "No requests match your current filters."
                            }
                        </p>
                        <Button
                            label="Create Your First Request"
                            icon="pi pi-plus"
                            onClick={openCreateDialog}
                        />
                    </div>
                ) : (
                    <>
                        <DataTable value={requests}>
                            <Column field="subject" header="Subject" sortable />
                            <Column field="message" header="Message" body={messageBodyTemplate} />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
                            <Column field="adminResponse" header="Response" body={responseBodyTemplate} />
                            <Column field="createdAt" header="Created" body={dateBodyTemplate} sortable />
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

            {/* Create Dialog */}
            <Dialog
                visible={showCreateDialog}
                style={{ width: "600px" }}
                header="Create Support Request"
                modal
                onHide={() => setShowCreateDialog(false)}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button 
                            label="Cancel" 
                            icon="pi pi-times" 
                            onClick={() => setShowCreateDialog(false)} 
                            text 
                            disabled={submitting}
                        />
                        <Button 
                            label="Create Request" 
                            icon="pi pi-check" 
                            onClick={createSupportRequest}
                            loading={submitting}
                            disabled={submitting}
                        />
                    </div>
                }
            >
                <div className="grid">
                    <div className="col-12">
                        <label className="block text-sm font-medium mb-2">Subject *</label>
                        <InputText
                            value={createForm.subject}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief description of your issue..."
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <label className="block text-sm font-medium mb-2">Priority</label>
                        <Dropdown
                            value={createForm.priority}
                            options={[
                                { label: "Low", value: "LOW" },
                                { label: "Medium", value: "MEDIUM" },
                                { label: "High", value: "HIGH" },
                                { label: "Urgent", value: "URGENT" },
                            ]}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.value }))}
                            placeholder="Select Priority"
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <label className="block text-sm font-medium mb-2">Message *</label>
                        <InputTextarea
                            value={createForm.message}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                            rows={5}
                            placeholder="Please describe your issue in detail..."
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-500"></i>
                                <span className="text-blue-700 text-sm">
                                    <strong>Note:</strong> We'll send you an email confirmation and notify our support team. 
                                    You'll receive updates via email as we work on your request.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </Dialog>

            <Toast ref={toast} />
        </div>
    );
}
