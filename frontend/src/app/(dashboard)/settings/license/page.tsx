'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { KeyRound, Monitor, Calendar, Send, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function UserLicenseStatusPage() {
  const [license, setLicense] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/license/hwid');
      setLicense({
        status: 'active',
        keyMasked: 'VXR-8K9M-••••-••••-A1B3',
        daysRemaining: 30,
        pct: 100,
        pcName: res.data.data.pcName || 'DESKTOP-USER',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
    } catch (err) {
      toast.error('Failed to load license details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 mb-2">
          <KeyRound className="h-4 w-4" /> Hardware Locked Testing License
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">License Information</h1>
        <p className="text-sm text-muted-foreground">Details about your active VOXORA license key and hardware binding.</p>
      </div>

      <Card className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase text-muted-foreground">Current Status</span>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-sm py-1 px-3">🟢 ACTIVE</Badge>
              <span className="text-xs text-muted-foreground">Hardware Bound</span>
            </div>
          </div>

          <Link href="/activate">
            <Button variant="outline" size="sm">
              Enter New Key
            </Button>
          </Link>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div className="p-4 rounded-2xl bg-accent/20 border border-border space-y-1">
            <span className="text-muted-foreground font-bold uppercase">License Key</span>
            <p className="font-mono text-sm font-bold text-purple-400">VXR-8K9M-••••-••••-A1B3</p>
          </div>

          <div className="p-4 rounded-2xl bg-accent/20 border border-border space-y-1">
            <span className="text-muted-foreground font-bold uppercase">Bound Computer</span>
            <p className="font-mono text-sm font-bold text-foreground truncate">
              <Monitor className="inline h-4 w-4 mr-1 text-primary" /> {license?.pcName}
            </p>
          </div>
        </div>

        {/* Days remaining bar */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold text-foreground">
            <span>Validity Progress</span>
            <span className="text-emerald-500">30 Days Remaining (100%)</span>
          </div>
          <div className="h-3 rounded-full bg-accent overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>
        </div>

        {/* Telegram Contact Footer */}
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-foreground">Need to extend your trial or change PC?</p>
            <p className="text-muted-foreground">Contact developer Mr. Aniket Samant for instant support.</p>
          </div>

          <a href="https://t.me/actasiff" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
              <Send className="mr-1.5 h-3.5 w-3.5" /> Telegram @actasiff
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
