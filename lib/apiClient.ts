
interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | null>;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = '/api') {
        this.baseURL = baseURL;
    }

    // Global error handler for showing toast messages
    private handleError(error: string, showToast: boolean = true) {
        if (showToast && typeof window !== 'undefined') {
            // Dispatch a custom event for global error handling
            const event = new CustomEvent('api-error', {
                detail: {
                    error,
                    type: error.includes('Session expired') ? 'auth' : 'general'
                }
            });
            window.dispatchEvent(event);
        }
        return { error };
    }

    private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const {
            method = 'GET',
            body,
            headers = {},
            params
        } = options;

        try {
            // Build URL with query parameters
            let url = `${this.baseURL}${endpoint}`;
            if (params) {
                const searchParams = new URLSearchParams();
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        searchParams.append(key, String(value));
                    }
                });
                const queryString = searchParams.toString();
                if (queryString) {
                    url += `?${queryString}`;
                }
            }
            // Prepare request configuration
            const config: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
            };

            // Add body for non-GET requests
            if (body && method !== 'GET') {
                config.body = JSON.stringify(body);
            }

            // Make the request
            const response = await fetch(url, config);

            // Handle different response statuses
            if (!response.ok) {
                // Handle authentication errors (401)
                if (response.status === 401) {
                    // Clear any existing auth state
                    try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                    } catch (e) {
                        // Ignore logout errors
                    }
                    
                    // Redirect to login page
                    if (typeof window !== 'undefined') {
                        const currentPath = window.location.pathname;
                        const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(currentPath)}`;
                        window.location.href = loginUrl;
                    }
                    
                    return this.handleError('Session expired. Please log in again.', true);
                }
                
                let errorMessage = 'An error occurred';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                return this.handleError(errorMessage, true);
            }

            // Parse successful response
            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API request failed:', error);
            return this.handleError(
                error instanceof Error ? error.message : 'Network error occurred',
                true
            );
        }
    }

    // Generic methods
    async get<T>(endpoint: string, params?: Record<string, string | number | boolean | null>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, body: any, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'POST', body, params });
    }

    async put<T>(endpoint: string, body: any, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'PUT', body, params });
    }

    async delete<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'DELETE', params });
    }

    async patch<T>(endpoint: string, body: any, params?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
        return this.request<T>(endpoint, { method: 'PATCH', body, params });
    }

    // User-specific methods
    async getUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        sortField?: string;
        sortOrder?: number;
    }) {
        return this.get<{
            users: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/admin/users', params);
    }

    async getUser(id: string) {
        return this.get(`/admin/users/${id}`);
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async createUser(userData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        status?: string;
        membershipNumber?: string;
        joinDate?: string;
        paidDate?: string;
        password?: string;
    }) {
        return this.post<any>('/admin/users', userData);
    }

    async updateUser(id: string, userData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        status?: string;
        membershipNumber?: string;
        joinDate?: string;
        paidDate?: string;
    }) {
        return this.put<any>(`/admin/users/${id}`, userData);
    }

    async deleteUser(id: string) {
        return this.delete(`/admin/users/${id}`);
    }


    // Auth methods
    async login(credentials: { email: string; password: string }) {
        return this.post('/auth/login', credentials);
    }

    async forgotPassword(email: string) {
        return this.post('/auth/forgot-password', { email });
    }

    async resetPassword(token: string, password: string) {
        return this.post('/auth/reset-password', { token, password });
    }

    async changePassword(currentPassword: string, newPassword: string) {
        return this.put('/users/change-password', { currentPassword, newPassword });
    }

    async editProfile(profileData: {
        firstName: string;
        lastName: string;
        phone?: string;
        profileImage?: string;
        profileImagePublicId?: string;
        isPasswordChanged?: boolean;
    }) {
        return this.put<any>('/users/edit-profile', profileData);
    }



    async uploadProfileImage(formData: FormData): Promise<ApiResponse<any>> {
        // For FormData, we need to override the default headers
        const url = `${this.baseURL}/users/profile-image`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header - let the browser set it for FormData
            });

            if (!response.ok) {
                let errorMessage = 'An error occurred';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                return this.handleError(errorMessage, true);
            }

            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('Profile image upload request failed:', error);
            return this.handleError(
                error instanceof Error ? error.message : 'Network error occurred',
                true
            );
        }
    }


    // Support methods
    async getSupportRequests(params?: {
        page?: number;
        limit?: number;
        status?: string;
        priority?: string;
    }) {
        return this.get<{
            supportRequests: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/admin/support', params);
    }

    async getSupportRequest(id: string) {
        return this.get<any>(`/admin/support/${id}`);
    }

    async createSupportRequest(requestData: {
        userId: string;
        subject: string;
        message: string;
        priority?: string;
    }) {
        return this.post<any>('/admin/support', requestData);
    }

    async updateSupportRequest(id: string, requestData: any) {
        return this.put<any>(`/admin/support/${id}`, requestData);
    }

    async deleteSupportRequest(id: string) {
        return this.delete(`/admin/support/${id}`);
    }



    // Announcement methods
    async getAnnouncements(params?: {
        page?: number;
        limit?: number;
        search?: string;
        type?: string;
        status?: string;
        sortField?: string;
        sortOrder?: number;
    }) {
        // Filter out empty strings, null values, and undefined values
        const filteredParams: Record<string, string | number> = {};
        
        if (params?.page) filteredParams.page = params.page;
        if (params?.limit) filteredParams.limit = params.limit;
        if (params?.search && params.search.trim()) filteredParams.search = params.search.trim();
        if (params?.type && params.type.trim()) filteredParams.type = params.type.trim();
        if (params?.status && params.status.trim()) filteredParams.status = params.status.trim();
        if (params?.sortField && params.sortField.trim()) filteredParams.sortField = params.sortField.trim();
        if (params?.sortOrder !== undefined) filteredParams.sortOrder = params.sortOrder;
        return this.get<{
            announcements: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/admin/announcements', filteredParams);
    }

    async createAnnouncement(data: {
        title: string;
        content: string;
        type: 'GENERAL' | 'IMPORTANT' | 'URGENT' | 'UPDATE';
    }) {
        return this.post<any>('/admin/announcements', data);
    }

    async updateAnnouncement(id: string, data: {
        title?: string;
        content?: string;
        type?: 'GENERAL' | 'IMPORTANT' | 'URGENT' | 'UPDATE';
    }) {
        return this.put<any>(`/admin/announcements/${id}`, data);
    }

    async deleteAnnouncement(id: string) {
        return this.delete(`/admin/announcements/${id}`);
    }


    // Hotel Dashboard
    async getHotelDashboard() {
        return this.get<any>('/hotel/dashboard');
    }

    // Hotel Forms
    async getHotelForms(params?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortField?: string;
        sortOrder?: string;
    }) {
        return this.get<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/hotel/forms', params);
    }

    async createHotelForm(formData: any) {
        return this.post<any>('/hotel/forms', formData);
    }

    async updateHotelForm(formId: string, formData: any) {
        return this.put<any>(`/hotel/forms/${formId}`, formData);
    }

    async deleteHotelForm(formId: string) {
        return this.delete<any>(`/hotel/forms/${formId}`);
    }

    // Hotel Reviews
    async getHotelReviews(params?: {
        status?: string;
        rating?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortField?: string;
        sortOrder?: string;
    }) {
        return this.get<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/hotel/reviews', params);
    }

    // Hotel Users
    async getHotelUsers(params?: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        sortField?: string;
        sortOrder?: string;
    }) {
        return this.get<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/hotel/users', params);
    }

    // Hotel Support
    async getHotelSupportRequests(params?: {
        status?: string;
        priority?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortField?: string;
        sortOrder?: string;
    }) {
        return this.get<{
            data: any[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/hotel/support', params);
    }

    // User Notifications
    async getUserNotifications(params?: {
        isRead?: string;
        type?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<{
            data: any[];
            unreadCount: number;
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/notifications', params);
    }
    // System Settings/Integrations
    async getSystemSettings() {
        return this.get<any>('/admin/settings');
    }

    async updateSystemSettings(data: Record<string, any>) {
        return this.put<any>('/admin/settings', data);
    }

    // Admin Analytics
    async getAdminAnalytics(timeRange?: string, metric?: string) {
        return this.get<any>(`/admin/analytics?timeRange=${timeRange || '30'}&metric=${metric || 'overview'}`);
    }

    async getHotelPerformanceAnalytics() {
        return this.get<any>('/admin/analytics/hotels');
    }

    async getRevenueAnalytics(timeRange?: string, chartType?: string) {
        return this.get<any>(`/admin/analytics/revenue?timeRange=${timeRange || '30'}&chartType=${chartType || 'revenue'}`);
    }

    // Admin Hotels
    async getAdminHotels(params?: {
        status?: string;
        subscription?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<any>('/admin/hotels', params);
    }

    async updateHotelStatus(id: string, data: { isActive: boolean }) {
        return this.put<any>(`/admin/hotels/${id}/status`, data);
    }

    async updateHotel(id: string, data: any) {
        return this.put<any>(`/admin/hotels/${id}`, data);
    }

    async getHotelRegistrations() {
        return this.get<any>('/admin/hotels/registrations');
    }

    async approveHotelRegistration(id: string) {
        return this.put<any>(`/admin/hotels/registrations/${id}/approve`, {});
    }

    async rejectHotelRegistration(id: string, reason: string) {
        return this.put<any>(`/admin/hotels/registrations/${id}/reject`, { reason });
    }

    async getAdminSubscriptions(params?: {
        status?: string;
        plan?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<any>('/admin/subscriptions', params);
    }

    // Admin Forms
    async getAdminForms(params?: {
        hotel?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<any>('/admin/forms', params);
    }

    async getAdminReviews(params?: {
        status?: string;
        rating?: string;
        hotel?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        return this.get<any>('/admin/reviews', params);
    }

    async getAdminTemplates() {
        return this.get<any>('/admin/templates');
    }

    async createTemplate(data: { name: string; description: string; category: string }) {
        return this.post<any>('/admin/templates', data);
    }

    // Admin Support & Escalations
    async getAdminSupportRequests() {
        return this.get<any>('/admin/support');
    }

    async getAdminEscalations() {
        return this.get<any>('/admin/escalations');
    }

    async respondToEscalation(id: string, response: string) {
        return this.put<any>(`/admin/escalations/${id}/respond`, { response });
    }

    // Dashboard methods
    async getDashboard() {
        return this.get<{
            stats: {
                totalHotels: number;
                totalSubscribedHotels: number;
                totalReviews: number;
                totalEarnings: number;
                pendingApprovals: number;
                supportRequests: number;
            };
            recentActivity: Array<{
                id: string;
                type: string;
                description: string;
                timestamp: string;
                user: string;
                status?: string;
                startDate?: string;
            }>;
            growthData: {
                labels: string[];
                newHotels: number[];
                newReviews: number[];
                earnings: number[];
            };
        }>('/admin/dashboard');
    }

    // Notification methods
    async getNotifications(params?: {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
    }) {
        return this.get<{
            notifications: Array<{
                id: string;
                title: string;
                message: string;
                type: string;
                isRead: boolean;
                relatedId?: string;
                relatedType?: string;
                metadata?: any;
                createdAt: string;
            }>;
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
            };
        }>('/admin/notifications', params);
    }

    async markNotificationAsRead(notificationId: string) {
        return this.put(`/notifications/${notificationId}/read`, {});
    }

    async markAllNotificationsAsRead() {
        return this.put('/notifications/mark-all-read', {});
    }

    async deleteNotification(notificationId: string) {
        return this.delete(`/notifications/${notificationId}`);
    }

    // Membership Card methods
    async generateMembershipCard(data: {
        userId: string;
        organizationName: string;
        cardNumber: string;
        issueDate: string;
        expiryDate: string;
        design: string;
        additionalInfo?: string;
    }) {
        return this.post<any>('/admin/users/generate-membership-card', data);
    }

    async getMembershipCard(userId: string) {
        return this.get<any>(`/admin/users/${userId}/membership-card`);
    }


}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };

// Export types for use in components
export type { ApiResponse, RequestOptions }; 