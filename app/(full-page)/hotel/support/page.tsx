"use client";

import { useState, useEffect, useRef } from "react";
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
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createForm, setCreateForm] = useState({
        subject: "",
        message: "",
        priority: "MEDIUM",
    });
    const [submitting, setSubmitting] = useState(false);
    const toast = useRef<Toast>(null);

    const priorityOptions = [
        { label: "Low", value: "LOW" },
        { label: "Medium", value: "MEDIUM" },
        { label: "High", value: "HIGH" },
        { label: "Urgent", value: "URGENT" },
    ];

    useEffect(() => {
        loadSupportRequests();
    }, []);

    const loadSupportRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hotel/support');
            if (response.ok) {
                const data = await response.json();
                setRequests(data.data || []);
            } else {
                const errorData = await response.json();
                showToast("error", "Error", errorData.error || "Failed to load support requests");
            }
        } catch (error) {
            console.error("Error loading support requests:", error);
            showToast("error", "Error", "Failed to load support requests");
        } finally {
            setLoading(false);
        }
    };

    const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

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

    const messageBodyTemplate = (rowData: SupportRequest) => {
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
    };

    const responseBodyTemplate = (rowData: SupportRequest) => {
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
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <div className="flex flex-column">
                <h2 className="text-2xl font-bold m-0">Support Requests</h2>
                <span className="text-600">Create and track your support requests</span>
            </div>
            <div className="flex gap-2">
                <Button
                    label="Create Support Request"
                    icon="pi pi-plus"
                    onClick={openCreateDialog}
                    severity="success"
                />
            </div>
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                    <DataTable
                        value={requests}
                        loading={loading}
                        header={header}
                        emptyMessage="No support requests found. Create your first request!"
                        responsiveLayout="scroll"
                    >
                        <Column field="subject" header="Subject" style={{ minWidth: "200px" }} />
                        <Column field="message" header="Message" body={messageBodyTemplate} style={{ minWidth: "300px" }} />
                        <Column field="status" header="Status" body={(rowData) => (
                            <Tag value={rowData.status.replace('_', ' ')} severity={getStatusSeverity(rowData.status)} />
                        )} style={{ minWidth: "120px" }} />
                        <Column field="priority" header="Priority" body={(rowData) => (
                            <Tag value={rowData.priority} severity={getPrioritySeverity(rowData.priority)} />
                        )} style={{ minWidth: "120px" }} />
                        <Column field="adminResponse" header="Response" body={responseBodyTemplate} style={{ minWidth: "300px" }} />
                        <Column field="createdAt" header="Created" body={(rowData) => (
                            new Date(rowData.createdAt).toLocaleDateString()
                        )} style={{ minWidth: "120px" }} />
                    </DataTable>
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
                            options={priorityOptions}
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
