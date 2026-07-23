'use client';

import React, { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data?.data) {
          setUser(res.data.data);
        } else {
          setUser({ id: 'admin', name: 'Aniket Samant', email: 'aniket@voxora.com', role: 'admin' });
        }
      } catch (err) {
        setUser({ id: 'admin', name: 'Aniket Samant', email: 'aniket@voxora.com', role: 'admin' });
      }
    };

    if (!user) {
      fetchUser();
    }
  }, [user, setUser]);

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
