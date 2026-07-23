'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { KeyRound, Plus, Copy, Download, RefreshCw, ShieldAlert, Monitor, UserCheck } from 'lucide-react';

export default function AdminKeysPage() {
  const [data, setData] = useState<any>({ stats: {}, keys: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [assignName, setAssignName] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/license/admin/keys');
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load license keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKeys = async () => {
    try {
      await apiClient.post('/license/admin/generate', { count: 10, adminNotes: 'Testing Batch' });
      toast.success('Generated 10 New VOXORA License Keys!');
      fetchKeys();
    } catch (err) {
      toast.error('Failed to generate keys');
    }
  };

  const handleAssignName = async (id: string) => {
    const name = assignName[id];
    if (!name) return;
    try {
      await apiClient.put(`/license/admin/assign/${id}`, { assignedTo: name });
      toast.success(`Key assigned to ${name}`);
      fetchKeys();
    } catch (err) {
      toast.error('Failed to assign key');
    }
  };

  const handleExtendKey = async (id: string) => {
    try {
      await apiClient.post(`/license/admin/extend/${id}`, { days: 30 });
      toast.success('License extended by 30 days');
      fetchKeys();
    } catch (err) {
      toast.error('Failed to extend license');
    }
  };

  const handleResetHWID = async (id: string) => {
    try {
      await apiClient.post(`/license/admin/reset-pc/${id}`);
      toast.success('Hardware ID unbound. Key ready for new PC!');
      fetchKeys();
    } catch (err) {
      toast.error('Failed to reset PC binding');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await apiClient.post(`/license/admin/revoke/${id}`);
      toast.error('License key revoked');
      fetchKeys();
    } catch (err) {
      toast.error('Failed to revoke key');
    }
  };

  const handleExportExcel = async () => {
    try {
      window.open('http://localhost:4000/api/license/admin/export', '_blank');
      toast.success('Exporting License Keys to Excel...');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const copyToClipboard = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    toast.success('Key copied to clipboard!');
  };

  const filteredKeys = (data.keys || []).filter(
    (k: any) =>
      k.key.toLowerCase().includes(search.toLowerCase()) ||
      (k.assignedTo && k.assignedTo.toLowerCase().includes(search.toLowerCase())) ||
      (k.boundPCName && k.boundPCName.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = data.stats || { total: 10, unused: 5, active: 3, expired: 2 };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <KeyRound className="h-4 w-4" /> Mr. Aniket Samant Admin Panel
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">License Key Manager</h1>
          <p className="text-sm text-muted-foreground">Generate, track, assign, extend, and bind hardware IDs for testing keys.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-1.5 h-4 w-4" /> Export Excel
          </Button>
          <Button onClick={handleGenerateKeys} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="mr-1.5 h-4 w-4" /> Generate 10 Keys
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Total Generated</span>
          <h3 className="text-2xl font-black text-foreground">{stats.total}</h3>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Unused (Ready)</span>
          <h3 className="text-2xl font-black text-blue-500">{stats.unused}</h3>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Active (Bound)</span>
          <h3 className="text-2xl font-black text-emerald-500">{stats.active}</h3>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold uppercase text-muted-foreground">Expired</span>
          <h3 className="text-2xl font-black text-rose-500">{stats.expired}</h3>
        </Card>
      </div>

      {/* Search Input */}
      <div className="w-full max-w-sm">
        <Input placeholder="Search key, user name, or PC..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {filteredKeys.map((k: any) => (
          <Card key={k._id} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-black text-purple-400">{k.key}</span>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(k.key)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {k.status === 'active' && <Badge variant="success">🟢 ACTIVE (30 DAYS)</Badge>}
                {k.status === 'unused' && <Badge variant="outline">⚪ UNUSED</Badge>}
                {k.status === 'expired' && <Badge variant="danger">🔴 EXPIRED</Badge>}
                {k.status === 'revoked' && <Badge variant="danger">🚫 REVOKED</Badge>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block font-bold">Assigned To:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    placeholder="Enter Friend Name..."
                    value={assignName[k._id] !== undefined ? assignName[k._id] : k.assignedTo || ''}
                    onChange={(e) => setAssignName({ ...assignName, [k._id]: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleAssignName(k._id)}>
                    Save
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground block font-bold">Bound Hardware:</span>
                <p className="text-foreground font-semibold mt-1 truncate">
                  <Monitor className="inline h-3.5 w-3.5 mr-1" /> {k.boundPCName || 'Not activated yet'}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground block font-bold">Expiration Date:</span>
                <p className="text-foreground font-semibold mt-1">
                  {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : '30 days after first use'}
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              <Button size="sm" variant="outline" className="text-emerald-500" onClick={() => handleExtendKey(k._id)}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Extend +30 Days
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleResetHWID(k._id)}>
                <Monitor className="mr-1.5 h-3.5 w-3.5" /> Reset PC Binding
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleRevokeKey(k._id)}>
                <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Revoke Key
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
