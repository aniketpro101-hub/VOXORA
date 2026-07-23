'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { Bell, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoResumeBanner() {
  const [pendingCampaigns, setPendingCampaigns] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    apiClient
      .get('/campaigns?status=running')
      .then((res) => {
        const list = res.data.data?.campaigns || [];
        if (list.length > 0) setPendingCampaigns(list);
      })
      .catch(() => {});
  }, []);

  if (dismissed || pendingCampaigns.length === 0) return null;

  const handleResumeAll = async () => {
    try {
      for (const c of pendingCampaigns) {
        await apiClient.post(`/campaigns/${c._id}/resume`);
      }
      toast.success('Resumed all pending campaigns!');
      setDismissed(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resume campaigns');
    }
  };

  return (
    <div className="mb-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-foreground shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-bold">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-foreground">Welcome Back! Server Recovery Activated</h4>
            <p className="text-xs text-muted-foreground">
              You have {pendingCampaigns.length} running campaign(s) that were preserved across server restarts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleResumeAll} className="bg-amber-500 text-slate-950 hover:bg-amber-600 font-bold">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resume All ({pendingCampaigns.length})
          </Button>
          <button onClick={() => setDismissed(true)} className="p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
