import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { adminApi } from '../api/client';
import type { AdminUser } from '../api/client';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qstack_admin_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    adminApi.getMe()
      .then((user) => {
        if (['moderator', 'admin', 'super_admin'].includes(user.role)) {
          setAdminUser(user);
        } else {
          localStorage.removeItem('qstack_admin_token');
          setAdminUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('qstack_admin_token');
        setAdminUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await adminApi.login(email, pass);
    if (!['moderator', 'admin', 'super_admin'].includes(res.user.role)) {
      throw new Error('Access denied: Account does not have administrative privileges.');
    }
    localStorage.setItem('qstack_admin_token', res.accessToken);
    setAdminUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('qstack_admin_token');
    setAdminUser(null);
  };

  const isSuperAdmin = adminUser?.role === 'super_admin';
  const isAdmin = isSuperAdmin || adminUser?.role === 'admin';
  const isAuthenticated = !!adminUser;

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
};
