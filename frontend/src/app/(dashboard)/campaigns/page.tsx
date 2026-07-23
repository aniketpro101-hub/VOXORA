'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Send,
  Plus,
  Play,
  Pause,
  Square,
  BarChart2,
  Search,
  Zap,
  Inbox,
  Repeat,
  Edit3,
} from 'lucide-react';

export default function CampaignsListPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/campaigns', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } });
      setCampaigns(res.data?.data?.campaigns || []);
    } catch (err: any) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await apiClient.post(`/campaigns/${id}/pause`);
      toast.success('Campaign paused successfully');
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to pause campaign');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await apiClient.post(`/campaigns/${id}/resume`);
      toast.success('Campaign resumed successfully');
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to resume campaign');
    }
  };

  const handleStop = async (id: string) => {
    try {
      await apiClient.post(`/campaigns/${id}/stop`);
      toast.success('Campaign stopped successfully');
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to stop campaign');
    }
  };

  const handleResend = async (id: string) => {
    try {
      const res = await apiClient.post(`/campaigns/${id}/clone`, { name: `Resend - ${new Date().toLocaleTimeString()}` });
      const cloned = res.data?.data || res.data;
      if (cloned && cloned._id) {
        await apiClient.post(`/campaigns/${cloned._id}/start`);
        toast.success('🔄 Campaign duplicated & started successfully!');
        fetchCampaigns();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to resend campaign');
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Send className="h-8 w-8 text-primary" /> Campaigns & Broadcasts
          </h1>
          <p className="text-sm text-muted-foreground">Manage active campaigns, control real-time message flow, and view detailed reports.</p>
        </div>

        <div className="flex gap-2">
          <Link href="/campaigns/quick">
            <Button className="bg-amber-400 text-slate-950 font-extrabold hover:bg-amber-300">
              <Zap className="mr-1.5 h-4 w-4" /> ⚡ Quick Send
            </Button>
          </Link>
          <Link href="/campaigns/new">
            <Button className="bg-primary hover:bg-primary/90 text-white font-extrabold">
              <Plus className="mr-1.5 h-4 w-4" /> + New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-accent/40 text-xs text-foreground focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-accent/40 p-2 text-xs font-bold text-foreground focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="running">🟢 Running</option>
          <option value="paused">🟡 Paused</option>
          <option value="completed">✅ Completed</option>
          <option value="stopped">🔴 Stopped</option>
        </select>
      </Card>

      {/* CAMPAIGNS LIST */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center text-muted-foreground font-medium">
            Loading campaigns from database...
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <h3 className="font-extrabold text-base text-foreground">No Campaigns Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchTerm ? 'No campaigns match your search criteria.' : 'Create your first broadcast campaign to send messages to your WhatsApp contacts.'}
            </p>
            <Link href="/campaigns/new">
              <Button className="mt-2 bg-primary text-white font-bold size-sm">Create New Campaign</Button>
            </Link>
          </Card>
        ) : (
          filteredCampaigns.map((c) => {
            const sent = c.stats?.sentCount || 0;
            const total = c.stats?.totalContacts || c.totalContacts || 1;
            const pct = Math.round((sent / total) * 100);

            return (
              <Card key={c._id} className="p-5 space-y-4 hover:border-primary/50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-foreground">{c.name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          c.status === 'running'
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                            : c.status === 'paused'
                            ? 'bg-amber-500/20 text-amber-400'
                            : c.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex gap-2">
                    {c.status === 'running' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handlePause(c._id)} className="text-amber-400 border-amber-500/30">
                          <Pause className="mr-1 h-3.5 w-3.5" /> Pause
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStop(c._id)} className="text-rose-400 border-rose-500/30">
                          <Square className="mr-1 h-3.5 w-3.5" /> Stop
                        </Button>
                      </>
                    )}

                    {c.status === 'paused' && (
                      <Button size="sm" variant="outline" onClick={() => handleResume(c._id)} className="text-emerald-400 border-emerald-500/30">
                        <Play className="mr-1 h-3.5 w-3.5" /> Resume
                      </Button>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleResend(c._id)} className="text-emerald-400 border-emerald-500/30 font-bold">
                      <Repeat className="mr-1 h-3.5 w-3.5" /> 🔄 Instant Resend
                    </Button>

                    <Link href={`/campaigns/quick?cloneFrom=${c._id}`}>
                      <Button size="sm" variant="outline" className="text-sky-400 border-sky-500/30 font-bold">
                        <Edit3 className="mr-1 h-3.5 w-3.5" /> ✏️ Edit & Resend
                      </Button>
                    </Link>

                    <Link href={`/campaigns/${c._id}/report`}>
                      <Button size="sm" className="bg-primary text-white font-bold">
                        <BarChart2 className="mr-1.5 h-4 w-4" /> View Full Report
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress & Stats */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>
                      Progress: {sent} / {total} contacts ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-accent/40 rounded-full h-2.5 overflow-hidden border border-border">
                    <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>

                  <div className="flex items-center gap-6 text-[11px] text-muted-foreground pt-1">
                    <span>📤 {sent} Sent</span>
                    <span className="text-emerald-400">✅ {c.stats?.deliveredCount || 0} Delivered</span>
                    <span className="text-purple-400">👁️ {c.stats?.readCount || 0} Read</span>
                    <span className="text-cyan-400">💬 {c.stats?.repliedCount || 0} Replied</span>
                    {(c.stats?.failedCount || 0) > 0 && <span className="text-rose-400 font-bold">❌ {c.stats.failedCount} Failed</span>}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
