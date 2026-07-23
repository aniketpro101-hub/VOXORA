'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/apiClient';
import { Flame, CheckCircle2 } from 'lucide-react';

export default function WarmupDashboardClientPage() {
  const params = useParams();
  const instanceId = params?.id as string;

  const [warmupData, setWarmupData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (instanceId) {
      apiClient
        .get(`/antiban/warmup/${instanceId}`)
        .then((res) => setWarmupData(res.data.data))
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [instanceId]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-3xl" />;
  }

  const inst = warmupData?.instance;

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 mb-2">
            <Flame className="h-4 w-4" /> 30-Day Number Warmup Protocol
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Warmup Progress: {inst?.name || 'Instance'}
          </h1>
          <p className="text-sm text-muted-foreground">{inst?.phoneNumber || 'WhatsApp Session'}</p>
        </div>

        <Badge variant={warmupData?.healthScore >= 80 ? 'success' : 'warning'} className="text-sm px-4 py-1.5">
          Health Score: {warmupData?.healthScore || 100}/100 🟢
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Warmup Timeline</span>
            <h2 className="text-3xl font-black text-foreground">Day {warmupData?.warmupDay || 1} of 30</h2>
            <p className="text-xs text-emerald-500 font-semibold">Progressing as expected</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Today's Sending Progress</span>
            <h2 className="text-3xl font-black text-foreground">
              {inst?.currentDayCount || 0} / {warmupData?.currentLimit || 30}
            </h2>
            <p className="text-xs text-muted-foreground">Daily Safety Limit</p>
          </div>
        </Card>

        <Card>
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase">Ban Risk Assessment</span>
            <h2 className="text-3xl font-black text-emerald-500 uppercase">{warmupData?.riskLevel || 'SAFE'}</h2>
            <p className="text-xs text-muted-foreground">Zero WhatsApp Flags</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">30-Day Warmup Schedule Journey</CardTitle>
          <CardDescription>Automatic gradual daily limit progression</CardDescription>
        </CardHeader>

        <div className="space-y-3">
          {[
            { range: 'Day 1 - 3', limit: '30 msgs/day', status: warmupData?.warmupDay >= 1 ? 'completed' : 'pending' },
            { range: 'Day 4 - 7', limit: '100 msgs/day', status: warmupData?.warmupDay >= 4 ? 'completed' : 'pending' },
            { range: 'Day 8 - 14', limit: '300 msgs/day', status: warmupData?.warmupDay >= 8 ? 'completed' : 'pending' },
            { range: 'Day 15 - 21', limit: '500 msgs/day', status: warmupData?.warmupDay >= 15 ? 'completed' : 'pending' },
            { range: 'Day 22 - 30', limit: '800 msgs/day', status: warmupData?.warmupDay >= 22 ? 'completed' : 'pending' },
            { range: 'Day 30+', limit: '1000+ msgs/day', status: warmupData?.warmupDay >= 30 ? 'completed' : 'pending' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                item.status === 'completed'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-5 w-5 ${item.status === 'completed' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-bold text-foreground">{item.range}</p>
                  <p className="text-xs text-muted-foreground">Maximum Daily Limit: {item.limit}</p>
                </div>
              </div>
              <Badge variant={item.status === 'completed' ? 'success' : 'outline'}>
                {item.status === 'completed' ? 'UNLOCKED' : 'LOCKED'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
