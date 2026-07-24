'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap, ShieldCheck, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState('admin@roasbodhi.in');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both admin email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;

      setUser(user, accessToken);
      toast.success(`Super Admin Authorized! Welcome, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Admin authentication failed. Please check credentials.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyanAccent/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanAccent text-white shadow-xl shadow-primary/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-cyanAccent bg-clip-text text-transparent">
            VOXORA
          </h1>
          <p className="text-sm text-muted-foreground font-semibold">
            Master Super Admin Authentication Portal
          </p>
        </div>

        {/* Admin Login Card */}
        <div className="rounded-2xl border border-primary/40 bg-card/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Lock className="h-5 w-5" />
              <h2 className="text-xl font-bold text-foreground">Owner Portal Login</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct access portal for Platform Owner & Super Administrators.
            </p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div>
              <Input
                label="Admin Email Address"
                type="email"
                placeholder="admin@roasbodhi.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Master Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Authorize & Sign In as Admin
            </Button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Switch to Client WhatsApp Login
            </Link>
          </div>
        </div>

        {/* Developer Credit Footer */}
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Developed by Mr. Aniket Samant (Telegram: @actasiff)</span>
        </div>
      </div>
    </div>
  );
}
