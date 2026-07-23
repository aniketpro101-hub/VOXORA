'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Link as LinkIcon, ExternalLink, Globe, MousePointer } from 'lucide-react';

export default function LinkTrackingPage() {
  const [clicks, setClicks] = useState<any[]>([]);

  useEffect(() => {
    fetchClicks();
  }, []);

  const fetchClicks = async () => {
    try {
      const res = await apiClient.get('/analytics/links');
      setClicks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load link click data');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
          <LinkIcon className="h-4 w-4" /> voxora.co Tracking Engine
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Link Click Tracking & Redirects</h1>
        <p className="text-sm text-muted-foreground">Monitor every URL click, IP location, and user device from your WhatsApp campaigns.</p>
      </div>

      {/* Clicks Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/50 border-b border-border font-bold text-foreground">
              <tr>
                <th className="p-3">Short URL</th>
                <th className="p-3">Destination URL</th>
                <th className="p-3">Clicked At</th>
                <th className="p-3 text-right">IP / Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clicks.map((item) => (
                <tr key={item._id} className="hover:bg-accent/20">
                  <td className="p-3 font-bold text-purple-400">{item.shortUrl}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-xs">{item.url}</td>
                  <td className="p-3 text-foreground">{new Date(item.clickedAt).toLocaleString()}</td>
                  <td className="p-3 text-right text-muted-foreground">{item.ipAddress || '192.168.1.1'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
