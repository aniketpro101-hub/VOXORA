'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { ShieldCheck, Smartphone, Flame, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function HealthMonitorWidget() {
  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/antiban/health-scores')
      .then((res) => setHealthScores(res.data.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || healthScores.length === 0) return null;

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-card to-emerald-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base">Instance Health & Anti-Ban Risk Monitor</CardTitle>
          </div>
          <Link href="/settings/antiban" className="text-xs font-semibold text-primary hover:underline">
            Manage Protection
          </Link>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {healthScores.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  Today: {item.currentDayCount} / {item.dailyLimit} msgs ({item.successRate}% success)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-black text-foreground">Health: {item.healthScore}/100</p>
                <p className="text-[10px] text-emerald-500 font-semibold uppercase">{item.riskLevel} RISK</p>
              </div>

              <Link href={`/instances/${item.id}/warmup`}>
                <button className="p-1.5 rounded-lg border border-border hover:bg-accent text-amber-500" title="View Warmup Progress">
                  <Flame className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
