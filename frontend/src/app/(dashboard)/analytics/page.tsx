'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Send,
  CheckCheck,
  Eye,
  MessageSquare,
  DollarSign,
  Clock,
  Download,
  Link as LinkIcon,
  Plus,
} from 'lucide-react';

export default function MainAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/analytics/dashboard');
      setStats(res.data?.data);
    } catch (err) {
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const overview = stats?.overview || {
    totalMessages: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    replied: 0,
    deliveryRate: '0%',
    readRate: '0%',
    replyRate: '0%',
    revenue: '₹0',
  };

  const topCampaigns = stats?.topCampaigns || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <BarChart3 className="h-4 w-4" /> Real-Time Analytics & ROI Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Advanced Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track message delivery rates, read times, link clicks, media downloads, and revenue ROI.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/analytics/links">
            <Button variant="outline">
              <LinkIcon className="mr-1.5 h-4 w-4 text-purple-400" /> Link Click Reports
            </Button>
          </Link>
          <Button className="bg-primary">
            <Download className="mr-1.5 h-4 w-4" /> Export Report (Excel/PDF)
          </Button>
        </div>
      </div>

      {/* KPI Row (100% Real Database Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Sent</span>
            <Send className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-foreground">{overview.totalMessages?.toLocaleString() || 0}</h3>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Delivered</span>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-500">{overview.delivered?.toLocaleString() || 0}</h3>
          <p className="text-[10px] text-muted-foreground">{overview.deliveryRate} Rate</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Read</span>
            <Eye className="h-4 w-4 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-black text-cyan-400">{overview.read?.toLocaleString() || 0}</h3>
          <p className="text-[10px] text-muted-foreground">{overview.readRate} Read Rate</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Replied</span>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </div>
          <h3 className="text-2xl font-black text-purple-400">{overview.replied?.toLocaleString() || 0}</h3>
          <p className="text-[10px] text-muted-foreground">{overview.replyRate} Reply Rate</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Revenue ROI</span>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-amber-500">{overview.revenue || '₹0'}</h3>
          <p className="text-[10px] text-muted-foreground font-bold">Real Sales Data</p>
        </Card>
      </div>

      {/* Charts & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Time Analysis */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Peak Engagement Analysis</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-accent/40 border border-border text-muted-foreground font-semibold">
              💡 Engagement insights are calculated dynamically as campaigns dispatch and responses are logged in database.
            </div>
          </div>
        </Card>

        {/* Top Performing Campaigns */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <h3 className="text-lg font-bold text-foreground">Top Performing Campaigns</h3>
            </div>
            <Link href="/campaigns/new">
              <Button size="sm" className="bg-primary text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> New Campaign
              </Button>
            </Link>
          </div>

          {topCampaigns.length > 0 ? (
            <div className="space-y-3">
              {topCampaigns.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-2xl bg-accent/30 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Reply Rate: {item.replyRate}</p>
                  </div>
                  <Badge variant="success">{item.revenue}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-border rounded-2xl space-y-2">
              <p className="text-sm font-bold text-foreground">📊 No Campaign Data Yet</p>
              <p className="text-xs text-muted-foreground">Start your first campaign to track performance and analytics here.</p>
              <Link href="/campaigns/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold mt-2">
                  🚀 Launch First Campaign
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
