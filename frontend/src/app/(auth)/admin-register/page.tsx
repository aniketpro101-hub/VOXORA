'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap, ShieldCheck, UserPlus } from 'lucide-react';

export default function AdminRegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { name, email, password, phone });
      const { user, accessToken } = res.data.data;

      setUser(user, accessToken);
      toast.success(`Admin Account Registered! Welcome, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed. Please check input requirements.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

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
          <p className="text-sm text-muted-foreground font-semibold">
            Master Admin Registration Portal
          </p>
        </div>

        <div className="rounded-2xl border border-primary/40 bg-card/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <UserPlus className="h-5 w-5" />
              <h2 className="text-xl font-bold text-foreground">Register Admin Account</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Create an administrator account for platform management.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              type="text"
              placeholder="Aniket Samant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="admin@roasbodhi.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Phone Number (Optional)"
              type="tel"
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Password (min 6 chars) *"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Register Admin Account & Enter Dashboard
            </Button>
          </form>

          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Already registered?{' '}
              <Link href="/admin-login" className="font-semibold text-primary hover:underline">
                Admin Sign In
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
