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
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    search: "",
  });
  const toast = useRef<Toast>(null);

  // Helper function to update filters and reset page
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications API response:', data); // Debug log
        setNotifications(data.notifications || []);
      } else {
        throw new Error('Failed to load notifications');
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      showToast("error", "Error", "Failed to load notifications");
      // Fallback to empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
    toast.current?.show({ severity, summary, detail, life: 3000 });
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        ));
        showToast("success", "Success", "Notification marked as read");
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (error) {
      showToast("error", "Error", "Failed to mark notification as read");
    }
  }, [showToast]);

  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        showToast("success", "Success", "Notification deleted");
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      showToast("error", "Error", "Failed to delete notification");
    }
  }, [showToast]);

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
        showToast("success", "Success", "All notifications marked as read");
      } else {
        throw new Error('Failed to mark all notifications as read');
      }
    } catch (error) {
      showToast("error", "Error", "Failed to mark all notifications as read");
    }
  };

  const generateTestNotifications = async () => {
    try {
      const response = await fetch('/api/test-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        showToast("success", "Success", data.message);
        // Reload notifications to show the new ones
        loadNotifications();
      } else {
        throw new Error('Failed to generate test notifications');
      }
    } catch (error) {
      showToast("error", "Error", "Failed to generate test notifications");
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
      case "NEW_HOTEL_REGISTRATION": return "success";
      case "NEW_FORM_CREATED": return "info";
      case "PAYMENT_METHOD_ADDED": return "info";
      case "SUCCESS": return "success";
      case "INFO": return "info";
      case "WARNING": return "warning";
      case "ERROR": return "danger";
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
      case "NEW_HOTEL_REGISTRATION": return "New Hotel Registration";
      case "NEW_FORM_CREATED": return "New Form Created";
      case "PAYMENT_METHOD_ADDED": return "Payment Method Added";
      case "SUCCESS": return "Success";
      case "INFO": return "Info";
      case "WARNING": return "Warning";
      case "ERROR": return "Error";
      default: return type;
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

  const userBodyTemplate = useMemo(() => (rowData: Notification) => {
    return (
      <div>
        <div className="font-semibold">System</div>
        <div className="text-sm text-600">system@example.com</div>
      </div>
    );
  }, []);

  const typeBodyTemplate = useMemo(() => (rowData: Notification) => {
    return (
      <Tag 
        value={getTypeLabel(rowData.type)} 
        severity={getTypeSeverity(rowData.type) as any} 
      />
    );
  }, []);

  const statusBodyTemplate = useMemo(() => (rowData: Notification) => {
    return (
      <div className="flex align-items-center gap-2">
        <Tag 
          value={rowData.isRead ? "Read" : "Unread"} 
          severity={rowData.isRead ? "info" : "warning"} 
        />
      </div>
    );
  }, []);

  const actionsBodyTemplate = useMemo(() => (rowData: Notification) => {
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
  }, [handleMarkAsRead, handleDelete]);

  const dateBodyTemplate = useMemo(() => (rowData: Notification) => {
    return formatDate(rowData.createdAt);
  }, [formatDate]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      if (filters.type && notif.type !== filters.type) return false;
      if (filters.status && notif.isRead.toString() !== filters.status) return false;
      if (filters.search && !notif.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !notif.message.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [notifications, filters.type, filters.status, filters.search]);

  // Paginate the filtered notifications
  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [filteredNotifications, currentPage, rowsPerPage]);

  const typeOptions = useMemo(() => [
    { label: "All Types", value: "" },
    { label: "New Review", value: "NEW_REVIEW" },
    { label: "Review Approved", value: "REVIEW_APPROVED" },
    { label: "Review Rejected", value: "REVIEW_REJECTED" },
    { label: "Subscription Expiring", value: "SUBSCRIPTION_EXPIRING" },
    { label: "Subscription Cancelled", value: "SUBSCRIPTION_CANCELLED" },
    { label: "Escalation Received", value: "ESCALATION_RECEIVED" },
    { label: "Escalation Responded", value: "ESCALATION_RESPONDED" },
    { label: "System Alert", value: "SYSTEM_ALERT" },
    { label: "New Hotel Registration", value: "NEW_HOTEL_REGISTRATION" },
    { label: "New Form Created", value: "NEW_FORM_CREATED" },
    { label: "Payment Method Added", value: "PAYMENT_METHOD_ADDED" },
    { label: "Success", value: "SUCCESS" },
    { label: "Info", value: "INFO" },
    { label: "Warning", value: "WARNING" },
    { label: "Error", value: "ERROR" },
  ], []);

  const statusOptions = useMemo(() => [
    { label: "All Statuses", value: "" },
    { label: "Unread", value: "false" },
    { label: "Read", value: "true" },
  ], []);

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
              label="Generate Test Notifications"
              icon="pi pi-plus"
              onClick={generateTestNotifications}
              className="p-button-info"
            />
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
                onChange={(e) => updateFilters({ search: e.target.value })}
                placeholder="Search by title, message, or user..."
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="block text-900 font-medium mb-2">Type</label>
              <Dropdown
                value={filters.type}
                options={typeOptions}
                onChange={(e) => updateFilters({ type: e.value })}
                placeholder="All Types"
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
            <>
              <DataTable 
                value={paginatedNotifications}
                dataKey="id"
                emptyMessage="No notifications found"
                className="p-datatable-sm"
                scrollable
                scrollHeight="400px"
              >
                <Column field="title" header="Title" sortable style={{ minWidth: '200px' }} />
                <Column field="message" header="Message" style={{ minWidth: '300px', maxWidth: '300px' }} />
                <Column field="user" header="User" body={userBodyTemplate} style={{ minWidth: '150px' }} />
                <Column field="type" header="Type" body={typeBodyTemplate} sortable style={{ minWidth: '150px' }} />
                <Column field="isRead" header="Status" body={statusBodyTemplate} sortable style={{ minWidth: '120px' }} />
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
                totalRecords={filteredNotifications.length}
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

      <Toast ref={toast} />
    </div>
  );
}
