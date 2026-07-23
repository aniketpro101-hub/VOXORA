'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap, ShieldCheck, Mail, Phone, KeyRound, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // Tab State: 'email' | 'otp'
  const [activeTab, setActiveTab] = useState<'email' | 'otp'>('otp');

  // Email Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP Form State
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [resendTimer, setResendTimer] = useState(0);

  // General Loading & Setup Check
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const checkSetupStatus = async () => {
    try {
      const res = await apiClient.get('/auth/setup-status');
      if (res.data?.data?.isSetupRequired) {
        setIsSetupRequired(true);
      }
    } catch (err) {
      // Safe default: Assume setup may be required on fresh startup or transient network error
      setIsSetupRequired(true);
    }
  };

  // 1. Email Password Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken } = res.data.data;

      setUser(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Request WhatsApp OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please enter your WhatsApp phone number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/otp/request', { phone });
      toast.success(res.data?.message || 'OTP code sent via WhatsApp!');
      
      if (res.data?.data?.devCode) {
        toast.info(`🔑 Dev OTP Code: ${res.data.data.devCode}`, { duration: 10000 });
      }

      setOtpStep('verify');
      setResendTimer(60);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to send OTP code. Please check phone number.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify WhatsApp OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/otp/verify', { phone, code: otpCode });
      const { user, accessToken } = res.data.data;

      setUser(user, accessToken);
      toast.success(`Logged in via WhatsApp! Welcome, ${user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP code.';
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
        {/* Setup Required Alert Banner */}
        {isSetupRequired && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 backdrop-blur-md flex items-center justify-between text-amber-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-amber-300">Initial Setup Required</p>
                <p className="text-amber-200/80">No Super Admin account found.</p>
              </div>
            </div>
            <Link
              href="/setup"
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors shrink-0"
            >
              Start Setup
            </Link>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyanAccent text-white shadow-xl shadow-primary/30">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-cyanAccent bg-clip-text text-transparent">
            VOXORA
          </h1>
          <p className="text-sm text-muted-foreground">
            Enterprise WhatsApp Automation & CRM Platform
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Tab Selector */}
          <div className="flex rounded-xl bg-muted p-1 border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('otp')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === 'otp'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>WhatsApp OTP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                activeTab === 'email'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* TAB 1: WHATSAPP OTP LOGIN */}
          {activeTab === 'otp' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {otpStep === 'request' ? 'WhatsApp OTP Sign In' : 'Enter Verification Code'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {otpStep === 'request'
                    ? 'Enter your WhatsApp phone number to receive a 6-digit security code.'
                    : `Enter the 6-digit code sent to +${phone}`}
                </p>
              </div>

              {otpStep === 'request' ? (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div>
                    <Input
                      label="WhatsApp Phone Number"
                      type="tel"
                      placeholder="+919876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Include country code (e.g., +91 for India, +1 for USA)
                    </p>
                  </div>

                  <Button type="submit" className="w-full mt-2 gap-2" isLoading={isLoading}>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <Input
                      label="6-Digit OTP Code"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-center tracking-widest text-lg font-mono"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2 gap-2" isLoading={isLoading}>
                    <KeyRound className="h-4 w-4" />
                    <span>Verify & Access Dashboard</span>
                  </Button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Change Number
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || isLoading}
                      onClick={handleRequestOTP}
                      className="text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL PASSWORD LOGIN */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Email Sign In</h2>
                <p className="text-xs text-muted-foreground">
                  Enter your email and password credentials.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="admin@roasbodhi.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
                  Sign In to Voxora
                </Button>
              </form>
            </div>
          )}

          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Need to register a new admin?{' '}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register Admin Account
              </Link>
            </p>
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
