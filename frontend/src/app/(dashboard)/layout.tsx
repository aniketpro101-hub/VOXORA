'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(!user);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.data) {
          setUser(res.data.data);
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/setup')) {
            window.location.href = '/login';
          }
        }
      } finally {
        setIsChecking(false);
      }
    };

    if (!user) {
      fetchUser();
    } else {
      setIsChecking(false);
    }
  }, [user, setUser, logout]);

  if (isChecking && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
