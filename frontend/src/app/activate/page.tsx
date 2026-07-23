'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { KeyRound, ShieldCheck, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function StandaloneActivationPage() {
  const router = useRouter();
  const [rawKey, setRawKey] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [hwidInfo, setHwidInfo] = useState<any>(null);

  useEffect(() => {
    fetchHWID();
  }, []);

  const fetchHWID = async () => {
    try {
      const res = await apiClient.get('/license/hwid');
      setHwidInfo(res.data.data);
    } catch (e) {
      // Fallback local HWID if offline
      setHwidInfo({ pcName: 'DESKTOP-USER', hwid: 'LOCAL-HWID-FALLBACK' });
    }
  };

  const handleKeyChange = (val: string) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('VXR')) {
      clean = clean.substring(3);
    }

    const parts = [];
    parts.push('VXR');
    for (let i = 0; i < clean.length && i < 16; i += 4) {
      parts.push(clean.substring(i, i + 4));
    }
    setRawKey(parts.join('-'));
  };

  const handleActivate = async () => {
    if (!rawKey || rawKey.length < 23) {
      toast.error('Please enter a valid 23-character license key (VXR-XXXX-XXXX-XXXX-XXXX)');
      return;
    }
    if (!acceptedTerms) {
      toast.error('You must accept the terms & conditions to proceed');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/license/activate', {
        key: rawKey,
        hwid: hwidInfo?.hwid,
        pcName: hwidInfo?.pcName,
        osInfo: hwidInfo?.osInfo,
      });

      toast.success(`License Activated! Welcome, ${res.data.data.assignedTo || 'User'}`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to activate license key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-accent/10 to-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 space-y-6 shadow-2xl border-primary/20 bg-card/95 backdrop-blur">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-lg mb-4">
            <KeyRound className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome to VOXORA 🚀</h1>
          <p className="text-xs text-muted-foreground font-medium">World's Best Bulk WhatsApp Automation Software</p>
        </div>

        {/* Input Form */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Enter Your License Key</label>
            <Input
              value={rawKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="VXR-XXXX-XXXX-XXXX-XXXX"
              className="text-center font-mono text-base tracking-widest uppercase font-bold py-6 border-primary/30"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="terms" className="cursor-pointer">I accept terms of use and end-user license agreement.</label>
          </div>

          <Button
            onClick={handleActivate}
            disabled={isLoading || rawKey.length < 23}
            className="w-full py-6 text-sm font-bold bg-primary hover:bg-primary/90 shadow-lg"
          >
            {isLoading ? 'Verifying & Activating License...' : '🔓 Activate License Now'}
          </Button>
        </div>

        {/* Support Footer */}
        <div className="border-t border-border pt-4 text-center space-y-2">
          <p className="text-xs text-muted-foreground">Don't have a license key or need renewal?</p>
          <a
            href="https://t.me/actasiff"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:underline"
          >
            <Send className="h-3.5 w-3.5" /> Contact Developer Mr. Aniket Samant (@actasiff)
          </a>
        </div>
      </Card>
    </div>
  );
}
