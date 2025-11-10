"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Avatar } from "primereact/avatar";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Toast } from "primereact/toast";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode, FilterOperator } from "primereact/api";
import { useRouter } from "next/navigation";
import { Skeleton } from "primereact/skeleton";
import { FileUpload } from "primereact/fileupload";
import { ProgressBar } from "primereact/progressbar";
import { apiClient } from "@/lib/apiClient";
import { CustomPaginator } from "@/components/CustomPaginator";
import { getProfileImageUrl } from "@/lib/cloudinary-client";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/i18n/TranslationProvider";

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    profileImage?: string;
    profileImagePublicId?: string;
    membershipNumber?: string;
    joinDate?: string | null;
    paidDate?: string | null;
    lastLogin?: string;
    createdAt: string;
}

interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    membershipNumber: string;
    joinDate: Date | null;
    paidDate: Date | null;
    password?: string;
}

interface CSVUserData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status?: string;
    membershipNumber?: string;
    joinDate?: string;
    paidDate?: string;
}

export default function MembersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRecords, setTotalRecords] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        firstName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        lastName: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
        email: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
    });
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userForm, setUserForm] = useState<UserFormData>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        status: "ACTIVE",
        membershipNumber: "",
        joinDate: null,
        paidDate: null,
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
    const [bulkUploadStatus, setBulkUploadStatus] = useState<string>("");
    const [csvData, setCsvData] = useState<CSVUserData[]>([]);
    const [csvErrors, setCsvErrors] = useState<string[]>([]);
    const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const [error, setError] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const [sortField, setSortField] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<number | undefined>(undefined);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const { t } = useI18n();

    // Use debounce hook for search
    const debouncedFilterValue = useDebounce(globalFilterValue, 500);

    const statusOptions = useMemo(() => [
        { label: t("Active"), value: "ACTIVE" },
        { label: t("Pending"), value: "PENDING" },
        { label: t("Inactive"), value: "INACTIVE" },
        { label: t("Deactivated"), value: "DEACTIVATED" },
    ], [t]);

    useEffect(() => {
        loadMembers();
    }, [currentPage, rowsPerPage, debouncedFilterValue]);

    const loadMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.getHotelUsers({
                page: currentPage,
                limit: rowsPerPage,
                search: debouncedFilterValue,
                sortField,
                sortOrder: sortOrder?.toString(),
            });

            if (response.error) {
                throw new Error(response.error);
            }

            setUsers((response as any).data || []);
            setTotalRecords(response.pagination?.total || 0);
        } catch (error) {
            const loadErrorMessage = t("Failed to load members. Please check your connection or try again later.");
            setError(loadErrorMessage);
            showToast("error", t("Error"), t("Failed to load members"));
        } finally {
            setLoading(false);
        }
    };

    const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        let _filters = { ...filters };
        (_filters["global"] as any).value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const showToast = (severity: "success" | "error" | "warn" | "info", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const openNewMemberDialog = async () => {
        setEditingUser(null);

        setUserForm({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            status: "ACTIVE",
            membershipNumber: "",
            joinDate: null,
            paidDate: null,
            password: "",
        });
        setShowPassword(false);
        setShowUserDialog(true);
    };

    const openEditUserDialog = (user: User) => {
        setEditingUser(user);
        setUserForm({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone || "",
            status: user.status,
            membershipNumber: user.membershipNumber || "",
            joinDate: user.joinDate ? new Date(user.joinDate) : null,
            paidDate: user.paidDate ? new Date(user.paidDate) : null,
        });
        setShowPassword(false);
        setShowUserDialog(true);
    };

    const saveUser = async () => {
        setSaveLoading(true);
        try {
            const userData: any = {
                ...userForm,
                joinDate: userForm.joinDate?.toISOString(),
                paidDate: userForm.paidDate?.toISOString(),
            };
            if (!editingUser && !userForm.password) {
                delete userData.password;
            }
            if (!userForm.membershipNumber) {
                delete userData.membershipNumber;
            }
            let response: any;
            if (editingUser) {
                // Update existing user
                response = await apiClient.updateUser(editingUser.id, userData);
            } else {
                // Create new user
                response = await apiClient.createUser(userData);
            }

            if (response.error) {
                throw new Error(response.error);
            }

            if (editingUser) {
                const updatedUsers = users.map(user =>
                    user.id === editingUser.id ? response.data : user
                );
                setUsers(updatedUsers);
                showToast("success", t("Success"), t("Member updated successfully"));
            } else {
                setUsers([response.data, ...users]);
                showToast("success", t("Success"), t("Member created successfully"));
            }

            setShowUserDialog(false);
        } catch (error) {
            const detail = error instanceof Error ? error.message : t("Failed to save member");
            showToast("error", t("Error"), detail);
        } finally {
            setSaveLoading(false);
        }
    };

    const confirmDeleteUser = (user: User) => {
        confirmDialog({
            message: t("Are you sure you want to delete {name}?").replace("{name}", `${user.firstName} ${user.lastName}`),
            header: t("Delete confirmation"),
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => deleteUser(user.id),
        });
    };

    const confirmBulkDeleteUsers = () => {
        if (selectedUsers.length === 0) return;

        confirmDialog({
            message: t("Are you sure you want to delete {count} selected user(s)?").replace("{count}", selectedUsers.length.toString()),
            header: t("Bulk delete confirmation"),
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            accept: () => bulkDeleteUsers(),
        });
    };

    const bulkDeleteUsers = async () => {
        if (selectedUsers.length === 0) return;

        try {
            const deletePromises = selectedUsers.map(user => apiClient.deleteUser(user.id));
            await Promise.all(deletePromises);

            setSelectedUsers([]);
            const successMessage = t("{count} user(s) deleted successfully").replace("{count}", selectedUsers.length.toString());
            showToast("success", t("Success"), successMessage);
            loadMembers(); // Reload the list
        } catch (error) {
            showToast("error", t("Error"), t("Failed to delete some users"));
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const response = await apiClient.deleteUser(userId);

            if (response.error) {
                throw new Error(response.error);
            }

            setUsers(users.filter(user => user.id !== userId));
            showToast("success", t("Success"), t("Member deleted successfully"));
        } catch (error) {
            showToast("error", t("Error"), t("Failed to delete member"));
        }
    };

    const getStatusSeverity = (status: string) => {
        switch (status) {
            case "ACTIVE": return "success";
            case "PENDING": return "warning";
            case "INACTIVE": return "danger";
            case "DEACTIVATED": return "danger";
            default: return "info";
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return t("Active");
            case "PENDING":
                return t("Pending");
            case "INACTIVE":
                return t("Inactive");
            case "DEACTIVATED":
                return t("Deactivated");
            default:
                return status;
        }
    };

    // CSV Upload Functions
    const parseCSV = (csvText: string): CSVUserData[] => {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data: CSVUserData[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());
            if (values.length !== headers.length) {
                errors.push(t("Row {row}: Column count mismatch").replace("{row}", (i + 1).toString()));
                continue;
            }

            const row: any = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            // Validate required fields
            if (!row.firstname || !row.lastname || !row.email) {
                errors.push(t("Row {row}: Missing required fields (firstName, lastName, email)").replace("{row}", (i + 1).toString()));
                continue;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(row.email)) {
                errors.push(t("Row {row}: Invalid email format").replace("{row}", (i + 1).toString()));
                continue;
            }

            data.push({
                firstName: row.firstname,
                lastName: row.lastname,
                email: row.email,
                phone: row.phone || undefined,
                status: row.status || "PENDING",
                membershipNumber: row.membershipnumber || undefined,
                joinDate: row.joindate || undefined,
                paidDate: row.paiddate || undefined,
            });
        }

        setCsvErrors(errors);
        return data;
    };

    const handleCSVUpload = (event: any) => {
        const file = event.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target?.result as string;
            const parsedData = parseCSV(csvText);
            setCsvData(parsedData);
        };
        reader.readAsText(file);
    };

    const downloadCSVTemplate = () => {
        const template = `firstname,lastname,email,phone,status,membershipnumber,joindate,paiddate
John,Doe,john.doe@example.com,+1234567890,PENDING,primo1234,2024-01-15,2024-01-15
Jane,Smith,jane.smith@example.com,+1234567891,ACTIVE,primo1235,2024-01-16,2024-01-16`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'member_upload_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const processBulkUpload = async () => {
        if (csvData.length === 0) {
            showToast("error", t("Error"), t("No valid data to upload"));
            return;
        }

        setBulkUploadLoading(true);
        setBulkUploadProgress(0);
        setBulkUploadStatus(t("Starting bulk upload..."));

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < csvData.length; i++) {
            const userData = csvData[i];
            setBulkUploadStatus(
                t("Processing {name} ({index}/{total})")
                    .replace("{name}", `${userData.firstName} ${userData.lastName}`)
                    .replace("{index}", (i + 1).toString())
                    .replace("{total}", csvData.length.toString())
            );

            try {
                const response = await apiClient.createUser({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    phone: userData.phone,
                    status: userData.status,
                    membershipNumber: userData.membershipNumber,
                    joinDate: userData.joinDate,
                    paidDate: userData.paidDate,
                });

                if (response.error) {
                    errorCount++;
                    errors.push(`${userData.email}: ${response.error}`);
                } else {
                    successCount++;
                }
            } catch (error) {
                errorCount++;
                errors.push(`${userData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            setBulkUploadProgress(((i + 1) / csvData.length) * 100);
        }

        setBulkUploadStatus(
            t("Upload completed. {success} successful, {failed} failed.")
                .replace("{success}", successCount.toString())
                .replace("{failed}", errorCount.toString())
        );

        if (successCount > 0) {
            showToast("success", t("Bulk upload complete"), t("{count} members added successfully").replace("{count}", successCount.toString()));
            loadMembers(); // Refresh the list
        }

        if (errorCount > 0) {
        const warnMessage = t("{count} members failed to upload. Check the console for details.").replace("{count}", errorCount.toString());
        showToast("warn", t("Bulk upload issues"), warnMessage);
            console.error("Bulk upload errors:", errors);
        }

        // Reset after 3 seconds
        setTimeout(() => {
            setShowBulkUploadDialog(false);
            setCsvData([]);
            setCsvErrors([]);
            setBulkUploadProgress(0);
            setBulkUploadStatus("");
            setBulkUploadLoading(false);
        }, 3000);
    };

    const nameBodyTemplate = (rowData: User) => {
        return (
            <div className="flex align-items-center gap-2">
                <Avatar
                    image={rowData.profileImagePublicId ?
                        getProfileImageUrl(rowData.profileImagePublicId, 'small') :
                        rowData.profileImage
                    }
                    icon={!rowData.profileImage && !rowData.profileImagePublicId ? "pi pi-user" : undefined}
                    size="normal"
                    shape="circle"
                />
                <div>
                    <div className="font-semibold">{`${rowData.firstName} ${rowData.lastName}`}</div>
                    <div className="text-sm text-600">{rowData.membershipNumber}</div>
                </div>
            </div>
        );
    };

    const actionBodyTemplate = (rowData: User) => {
        return (
            <div className="flex gap-2">
                {/* <Button
                    icon="pi pi-eye"
                    size="small"
                    text
                    tooltip="View Details"
                    onClick={() => router.push(`/admin/users/${rowData.id}`)}
                /> */}
                {rowData.role !== "ADMIN" && <Button
                    icon="pi pi-pencil"
                    size="small"
                    text
                    severity="secondary"
                    tooltip={t("Edit Member")}
                    onClick={() => openEditUserDialog(rowData)}
                />}
                {rowData.role !== "ADMIN" && <Button
                    icon="pi pi-trash"
                    size="small"
                    text
                    severity="danger"
                    tooltip={t("Delete Member")}
                        onClick={() => confirmDeleteUser(rowData)}
                    />}
                </div>
            );
        };

    const header = (
        <>
            <div className="w-full flex justify-content-end">
                {selectedUsers.length > 0 && (
                    <Button
                        label={t("Delete Selected ({count})").replace("{count}", selectedUsers.length.toString())}
                        icon="pi pi-trash"
                        onClick={confirmBulkDeleteUsers}
                        severity="danger"
                        className="p-button-raised mb-4"
                    />
                )}
            </div>
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">

                <div className="flex flex-column">
                    <h2 className="text-2xl font-bold m-0">{t("Member Management")}</h2>
                    <span className="text-600">{t("Manage all registered members")}</span>
                </div>
                <div className="flex gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder={t("Search members...")}
                        className="w-full"
                    />
                </span>

                <Button
                    label={t("Bulk Upload")}
                    icon="pi pi-upload"
                    onClick={() => setShowBulkUploadDialog(true)}
                    severity="info"
                />
                <Button
                    label={t("Add Member")}
                    icon="pi pi-plus"
                    onClick={openNewMemberDialog}
                    severity="success"
                />
            </div>
        </div>
    </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                    {error && (
                        <div className="p-error p-3 mb-3">{error}</div>
                    )}
                    <>
                        {loading ? (
                            <>
                            <DataTable
                                value={Array.from({ length: 5 }, (_, i) => ({ id: i }))}
                                className="p-datatable-sm"
                                header={header}
                            >
                                <Column
                                    selectionMode="multiple"
                                    headerStyle={{ width: '3rem' }}
                                    style={{ width: '3rem' }}
                                />
                                <Column
                                    field="firstName"
                                    header={t("Name")}
                                    body={() => (
                                        <div className="flex align-items-center gap-2">
                                            <Skeleton shape="circle" size="2rem" />
                                            <div className="flex flex-column gap-1">
                                                <Skeleton width="120px" height="16px" />
                                                <Skeleton width="100px" height="14px" />
                                            </div>
                                        </div>
                                    )}
                                    style={{ minWidth: "200px" }}
                                />
                                <Column
                                    field="email"
                                    header={t("Email")}
                                    body={() => <Skeleton width="200px" height="16px" />}
                                    style={{ minWidth: "200px" }}
                                />
                                <Column
                                    field="phone"
                                    header={t("Phone")}
                                    body={() => <Skeleton width="120px" height="16px" />}
                                    style={{ minWidth: "150px" }}
                                />
                                <Column
                                    field="paidDate"
                                    header={t("Paid Date")}
                                    body={() => <Skeleton width="100px" height="16px" />}
                                    style={{ minWidth: "120px" }}
                                />
                                <Column
                                    field="role"
                                    header={t("Role")}
                                    body={() => <Skeleton width="80px" height="24px" />}
                                    style={{ minWidth: "100px" }}
                                />
                                <Column
                                    header={t("Actions")}
                                    body={() => (
                                        <div className="flex gap-2">
                                            <Skeleton width="32px" height="32px" />
                                            <Skeleton width="32px" height="32px" />
                                            <Skeleton width="32px" height="32px" />
                                        </div>
                                    )}
                                    style={{ width: "120px" }}
                                />              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={users.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
                        ) : (
            <>
              <DataTable
                                value={users}
                                rows={rowsPerPage}
                                totalRecords={totalRecords}
                                lazy
                                first={(currentPage - 1) * rowsPerPage}
                                onPage={(e) => {
                                    setCurrentPage((e.page || 0) + 1);
                                    setRowsPerPage(e.rows || 10);
                                }}
                                loading={loading}
                                filters={filters}
                                filterDisplay="menu"
                                globalFilterFields={["firstName", "lastName", "email", "membershipNumber"]}
                                header={header}
                                emptyMessage={error ? t("Unable to load members. Please check your connection or try again later.") : t("No members found.")}
                                responsiveLayout="scroll"
                                onSort={(e) => {
                                    setSortField(e.sortField);
                                    setSortOrder((e.sortOrder as 1 | 0 | -1 | undefined));
                                }}
                                sortField={sortField}
                                sortOrder={sortOrder as 1 | 0 | -1 | undefined}
                                selectionMode="multiple"
                                selection={selectedUsers}
                                onSelectionChange={(e) => setSelectedUsers(e.value as User[])}
                            >
                                <Column
                                    selectionMode="multiple"
                                    headerStyle={{ width: '3rem' }}
                                    style={{ width: '3rem' }}
                                />
                                <Column field="firstName" header={t("Name")} body={nameBodyTemplate} style={{ minWidth: "200px" }} />
                                <Column field="email" header={t("Email")} style={{ minWidth: "200px" }} />
                                <Column field="phone" header={t("Phone")} style={{ minWidth: "150px" }} />
                                <Column field="paidDate" header={t("Paid Date")} body={(rowData) => (
                                    rowData.paidDate ? new Date(rowData.paidDate).toLocaleDateString() : t("Not paid")
                                )} style={{ minWidth: "120px" }} />
                                <Column field="status" header={t("Status")} body={(rowData) => (
                                    <div className="flex align-items-center gap-2">
                                        <Tag value={getStatusLabel(rowData.status)} severity={getStatusSeverity(rowData.status)} />
                                        {rowData.isDeleted && <Tag value={t("Deleted")} severity="danger" />}
                                    </div>
                                )} style={{ minWidth: "150px" }} />
                                {/* <Column field="joinDate" header="Join Date" body={(rowData) => (
                                new Date(rowData.joinDate || "").toLocaleDateString()
                            )} style={{ minWidth: "120px" }} /> */}
                                <Column body={actionBodyTemplate} style={{ width: "150px" }} />              </DataTable>
              <CustomPaginator
                currentPage={currentPage}
                totalRecords={users.length}
                rowsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                onRowsPerPageChange={(rows) => {
                  setRowsPerPage(rows);
                  setCurrentPage(1);
                }}
              />
            </>
                        )}
                    </>
            </div>

            {/* User Dialog always rendered */}
            <Dialog
                visible={showUserDialog}
                style={{ width: "820px", maxWidth: "95vw", zIndex: 2000, borderRadius: 12 }}
                header={editingUser ? t("Edit Member") : t("Add New Member")}
                modal
                className=""
                onHide={() => setShowUserDialog(false)}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button label={t("Cancel")} icon="pi pi-times" text onClick={() => setShowUserDialog(false)} disabled={saveLoading} />
                        <Button
                            label={saveLoading ? t("Saving...") : t("Save")}
                            icon={saveLoading ? "pi pi-spin pi-spinner" : "pi pi-check"}
                            onClick={saveUser}
                            disabled={saveLoading}
                        />
                    </div>
                }
            >
                <div className="grid">
                    <div className="col-12 md:col-6">
                        <label htmlFor="firstName" className="block font-bold mb-2">{t("First Name *")}</label>
                        <InputText
                            id="firstName"
                            value={userForm.firstName}
                            onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                            placeholder={t("Enter first name")}
                            required
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <label htmlFor="lastName" className="block font-bold mb-2">{t("Last Name *")}</label>
                        <InputText
                            id="lastName"
                            value={userForm.lastName}
                            onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                            placeholder={t("Enter last name")}
                            required
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <label htmlFor="email" className="block font-bold mb-2">{t("Email *")}</label>
                        <InputText
                            id="email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                            placeholder={t("Enter email address")}
                            required
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <label htmlFor="phone" className="block font-bold mb-2">{t("Phone")}</label>
                        <InputText
                            id="phone"
                            value={userForm.phone}
                            onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                            placeholder={t("Enter phone number")}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <label htmlFor="membershipNumber" className="block font-bold mb-2">{t("Member ID")}</label>
                        <InputText
                            id="membershipNumber"
                            value={userForm.membershipNumber}
                            onChange={(e) => setUserForm({ ...userForm, membershipNumber: e.target.value })}
                            placeholder={t("Enter member ID (leave blank for auto-generation)")}
                            className="w-full"
                        />
                    </div>
                    <div className="col-12 md:col-6">
                        <label htmlFor="status" className="block font-bold mb-2">{t("Status *")}</label>
                        <Dropdown
                            id="status"
                            value={userForm.status}
                            options={statusOptions}
                            onChange={(e) => setUserForm({ ...userForm, status: e.value })}
                            placeholder={t("Select member status")}
                            className="w-full"
                            style={{ minWidth: 0 }}
                        />
                    </div>

                    <div className="col-12 md:col-6">
                        <label htmlFor="joinDate" className="block font-bold mb-2">{t("Join Date")}</label>
                        <Calendar
                            id="joinDate"
                            value={userForm.joinDate}
                            onChange={(e) => setUserForm({ ...userForm, joinDate: e.value as Date })}
                            showIcon
                            dateFormat="dd/mm/yy"
                            placeholder={t("Select join date")}
                            className="w-full"
                            style={{ minWidth: 0 }}
                        />
                    </div>
                    {editingUser && (
                        <div className="col-12 md:col-6">
                            <label htmlFor="paidDate" className="block font-bold mb-2">{t("Paid Date")}</label>
                            <Calendar
                                id="paidDate"
                                value={userForm.paidDate}
                                onChange={(e) => setUserForm({ ...userForm, paidDate: e.value as Date })}
                                showIcon
                                dateFormat="dd/mm/yy"
                                placeholder={t("Select paid date")}
                                className="w-full"
                                style={{ minWidth: 0 }}
                            />
                        </div>
                    )}
                    {!editingUser && (
                        <div className="col-12">
                            <label htmlFor="password" className="font-bold">{t("Password")}</label>
                            <div className="p-input-icon-right w-full">
                                <InputText
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={userForm.password}
                                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                    placeholder={t("Set password (leave blank for default)")}
                                    className="w-full"
                                />
                                <i
                                    className={`pi ${showPassword ? 'pi-eye-slash' : 'pi-eye'} cursor-pointer`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </Dialog>

            {/* Bulk Upload Dialog */}
            <Dialog
                visible={showBulkUploadDialog}
                style={{ width: "600px", maxWidth: "95vw", zIndex: 2000, borderRadius: 12 }}
                header={t("Bulk Upload Members")}
                modal
                className=""
                onHide={() => setShowBulkUploadDialog(false)}
                footer={
                    <div className="flex gap-2 justify-content-end">
                        <Button
                            label={t("Download Template")}
                            icon="pi pi-download"
                            text
                            onClick={downloadCSVTemplate}
                        />
                        <Button
                            label={t("Cancel")}
                            icon="pi pi-times"
                            text
                            onClick={() => setShowBulkUploadDialog(false)}
                        />
                        <Button
                            label={bulkUploadLoading ? t("Uploading...") : t("Upload Members")}
                            icon={bulkUploadLoading ? "pi pi-spin pi-spinner" : "pi pi-upload"}
                            onClick={processBulkUpload}
                            disabled={csvData.length === 0 || csvErrors.length > 0 || bulkUploadLoading}
                        />
                    </div>
                }
            >
                <div className="flex flex-column gap-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">{t("Upload CSV File")}</h3>
                        <p className="text-600 mb-3">
                            {t("Upload a CSV file with member data. The file should include the following columns: firstname, lastname, email, phone (optional), status (optional), membershipnumber (optional), joindate (optional), paiddate (optional)")}
                        </p>
                        <FileUpload
                            mode="basic"
                            name="csv"
                            accept=".csv"
                            maxFileSize={1000000}
                            customUpload
                            uploadHandler={handleCSVUpload}
                            auto
                            chooseLabel={t("Choose CSV File")}
                        />
                    </div>

                    {csvData.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">{t("Preview ({count} members)").replace("{count}", csvData.length.toString())}</h4>
                            <div className="max-h-40 overflow-y-auto border-1 border-round p-3">
                                {csvData.slice(0, 5).map((user, index) => (
                                    <div key={index} className="text-sm mb-1">
                                        {user.firstName} {user.lastName} - {user.email}
                                    </div>
                                ))}
                                {csvData.length > 5 && (
                                    <div className="text-sm text-600">{t("... and {count} more").replace("{count}", (csvData.length - 5).toString())}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {csvErrors.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-600 mb-2">{t("Validation Errors ({count})").replace("{count}", csvErrors.length.toString())}</h4>
                            <div className="max-h-32 overflow-y-auto border-1 border-round p-3 bg-red-50">
                                {csvErrors.map((error, index) => (
                                    <div key={index} className="text-sm text-red-600 mb-1">{error}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bulkUploadStatus && (
                        <div>
                            <h4 className="font-semibold mb-2">{t("Upload Progress")}</h4>
                            <ProgressBar value={bulkUploadProgress} />
                            <p className="text-sm mt-2">{bulkUploadStatus}</p>
                        </div>
                    )}
                </div>
            </Dialog>

            <Toast ref={toast} />
            <ConfirmDialog />
        </div>
    );
} 
