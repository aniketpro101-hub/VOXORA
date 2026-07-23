'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Send,
  Users,
  CheckCircle,
  Clock,
  Eye,
  MessageSquare,
  Zap,
  Plus,
  Key,
  FileSpreadsheet,
  Pause,
  Play,
  Square,
  BarChart2,
  Activity,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalRead: 0,
    totalReplied: 0,
    totalContacts: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    todaySent: 0,
    deliveryRate: 0,
    readRate: 0,
    replyRate: 0,
    revenue: 0,
  });

  const [activeCampaignsList, setActiveCampaignsList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await apiClient.get('/dashboard/stats');
      if (statsRes.data?.data) setStats(statsRes.data.data);

      const activityRes = await apiClient.get('/dashboard/activity');
      if (activityRes.data?.data) setActivities(activityRes.data.data);

      const campaignsRes = await apiClient.get('/campaigns', { params: { status: 'running' } });
      setActiveCampaignsList(campaignsRes.data?.data?.campaigns || []);
    } catch (err) {
      // Clean Zero Data (NO HARDCODED FAKE DATA)
      setStats({
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalReplied: 0,
        totalContacts: 0,
        totalCampaigns: 0,
        activeCampaigns: 0,
        todaySent: 0,
        deliveryRate: 0,
        readRate: 0,
        replyRate: 0,
        revenue: 0,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">VOXORA Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time metrics, live campaign monitors, and quick send controls.</p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex gap-2">
          <Button onClick={() => (window.location.href = '/campaigns/quick')} className="bg-amber-400 text-slate-950 font-extrabold hover:bg-amber-300">
            <Zap className="mr-1.5 h-4 w-4" /> ⚡ Quick Send
          </Button>
          <Button onClick={() => (window.location.href = '/campaigns/new')} className="bg-primary hover:bg-primary/90 text-white font-extrabold">
            <Plus className="mr-1.5 h-4 w-4" /> + New Campaign
          </Button>
        </div>
      </div>

      {/* FEATURE #4: REAL-TIME CAMPAIGN PROGRESS WIDGET AT TOP */}
      {activeCampaignsList.length > 0 ? (
        <Card className="p-5 border-emerald-500/40 bg-emerald-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              🔴 LIVE RUNNING CAMPAIGN
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Auto-refreshes every 5s</span>
          </div>

          {activeCampaignsList.map((c) => {
            const sent = c.stats?.sentCount || 0;
            const total = c.stats?.totalContacts || 1;
            const pct = Math.round((sent / total) * 100);

            return (
              <div key={c._id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground text-sm">{c.name}</span>
                  <span className="text-emerald-400 font-mono font-bold">Status: Sending Active</span>
                </div>

                <div className="w-full bg-accent/40 rounded-full h-3 overflow-hidden border border-border">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>
                      Progress: {sent}/{total} ({pct}%)
                    </span>
                    <span className="text-emerald-400">✅ {c.stats?.deliveredCount || 0} Delivered</span>
                    <span className="text-purple-400">👁️ {c.stats?.readCount || 0} Read</span>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => (window.location.href = `/campaigns/${c._id}/report`)}>
                      <BarChart2 className="mr-1 h-3.5 w-3.5" /> Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <Card className="p-5 border-dashed border-border text-center space-y-2">
          <p className="text-sm font-bold text-foreground">📊 Campaign Monitor</p>
          <p className="text-xs text-muted-foreground">No active campaigns running right now. Start your first campaign to see live tracking!</p>
        </Card>
      )}

      {/* SECTION 1: STATS CARDS (REAL DATA ONLY) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages Sent', value: stats.totalSent, sub: `${stats.todaySent} Sent Today`, color: 'text-primary' },
          { label: 'Total Delivered', value: stats.totalDelivered, sub: `${stats.deliveryRate}% Delivery Rate`, color: 'text-emerald-500' },
          { label: 'Total Messages Read', value: stats.totalRead, sub: `${stats.readRate}% Read Rate`, color: 'text-purple-400' },
          { label: 'Total Replies', value: stats.totalReplied, sub: `${stats.replyRate}% Reply Rate`, color: 'text-cyanAccent' },
        ].map((card, idx) => (
          <Card key={idx} className="p-4 space-y-1 bg-card/60">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">{card.label}</span>
            <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground font-semibold">{card.sub}</p>
          </Card>
        ))}
      </div>

      {/* SECTION 3: RECENT ACTIVITY FEED */}
      <Card className="p-5 space-y-4">
        <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Recent System Activity Feed
        </h3>

        {activities.length > 0 ? (
          <div className="space-y-2 text-xs">
            {activities.map((a, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-accent/30 border border-border flex justify-between items-center">
                <span className="text-foreground font-semibold">{a.text}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2 border border-dashed border-border rounded-2xl">
            <p className="text-sm font-bold text-foreground">📊 No Activity Logged Yet</p>
            <p className="text-xs text-muted-foreground">Activities will appear here in real-time as campaigns and messages are sent.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
