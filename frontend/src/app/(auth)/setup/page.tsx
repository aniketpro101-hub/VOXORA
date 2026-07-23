'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap, ShieldCheck, UserCheck } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await apiClient.get('/auth/setup-status');
      if (!res.data?.data?.isSetupRequired) {
        toast.info('Initial setup has already been completed. Please log in.');
        router.push('/login');
      }
    } catch (err) {
      // Continue
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/setup', { name, email, password, phone });
      const { user, accessToken } = res.data.data;

      setUser(user, accessToken);
      toast.success(`Super Admin Account Created! Welcome, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Setup failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-card to-background p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyanAccent/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanAccent text-white shadow-xl shadow-primary/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-cyanAccent bg-clip-text text-transparent">
            VOXORA
          </h1>
          <p className="text-sm text-muted-foreground">
            Initial Server Installation & Super Admin Setup
          </p>
        </div>

        <div className="rounded-2xl border border-primary/30 bg-card/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Create Super Admin</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Set up your master administrator account to manage your VOXORA platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Full Name *"
                type="text"
                placeholder="Aniket Samant"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Admin Email *"
                type="email"
                placeholder="admin@roasbodhi.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="Master Password *"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                label="WhatsApp Phone Number (Optional)"
                type="text"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Complete Initial Setup & Sign In
            </Button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already initialized?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Developed by Mr. Aniket Samant (Telegram: @actasiff)</span>
        </div>
      </div>
    </div>
  );
}
