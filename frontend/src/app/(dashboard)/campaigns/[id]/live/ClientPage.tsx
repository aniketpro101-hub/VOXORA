'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { io } from 'socket.io-client';
import {
  Send,
  CheckCheck,
  Eye,
  AlertTriangle,
  Pause,
  Square,
  Zap,
} from 'lucide-react';

export default function CampaignLiveClientPage() {
  const params = useParams();
  const campaignId = params?.id as string;

  const [campaign, setCampaign] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ sent: 0, delivered: 0, read: 0, failed: 0 });

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
      fetchLogs();

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('voxora_access_token') : null;
      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000/instances', {
        transports: ['websocket'],
        auth: { token: accessToken },
      });

      socket.on(`campaign:${campaignId}:progress`, (data: any) => {
        setStats((prev) => ({ ...prev, sent: data.sentCount }));
        setLogs((prev) => [
          {
            phone: data.recentPhone,
            status: data.status,
            updatedAt: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 15),
        ]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      const res = await apiClient.get(`/campaigns/${campaignId}`);
      const c = res.data.data;
      setCampaign(c);
      setStats({
        sent: c.sentCount || 0,
        delivered: c.deliveredCount || 0,
        read: c.readCount || 0,
        failed: c.failedCount || 0,
      });
    } catch (err) {}
  };

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get(`/campaigns/${campaignId}/logs`);
      setLogs(res.data.data || []);
    } catch (err) {}
  };

  const pct = Math.round(((stats.sent || 0) / (campaign?.totalContacts || 1)) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              LIVE: {campaign?.name || 'Campaign'}
            </h1>
            <p className="text-sm text-muted-foreground">Real-time Socket.IO dispatch monitor & queue feed</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => apiClient.post(`/campaigns/${campaignId}/pause`)}>
            <Pause className="mr-1.5 h-4 w-4" /> Pause Campaign
          </Button>
          <Button variant="danger" onClick={() => apiClient.post(`/campaigns/${campaignId}/stop`)}>
            <Square className="mr-1.5 h-4 w-4" /> Stop Campaign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border text-center">
          <Send className="h-6 w-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{stats.sent}</p>
          <p className="text-xs text-muted-foreground">Messages Sent</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border text-center">
          <CheckCheck className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{stats.delivered}</p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border text-center">
          <Eye className="h-6 w-6 text-cyanAccent mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{stats.read}</p>
          <p className="text-xs text-muted-foreground">Read (Blue Ticks)</p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border text-center">
          <AlertTriangle className="h-6 w-6 text-rose-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{stats.failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      <Card className="space-y-3">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-foreground">Overall Campaign Progress ({pct}%)</span>
          <span className="text-primary">{stats.sent} / {campaign?.totalContacts || 1} Contacts</span>
        </div>
        <div className="h-3 w-full rounded-full bg-accent overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" /> Real-Time Live Message Feed Stream
          </h3>
          <Badge variant="success">Socket.IO Connected</Badge>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {logs.map((log: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-accent/20 text-xs">
              <div className="flex items-center gap-3">
                <CheckCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="font-bold text-foreground">{log.phone}</span>
                  <p className="text-[11px] text-muted-foreground">Status: {log.status || 'sent'}</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{log.updatedAt || 'Just now'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
