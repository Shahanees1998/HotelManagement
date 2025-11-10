"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card } from "primereact/card";
import { DataTable, DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Tag } from "primereact/tag";
import { Badge } from "primereact/badge";
import { Skeleton } from "primereact/skeleton";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/TranslationProvider";

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

export default function NotificationsPage() {
    const router = useRouter();
    const { t, locale } = useI18n();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [selectedType, setSelectedType] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");
    const [sortField, setSortField] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<string | undefined>(undefined);
    const [selectedNotifications, setSelectedNotifications] = useState<Notification[]>([]);
    const toast = useRef<Toast>(null);
    const typeOptions = useMemo(
        () => [
            { label: t("hotel.communications.notifications.filters.types.newReview"), value: "NEW_REVIEW" },
            { label: t("hotel.communications.notifications.filters.types.reviewApproved"), value: "REVIEW_APPROVED" },
            { label: t("hotel.communications.notifications.filters.types.reviewRejected"), value: "REVIEW_REJECTED" },
            { label: t("hotel.communications.notifications.filters.types.subscriptionExpiring"), value: "SUBSCRIPTION_EXPIRING" },
            { label: t("hotel.communications.notifications.filters.types.subscriptionCancelled"), value: "SUBSCRIPTION_CANCELLED" },
            { label: t("hotel.communications.notifications.filters.types.escalationReceived"), value: "ESCALATION_RECEIVED" },
            { label: t("hotel.communications.notifications.filters.types.escalationResponded"), value: "ESCALATION_RESPONDED" },
            { label: t("hotel.communications.notifications.filters.types.systemAlert"), value: "SYSTEM_ALERT" },
            { label: t("hotel.communications.notifications.filters.types.newHotelRegistration"), value: "NEW_HOTEL_REGISTRATION" },
            { label: t("hotel.communications.notifications.filters.types.newFormCreated"), value: "NEW_FORM_CREATED" },
            { label: t("hotel.communications.notifications.filters.types.success"), value: "SUCCESS" },
            { label: t("hotel.communications.notifications.filters.types.info"), value: "INFO" },
            { label: t("hotel.communications.notifications.filters.types.warning"), value: "WARNING" },
            { label: t("hotel.communications.notifications.filters.types.error"), value: "ERROR" },
        ],
        [t]
    );

    const statusOptions = useMemo(
        () => [
            { label: t("hotel.communications.notifications.filters.status.all"), value: "" },
            { label: t("hotel.communications.notifications.filters.status.unread"), value: "unread" },
            { label: t("hotel.communications.notifications.filters.status.read"), value: "read" },
        ],
        [t]
    );

    useEffect(() => {
        loadNotifications();
    }, [currentPage, rowsPerPage, globalFilterValue, selectedType, selectedStatus, sortField, sortOrder]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const response = await apiClient.getUserNotifications({
                page: currentPage,
                limit: rowsPerPage,
                type: selectedType,
                isRead: selectedStatus === "read" ? "true" : selectedStatus === "unread" ? "false" : undefined,
                search: globalFilterValue || undefined,
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setNotifications((response as any).data || []);
            setTotalRecords(response.pagination?.total || 0);
        } catch (error) {
            showToast("error", t("common.error"), t("hotel.communications.notifications.toasts.loadError"));
        } finally {
            setLoading(false);
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
        setCurrentPage(1);
    };

    const onTypeFilterChange = (e: any) => {
        setSelectedType(e.value);
        setCurrentPage(1);
    };

    const onStatusFilterChange = (e: any) => {
        setSelectedStatus(e.value);
        setCurrentPage(1);
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const response = await apiClient.markNotificationAsRead(notificationId);
            if (response.error) {
                throw new Error(response.error);
            }

            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
            showToast("success", t("common.success"), t("hotel.communications.notifications.toasts.markReadSuccess"));
        } catch (error) {
            showToast("error", t("common.error"), t("hotel.communications.notifications.toasts.markReadError"));
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await apiClient.markAllNotificationsAsRead();
            if (response.error) {
                throw new Error(response.error);
            }

            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            showToast("success", t("common.success"), t("hotel.communications.notifications.toasts.markAllReadSuccess"));
        } catch (error) {
            showToast("error", t("common.error"), t("hotel.communications.notifications.toasts.markAllReadError"));
        }
    };

    const onSortChange = (event: DataTableStateEvent) => {
        setSortField(event.sortField);
        setSortOrder(event.sortOrder === 1 ? 'asc' : event.sortOrder === -1 ? 'desc' : undefined);
        setCurrentPage(1);
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            const response = await apiClient.deleteNotification(notificationId);
            if (response.error) {
                throw new Error(response.error);
            }

            setNotifications(prev =>
                prev.filter(notification => notification.id !== notificationId)
            );
            setTotalRecords(prev => prev - 1);
            showToast("success", t("common.success"), t("hotel.communications.notifications.toasts.deleteSuccess"));
        } catch (error) {
            showToast("error", t("common.error"), t("hotel.communications.notifications.toasts.deleteError"));
        }
    };

    const confirmBulkDeleteNotifications = () => {
        if (selectedNotifications.length === 0) return;

        confirmDialog({
            message: t("hotel.communications.notifications.confirm.bulkDeleteMessage").replace("{count}", String(selectedNotifications.length)),
            header: t("hotel.communications.notifications.confirm.bulkDeleteHeader"),
            icon: 'pi pi-exclamation-triangle',
            accept: () => bulkDeleteNotifications(),
        });
    };

    const bulkDeleteNotifications = async () => {
        if (selectedNotifications.length === 0) return;

        try {
            const deletePromises = selectedNotifications.map(notification => apiClient.deleteNotification(notification.id));
            await Promise.all(deletePromises);

            // Remove deleted notifications from local state
            setNotifications(prev =>
                prev.filter(notification =>
                    !selectedNotifications.some(selected => selected.id === notification.id)
                )
            );

            setTotalRecords(prev => prev - selectedNotifications.length);
            setSelectedNotifications([]);
            showToast("success", t("common.success"), t("hotel.communications.notifications.toasts.bulkDeleteSuccess").replace("{count}", String(selectedNotifications.length)));
        } catch (error) {
            showToast("error", t("common.error"), t("hotel.communications.notifications.toasts.bulkDeleteError"));
        }
    };

    const confirmDelete = (notificationId: string) => {
        confirmDialog({
            message: t("hotel.communications.notifications.confirm.deleteMessage"),
            header: t("hotel.communications.notifications.confirm.deleteHeader"),
            icon: 'pi pi-exclamation-triangle',
            accept: () => deleteNotification(notificationId),
        });
    };

    const showToast = useCallback((severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const getTypeSeverity = (type: string) => {
        switch (type) {
            case 'NEW_REVIEW': return 'info';
            case 'REVIEW_APPROVED': return 'success';
            case 'REVIEW_REJECTED': return 'danger';
            case 'SUBSCRIPTION_EXPIRING': return 'warning';
            case 'SUBSCRIPTION_CANCELLED': return 'danger';
            case 'ESCALATION_RECEIVED': return 'warning';
            case 'ESCALATION_RESPONDED': return 'success';
            case 'SYSTEM_ALERT': return 'danger';
            case 'NEW_HOTEL_REGISTRATION': return 'info';
            case 'NEW_FORM_CREATED': return 'info';
            case 'SUCCESS': return 'success';
            case 'INFO': return 'info';
            case 'WARNING': return 'warning';
            case 'ERROR': return 'danger';
            default: return 'info';
        }
    };

    const getTypeLabel = useCallback(
        (type: string) => {
            const key = `hotel.communications.notifications.types.${type}`;
            const translated = t(key);
            return translated === key ? type : translated;
        },
        [t]
    );

    const formatDate = useCallback(
        (dateString: string) => {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

            if (diffInHours < 1) {
                return t("hotel.communications.notifications.dates.justNow");
            } else if (diffInHours < 24) {
                return t("hotel.communications.notifications.dates.hoursAgo").replace("{hours}", String(Math.floor(diffInHours)));
            } else if (diffInHours < 48) {
                return t("hotel.communications.notifications.dates.yesterday");
            } else {
                try {
                    return new Intl.DateTimeFormat(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }).format(date);
                } catch {
                    return date.toLocaleDateString();
                }
            }
        },
        [locale, t]
    );

    const actionBodyTemplate = (rowData: Notification) => {
        return (
            <div className="flex gap-2">
                {!rowData.isRead && (
                    <Button
                        icon="pi pi-check"
                        size="small"
                        text
                        severity="success"
                        onClick={() => markAsRead(rowData.id)}
                        tooltip={t("hotel.communications.notifications.tooltips.markAsRead")}
                    />
                )}
                {(rowData.relatedType === 'review' && rowData.relatedId) && (
                    <Button
                        icon="pi pi-eye"
                        size="small"
                        text
                        onClick={() => handleView(rowData)}
                        tooltip={t("hotel.communications.notifications.tooltips.view")}
                    />
                )}
                <Button
                    icon="pi pi-trash"
                    size="small"
                    text
                    severity="danger"
                    onClick={() => confirmDelete(rowData.id)}
                    tooltip={t("hotel.communications.notifications.tooltips.delete")}
                />
            </div>
        );
    };

    const handleView = (notification: Notification) => {
        // Open review detail in reviews page similar to NotificationCenter behavior
        if (notification.relatedType === 'review' && notification.relatedId) {
            router.push(`/hotel/reviews?reviewId=${notification.relatedId}`);
            return;
        }
    };

    const statusBodyTemplate = (rowData: Notification) => {
        return rowData.isRead ? (
            <Tag value={t("hotel.communications.notifications.table.status.read")} severity="success" />
        ) : (
            <Badge value={t("hotel.communications.notifications.table.status.new")} severity="danger" />
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

    const dateBodyTemplate = (rowData: Notification) => {
        return (
            <span className="text-sm text-600">
                {formatDate(rowData.createdAt)}
            </span>
        );
    };

    const messageBodyTemplate = (rowData: Notification) => {
        return (
            <div className="max-w-20rem">
                <div className="font-semibold mb-1">{rowData.title}</div>
                <div className="text-sm text-600 line-height-2">
                    {rowData.message.length > 100
                        ? `${rowData.message.substring(0, 100)}...`
                        : rowData.message
                    }
                </div>
            </div>
        );
    };

    const loadingTemplate = () => {
        return (
            <div className="flex align-items-center gap-3">
                <Skeleton shape="circle" size="2rem" />
                <div className="flex-1">
                    <Skeleton height="1rem" className="mb-2" />
                    <Skeleton height="0.75rem" width="60%" />
                </div>
            </div>
        );
    };

    return (
        <div className="grid">
            <div className="col-12">
                <div>
                    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold m-0">{t("hotel.communications.notifications.title")}</h1>
                            <p className="text-600 mt-2 mb-0">{t("hotel.communications.notifications.subtitle")}</p>
                        </div>
                        <div className="flex gap-2">
                            {selectedNotifications.length > 0 && (
                                <Button
                                    label={t("hotel.communications.notifications.buttons.deleteSelected").replace("{count}", String(selectedNotifications.length))}
                                    icon="pi pi-trash"
                                    onClick={confirmBulkDeleteNotifications}
                                    severity="danger"
                                    className="p-button-outlined"
                                />
                            )}
                            <Button
                                label={t("hotel.communications.notifications.buttons.markAllAsRead")}
                                icon="pi pi-check-double"
                                onClick={markAllAsRead}
                                severity="success"
                                disabled={notifications.every(n => n.isRead)}
                                className="p-button-outlined"
                            />
                            <Button
                                label={t("hotel.communications.notifications.buttons.refresh")}
                                icon="pi pi-refresh"
                                onClick={loadNotifications}
                                loading={loading}
                                className="p-button-outlined"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="col-12">
                        <Card title={t("hotel.communications.notifications.filters.title")} className="mb-4">
                            <div className="grid">
                                <div className="col-12 md:col-4">
                                    <label className="block text-900 font-medium mb-2">{t("hotel.communications.notifications.filters.searchLabel")}</label>
                                    <InputText
                                        value={globalFilterValue}
                                        onChange={onGlobalFilterChange}
                                        placeholder={t("hotel.communications.notifications.filters.searchPlaceholder")}
                                        className="w-full"
                                    />
                                </div>
                                <div className="col-12 md:col-4">
                                    <label className="block text-900 font-medium mb-2">{t("hotel.communications.notifications.filters.type")}</label>
                                    <Dropdown
                                        value={selectedType}
                                        options={typeOptions}
                                        onChange={onTypeFilterChange}
                                        placeholder={t("hotel.communications.notifications.filters.allTypes")}
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                                <div className="col-12 md:col-4">
                                    <label className="block text-900 font-medium mb-2">{t("hotel.communications.notifications.filters.status.label")}</label>
                                    <Dropdown
                                        value={selectedStatus}
                                        options={statusOptions}
                                        onChange={onStatusFilterChange}
                                        placeholder={t("hotel.communications.notifications.filters.status.all")}
                                        className="w-full"
                                        showClear
                                    />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Notifications Table */}
                    <DataTable
                        value={notifications}
                        loading={loading}
                        rows={rowsPerPage}
                        totalRecords={totalRecords}
                        lazy
                        first={(currentPage - 1) * rowsPerPage}
                        onPage={(e) => setCurrentPage((e.page || 0) + 1)}
                        sortField={sortField}
                        sortOrder={sortOrder as any}
                        onSort={onSortChange}
                        emptyMessage={loading ? t("hotel.communications.notifications.states.loading") : t("hotel.communications.notifications.states.empty")}
                        className="p-datatable-sm"
                        selectionMode="multiple"
                        selection={selectedNotifications}
                        onSelectionChange={(e) => setSelectedNotifications(e.value as Notification[])}
                    >
                        <Column
                            selectionMode="multiple"
                            headerStyle={{ width: '3rem' }}
                            style={{ width: '3rem' }}
                        />
                        <Column
                            field="type"
                            header={t("hotel.communications.notifications.table.type")}
                            body={typeBodyTemplate}
                            sortable
                            style={{ width: '120px' }}
                        />
                        <Column
                            field="message"
                            header={t("hotel.communications.notifications.table.message")}
                            body={messageBodyTemplate}
                            sortable={false}
                        />
                        <Column
                            field="isRead"
                            header={t("hotel.communications.notifications.table.status.label")}
                            body={statusBodyTemplate}
                            sortable
                            style={{ width: '100px' }}
                        />
                        <Column
                            field="createdAt"
                            header={t("hotel.communications.notifications.table.date")}
                            body={dateBodyTemplate}
                            sortable
                            style={{ width: '120px' }}
                        />
                        <Column
                            header={t("hotel.communications.notifications.table.actions")}
                            body={actionBodyTemplate}
                            style={{ width: '140px' }}
                        />
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

                    {/* Statistics */}
                    {/* <div className="grid mt-4">
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-blue-500">
                                    {notifications.filter(n => !n.isRead).length}
                                </div>
                                <div className="text-600">Unread</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-green-500">
                                    {notifications.filter(n => n.isRead).length}
                                </div>
                                <div className="text-600">Read</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-blue-500">
                                    {notifications.filter(n => n.type === 'ANNOUNCEMENT').length}
                                </div>
                                <div className="text-600">Announcements</div>
                            </Card>
                        </div>
                        <div className="col-12 md:col-3">
                            <Card className="text-center">
                                <div className="text-2xl font-bold text-orange-500">
                                    {notifications.filter(n => n.type === 'BROADCAST').length}
                                </div>
                                <div className="text-600">Broadcasts</div>
                            </Card>
                        </div>
                    </div> */}
                </div>
            </div>

            <Toast ref={toast} />
            <ConfirmDialog />
        </div>
    );
} 
