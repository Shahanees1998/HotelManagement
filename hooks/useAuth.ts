import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  profileImage?: string;
  profileImagePublicId?: string;
  lastLogin?: string;
  isPasswordChanged?: boolean;
  createdAt?: string;
  updatedAt?: string;
  hotelId?: string;
  hotelSlug?: string;
  hotelName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const loading = status === 'loading';

  // Update user state when session changes
  useEffect(() => {
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        phone: session.user.phone,
        role: session.user.role,
        status: session.user.status,
        profileImage: session.user.profileImage,
        profileImagePublicId: session.user.profileImagePublicId,
        lastLogin: session.user.lastLogin?.toString(),
        isPasswordChanged: session.user.isPasswordChanged,
        createdAt: session.user.createdAt?.toString(),
        updatedAt: session.user.updatedAt?.toString(),
        hotelId: session.user.hotelId,
        hotelSlug: session.user.hotelSlug,
        hotelName: session.user.hotelName,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('Login failed');
      }

      // Fetch user data after successful login
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        return data.user;
      } else {
        throw new Error('Failed to get user data after login');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      // Update session from server
      await update();
      
      // Also fetch fresh user data
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
    }
  }, [user, loading]);

  return { user, loading, logout };
}

// Hook for admin-only routes
export function useRequireAdmin() {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login';
      } else if (user.role !== 'ADMIN') {
        // Redirect to access denied if not admin
        window.location.href = '/auth/access';
      }
    }
  }, [user, loading]);

  return { user, loading, logout };
} 