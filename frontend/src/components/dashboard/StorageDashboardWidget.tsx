'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { HardDrive, Clock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface StorageInfo {
  used: {
    bytes: number;
    mb: number;
    percentage: number;
  };
  quota: {
    bytes: number;
    mb: number;
  };
  files: {
    current: number;
    max: number;
  };
  retentionHours: number;
}

export default function StorageDashboardWidget() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStorageInfo = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/upload/storage');
      if (res.data?.data) {
        setStorage(res.data.data);
      }
    } catch (e) {
      console.warn('Failed to fetch storage info:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-3">
        <div className="h-4 bg-accent/40 rounded w-1/3"></div>
        <div className="h-8 bg-accent/40 rounded w-full"></div>
      </div>
    );
  }

  const usedMb = storage?.used?.mb || 0;
  const quotaMb = storage?.quota?.mb || 500;
  const percentage = storage?.used?.percentage || 0;
  const currentFiles = storage?.files?.current || 0;
  const maxFiles = storage?.files?.max || 100;

  const barColor =
    percentage > 85 ? 'bg-rose-500' : percentage > 60 ? 'bg-amber-500' : 'bg-gradient-to-r from-primary to-cyanAccent';

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Media Storage & 48h Retention</h3>
            <p className="text-[11px] text-muted-foreground">Self-Hosted Auto-Cleanup Storage</p>
          </div>
        </div>
        <button
          onClick={fetchStorageInfo}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Refresh storage quota"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Used Quota</span>
          <span className="text-foreground">
            {usedMb} MB / {quotaMb} MB ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-accent/40 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl border border-border bg-accent/20 flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Active Files</p>
            <p className="text-xs font-bold text-foreground">
              {currentFiles} / {maxFiles} Files
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-accent/20 flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Auto-Cleanup</p>
            <p className="text-xs font-bold text-amber-400">Every 48 Hours</p>
          </div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl border border-primary/20 bg-primary/5 text-[11px] text-muted-foreground flex items-center gap-2">
        <AlertCircle className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span>Media attachments auto-delete from disk after 48h to maintain server speed.</span>
      </div>
    </div>
  );
}
