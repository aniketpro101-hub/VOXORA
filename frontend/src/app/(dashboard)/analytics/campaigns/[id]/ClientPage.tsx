'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { BarChart3, Download, DollarSign, Eye, MousePointer, MessageSquare, ArrowRight } from 'lucide-react';

export default function CampaignReportClientPage() {
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/analytics/campaigns/${id}`);
      setReport(res.data.data);
    } catch (err) {
      toast.error('Failed to load campaign analytics report');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-mono">Loading campaign analytics...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="outline" className="mb-2">Campaign Analytics Report</Badge>
          <h1 className="text-3xl font-extrabold text-foreground">{report?.campaign?.name || 'Campaign Report'}</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" /> Download PDF Report
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Messages Sent</span>
          <h3 className="text-2xl font-black text-foreground">{report?.metrics?.sent || 0}</h3>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Delivered</span>
          <h3 className="text-2xl font-black text-emerald-500">{report?.metrics?.delivered || 0}</h3>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Link Clicks</span>
          <h3 className="text-2xl font-black text-sky-400">{report?.metrics?.linkClicks || 0}</h3>
        </Card>
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">ROI Attribution</span>
          <h3 className="text-2xl font-black text-purple-400">₹{report?.metrics?.estimatedRevenue || 0}</h3>
        </Card>
      </div>
    </div>
  );
}
