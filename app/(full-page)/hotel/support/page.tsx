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
import { useI18n } from "@/i18n/TranslationProvider";

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
    const { t, locale } = useI18n();
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
            showToast("error", t("Error"), t("Failed to load support requests"));
            setRequests([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    }, [filters.status, filters.priority, filters.search, currentPage, rowsPerPage, showToast, t]);

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
            showToast("error", t("Error"), t("Please fill in all required fields"));
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
                showToast("success", t("Success"), t("Support request created successfully! We'll get back to you soon."));
                setShowCreateDialog(false);
                loadSupportRequests(); // Reload the list
            } else {
                const errorData = await response.json();
                showToast("error", t("Error"), errorData.error || t("Failed to create support request"));
            }
        } catch (error) {
            console.error("Error creating support request:", error);
            showToast("error", t("Error"), t("Failed to create support request"));
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

    const statusLabels = useMemo(() => ({
        OPEN: t("Open"),
        IN_PROGRESS: t("In Progress"),
        RESOLVED: t("Resolved"),
        CLOSED: t("Closed"),
    }), [t]);

    const priorityLabels = useMemo(() => ({
        LOW: t("Low"),
        MEDIUM: t("Medium"),
        HIGH: t("High"),
        URGENT: t("Urgent"),
    }), [t]);

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
            <span className="text-600">{t("No response yet")}</span>
        );
    }, [t]);

    const statusBodyTemplate = useCallback((rowData: SupportRequest) => (
        <Tag value={statusLabels[rowData.status as keyof typeof statusLabels] ?? rowData.status} severity={getStatusSeverity(rowData.status)} />
    ), [statusLabels]);

    const priorityBodyTemplate = useCallback((rowData: SupportRequest) => (
        <Tag value={priorityLabels[rowData.priority as keyof typeof priorityLabels] ?? rowData.priority} severity={getPrioritySeverity(rowData.priority)} />
    ), [priorityLabels]);

    const dateFormatter = useMemo(() => {
        const localeMap: Record<string, string> = {
            en: "en-US",
            ar: "ar-EG",
            zh: "zh-CN",
        };
        return new Intl.DateTimeFormat(localeMap[locale] ?? "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }, [locale]);

    const dateBodyTemplate = useMemo(() => (rowData: SupportRequest) => (
        dateFormatter.format(new Date(rowData.createdAt))
    ), [dateFormatter]);


    const statusOptions = useMemo(() => [
        { label: t("All Statuses"), value: "" },
        { label: t("Open"), value: "OPEN" },
        { label: t("In Progress"), value: "IN_PROGRESS" },
        { label: t("Resolved"), value: "RESOLVED" },
        { label: t("Closed"), value: "CLOSED" },
    ], [t]);

    const priorityOptions = useMemo(() => [
        { label: t("All Priorities"), value: "" },
        { label: t("Low"), value: "LOW" },
        { label: t("Medium"), value: "MEDIUM" },
        { label: t("High"), value: "HIGH" },
        { label: t("Urgent"), value: "URGENT" },
    ], [t]);

    return (
        <div className="grid">
            {/* Header */}
            <div className="col-12">
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
                    <div>
                        <h1 className="text-3xl font-bold m-0">{t("Support Requests")}</h1>
                        <p className="text-600 mt-2 mb-0">{t("Create and track your support requests with our team.")}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            label={t("Create Request")}
                            icon="pi pi-plus"
                            onClick={openCreateDialog}
                            severity="success"
                        />
                        <Button
                            label={t("Refresh")}
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
                <Card title={t("Filters")} className="mb-4">
                    <div className="grid">
                        <div className="col-12 md:col-4">
                            <label className="block text-900 font-medium mb-2">{t("Search Subject")}</label>
                            <InputText
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                placeholder={t("Search by subject...")}
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block text-900 font-medium mb-2">{t("Status")}</label>
                            <Dropdown
                                value={filters.status}
                                options={statusOptions}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                                placeholder={t("All Statuses")}
                                className="w-full"
                            />
                        </div>
                        <div className="col-12 md:col-4">
                            <label className="block text-900 font-medium mb-2">{t("Priority")}</label>
                            <Dropdown
                                value={filters.priority}
                                options={priorityOptions}
                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.value }))}
                                placeholder={t("All Priorities")}
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
                            <p>{t("Loading support requests...")}</p>
                        </div>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-6">
                        <i className="pi pi-life-ring text-4xl text-400 mb-3"></i>
                        <h3 className="text-900 mb-2">{t("No Support Requests Found")}</h3>
                        <p className="text-600 mb-4">
                            {requests.length === 0 
                                ? t("No support requests have been created yet.") 
                                : t("No requests match your current filters.")
                            }
                        </p>
                        <Button
                            label={t("Create Your First Request")}
                            icon="pi pi-plus"
                            onClick={openCreateDialog}
                        />
                    </div>
                ) : (
                    <>
                        <DataTable value={requests}>
                            <Column field="subject" header={t("Subject")} sortable />
                            <Column field="message" header={t("Message")} body={messageBodyTemplate} />
                            <Column field="status" header={t("Status")} body={statusBodyTemplate} sortable />
                            <Column field="priority" header={t("Priority")} body={priorityBodyTemplate} sortable />
                            <Column field="adminResponse" header={t("Response")} body={responseBodyTemplate} />
                            <Column field="createdAt" header={t("Created")} body={dateBodyTemplate} sortable />
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
                header={t("Create Support Request")}
                modal
                onHide={() => setShowCreateDialog(false)}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button 
                            label={t("Cancel")} 
                            icon="pi pi-times" 
                            onClick={() => setShowCreateDialog(false)} 
                            text 
                            disabled={submitting}
                        />
                        <Button 
                            label={t("Create Request")} 
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
                        <label className="block text-sm font-medium mb-2">{t("Subject *")}</label>
                        <InputText
                            value={createForm.subject}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder={t("Brief description of your issue...")}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <label className="block text-sm font-medium mb-2">{t("Priority")}</label>
                        <Dropdown
                            value={createForm.priority}
                            options={[
                                { label: t("Low"), value: "LOW" },
                                { label: t("Medium"), value: "MEDIUM" },
                                { label: t("High"), value: "HIGH" },
                                { label: t("Urgent"), value: "URGENT" },
                            ]}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.value }))}
                            placeholder={t("Select Priority")}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <label className="block text-sm font-medium mb-2">{t("Message *")}</label>
                        <InputTextarea
                            value={createForm.message}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, message: e.target.value }))}
                            rows={5}
                            placeholder={t("Please describe your issue in detail...")}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12">
                        <div className="p-3 border-1 border-blue-200 border-round bg-blue-50">
                            <div className="flex align-items-center gap-2">
                                <i className="pi pi-info-circle text-blue-500"></i>
                                <span className="text-blue-700 text-sm">
                                    <strong>{t("Note:")}</strong> {t("We'll send you an email confirmation and notify our support team. You'll receive updates via email as we work on your request.")}
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
