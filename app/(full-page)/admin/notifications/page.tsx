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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
  createdAt: string;
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.getNotifications();
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      showToast("error", "Error", "Failed to load notifications");
      // Fallback to empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
      showToast("success", "Success", "Notification marked as read");
    } catch (error) {
      showToast("error", "Error", "Failed to mark notification as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiClient.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      showToast("success", "Success", "Notification deleted");
    } catch (error) {
      showToast("error", "Error", "Failed to delete notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      showToast("success", "Success", "All notifications marked as read");
    } catch (error) {
      showToast("error", "Error", "Failed to mark all notifications as read");
    }
  };

  const getTypeSeverity = (type: string) => {
    switch (type) {
      case "NEW_REVIEW": return "success";
      case "REVIEW_APPROVED": return "info";
      case "REVIEW_REJECTED": return "danger";
      case "SUBSCRIPTION_EXPIRING": return "warning";
      case "SUBSCRIPTION_CANCELLED": return "danger";
      case "ESCALATION_RECEIVED": return "danger";
      case "ESCALATION_RESPONDED": return "info";
      case "SYSTEM_ALERT": return "warning";
      default: return "info";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "NEW_REVIEW": return "New Review";
      case "REVIEW_APPROVED": return "Review Approved";
      case "REVIEW_REJECTED": return "Review Rejected";
      case "SUBSCRIPTION_EXPIRING": return "Subscription Expiring";
      case "SUBSCRIPTION_CANCELLED": return "Subscription Cancelled";
      case "ESCALATION_RECEIVED": return "Escalation Received";
      case "ESCALATION_RESPONDED": return "Escalation Responded";
      case "SYSTEM_ALERT": return "System Alert";
      default: return type;
    }
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

  const userBodyTemplate = (rowData: Notification) => {
    return (
      <div>
        <div className="font-semibold">System</div>
        <div className="text-sm text-600">system@example.com</div>
      </div>
    );
  };

  const typeBodyTemplate = (rowData: Notification) => {
    return (
      <Tag 
        value={getTypeLabel(rowData.type)} 
        severity={getTypeSeverity(rowData.type) as any} 
      />
    );
  };

  const statusBodyTemplate = (rowData: Notification) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.isRead ? "Read" : "Unread"} 
          severity={rowData.isRead ? "info" : "warning"} 
        />
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Notification) => {
    return (
      <div className="flex gap-2">
        {!rowData.isRead && (
          <Button
            icon="pi pi-check"
            size="small"
            className="p-button-outlined p-button-sm p-button-success"
            onClick={() => handleMarkAsRead(rowData.id)}
            tooltip="Mark as Read"
          />
        )}
        <Button
          icon="pi pi-trash"
          size="small"
          className="p-button-outlined p-button-sm p-button-danger"
          onClick={() => handleDelete(rowData.id)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filters.type && notif.type !== filters.type) return false;
    if (filters.status && notif.isRead.toString() !== filters.status) return false;
    if (filters.search && !notif.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !notif.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const typeOptions = [
    { label: "All Types", value: "" },
    { label: "New Review", value: "NEW_REVIEW" },
    { label: "Review Approved", value: "REVIEW_APPROVED" },
    { label: "Review Rejected", value: "REVIEW_REJECTED" },
    { label: "Subscription Expiring", value: "SUBSCRIPTION_EXPIRING" },
    { label: "Subscription Cancelled", value: "SUBSCRIPTION_CANCELLED" },
    { label: "Escalation Received", value: "ESCALATION_RECEIVED" },
    { label: "Escalation Responded", value: "ESCALATION_RESPONDED" },
    { label: "System Alert", value: "SYSTEM_ALERT" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Unread", value: "false" },
    { label: "Read", value: "true" },
  ];

  return (
    <div className="grid">
      {/* Header */}
      <div className="col-12">
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
          <div>
            <h1 className="text-3xl font-bold m-0">System Notifications</h1>
            <p className="text-600 mt-2 mb-0">Manage all system notifications and alerts.</p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Mark All as Read"
              icon="pi pi-check"
              onClick={handleMarkAllAsRead}
              className="p-button-success"
            />
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              onClick={loadNotifications}
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
              <label className="block text-900 font-medium mb-2">Search Notifications</label>
              <InputText
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search by title, message, or user..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Type</label>
              <Dropdown
                value={filters.type}
                options={typeOptions}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.value }))}
                placeholder="All Types"
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
          </div>
        </Card>
      </div>

      {/* Notifications Table */}
      <div className="col-12">
        <Card>
          {loading ? (
            <div className="flex align-items-center justify-content-center" style={{ height: '200px' }}>
              <div className="text-center">
                <i className="pi pi-spinner pi-spin text-2xl mb-2"></i>
                <p>Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-6">
              <i className="pi pi-bell text-4xl text-400 mb-3"></i>
              <h3 className="text-900 mb-2">No Notifications Found</h3>
              <p className="text-600 mb-4">
                {notifications.length === 0 
                  ? "No notifications have been generated yet." 
                  : "No notifications match your current filters."
                }
              </p>
            </div>
          ) : (
            <DataTable 
              value={filteredNotifications} 
              showGridlines
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
            >
              <Column field="title" header="Title" sortable />
              <Column field="message" header="Message" style={{ maxWidth: '300px' }} />
              <Column field="user" header="User" body={userBodyTemplate} />
              <Column field="type" header="Type" body={typeBodyTemplate} sortable />
              <Column field="status" header="Status" body={statusBodyTemplate} sortable />
              <Column 
                field="createdAt" 
                header="Created" 
                body={(rowData) => formatDate(rowData.createdAt)}
                sortable 
              />
              <Column header="Actions" body={actionsBodyTemplate} />
            </DataTable>
          )}
        </Card>
      </div>

      <Toast ref={toast} />
    </div>
  );
}
