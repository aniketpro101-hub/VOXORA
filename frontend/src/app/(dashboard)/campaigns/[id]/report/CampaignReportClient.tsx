'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  Eye,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Download,
  ArrowLeft,
  Repeat,
  Edit3,
} from 'lucide-react';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];

export default function CampaignReportClient({ id }: { id: string }) {
  const [report, setReport] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [id]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const resReport = await apiClient.get(`/campaigns/${id}`);
      const resLogs = await apiClient.get(`/campaigns/${id}/logs`);
      setReport(resReport.data?.data || resReport.data);
      setLogs(resLogs.data?.data || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load campaign report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantResend = async () => {
    try {
      const res = await apiClient.post(`/campaigns/${id}/clone`, { name: `Resend - ${new Date().toLocaleTimeString()}` });
      const cloned = res.data?.data || res.data;
      if (cloned && cloned._id) {
        await apiClient.post(`/campaigns/${cloned._id}/start`);
        toast.success('🔄 Campaign duplicated & started successfully!');
        fetchReportData();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to resend campaign');
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const res = await apiClient.post(`/campaigns/${id}/retry-failed`);
      toast.success(res.data?.message || 'Retried failed messages');
      fetchReportData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to retry messages');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center text-muted-foreground animate-in fade-in">
        Loading campaign analytical report from database...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Campaign Report Not Found</h2>
        <p className="text-sm text-muted-foreground">The requested campaign does not exist or has been deleted.</p>
        <Link href="/campaigns">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns</Button>
        </Link>
      </div>
    );
  }

  const stats = report?.stats || {
    totalContacts: report.totalContacts || 0,
    sentCount: report.sentCount || 0,
    deliveredCount: report.deliveredCount || 0,
    readCount: report.readCount || 0,
    repliedCount: report.repliedCount || 0,
    failedCount: report.failedCount || 0,
  };

  const deliveryRate = stats.sentCount > 0 ? ((stats.deliveredCount / stats.sentCount) * 100).toFixed(1) : '0';
  const readRate = stats.deliveredCount > 0 ? ((stats.readCount / stats.deliveredCount) * 100).toFixed(1) : '0';
  const replyRate = stats.sentCount > 0 ? ((stats.repliedCount / stats.sentCount) * 100).toFixed(1) : '0';

  const pieData = [
    { name: 'Delivered', value: stats.deliveredCount },
    { name: 'Read', value: stats.readCount },
    { name: 'Replied', value: stats.repliedCount },
    { name: 'Failed', value: stats.failedCount },
  ].filter(d => d.value > 0);

  const failedLogs = logs.filter(l => l.status === 'failed');

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/campaigns" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns List
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" /> Campaign Analytics Report
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Campaign: <b className="text-foreground">{report.name}</b> • Status: <span className="uppercase text-emerald-400 font-bold">{report.status}</span>
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleInstantResend} className="text-emerald-400 border-emerald-500/30 font-bold">
            <Repeat className="mr-1.5 h-4 w-4" /> 🔄 Instant Resend
          </Button>

          <Link href={`/campaigns/quick?cloneFrom=${id}`}>
            <Button variant="outline" className="text-sky-400 border-sky-500/30 font-bold">
              <Edit3 className="mr-1.5 h-4 w-4" /> ✏️ Edit & Resend
            </Button>
          </Link>

          <Button variant="outline" onClick={() => window.print()} className="font-bold border-border">
            <Download className="mr-1.5 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Total Contacts</span>
            <Send className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats.totalContacts}</p>
          <p className="text-[11px] text-muted-foreground">Target Recipients</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Delivered</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{stats.deliveredCount}</p>
          <p className="text-[11px] text-muted-foreground">{deliveryRate}% Delivery Rate</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Read Messages</span>
            <Eye className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-purple-400">{stats.readCount}</p>
          <p className="text-[11px] text-muted-foreground">{readRate}% Read Rate</p>
        </Card>

        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Replies</span>
            <MessageSquare className="h-4 w-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-400">{stats.repliedCount}</p>
          <p className="text-[11px] text-muted-foreground">{replyRate}% Reply Rate</p>
        </Card>
      </div>

      {/* Chart Section */}
      {pieData.length > 0 && (
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-bold text-foreground">📊 Real-Time Message Breakdown</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', borderColor: '#334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Error / Failed Messages Log */}
      {stats.failedCount > 0 && (
        <Card className="p-5 space-y-4 border-rose-500/30 bg-rose-500/5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Failed Messages ({stats.failedCount})
            </h3>
            <Button
              size="sm"
              onClick={handleRetryFailed}
              disabled={retrying}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {retrying ? 'Retrying...' : 'Retry All Failed'}
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            {failedLogs.length > 0 ? (
              failedLogs.map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-card border border-border flex justify-between items-center">
                  <span className="font-mono font-bold text-foreground">{log.recipientPhone}</span>
                  <span className="text-rose-400 font-bold">{log.errorMessage || 'Dispatch Failure'}</span>
                  <span className="text-muted-foreground text-[11px]">{new Date(log.updatedAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Failed message count is recorded in stats log.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
