'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Zap, ShieldCheck, KeyRound, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', label: '+91 (India 🇮🇳)' },
  { code: '+1', label: '+1 (USA/Canada 🇺🇸)' },
  { code: '+44', label: '+44 (UK 🇬🇧)' },
  { code: '+971', label: '+971 (UAE 🇦🇪)' },
  { code: '+966', label: '+966 (Saudi Arabia 🇸🇦)' },
  { code: '+65', label: '+65 (Singapore 🇸🇬)' },
  { code: '+60', label: '+60 (Malaysia 🇲🇾)' },
  { code: '+61', label: '+61 (Australia 🇦🇺)' },
  { code: '+49', label: '+49 (Germany 🇩🇪)' },
  { code: '+33', label: '+33 (France 🇫🇷)' },
  { code: '+92', label: '+92 (Pakistan 🇵🇰)' },
  { code: '+880', label: '+880 (Bangladesh 🇧🇩)' },
];

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  // 2-Box WhatsApp Phone State
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
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
        router.push('/setup');
      }
    } catch (err) {
      // Continue
    }
  };

  const getFullPhone = () => {
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    return `${countryCode}${cleanDigits}`;
  };

  // 1. Request WhatsApp OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 7) {
      toast.error('Please enter a valid 10-digit WhatsApp phone number');
      return;
    }

    const fullPhone = getFullPhone();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/otp/request', { phone: fullPhone });
      toast.success(res.data?.message || 'OTP code sent to your WhatsApp!');
      if (res.data?.data?.devCode) {
        setOtpCode(res.data.data.devCode);
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

  // 2. Verify WhatsApp OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    const fullPhone = getFullPhone();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/otp/verify', { phone: fullPhone, code: otpCode });
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

        {/* Auth Card - CLIENT WHATSAPP OTP ONLY */}
        <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {otpStep === 'request' ? 'WhatsApp Sign In' : 'Enter Verification Code'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {otpStep === 'request'
                  ? 'Enter your WhatsApp phone number to receive a 6-digit security code.'
                  : `Enter the 6-digit code sent to ${getFullPhone()}`}
              </p>
            </div>

            {otpStep === 'request' ? (
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    WhatsApp Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-36 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={10}
                      className="flex-1 font-mono tracking-wide"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Select country code (e.g., +91 for India) and enter your 10-digit number.
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

          {/* Admin Login Link */}
          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Administrator?{' '}
              <Link href="/admin-login" className="font-semibold text-cyanAccent hover:underline">
                Admin Sign In
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
