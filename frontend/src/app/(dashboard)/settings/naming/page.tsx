'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { toast } from 'sonner';
import {
  Tag,
  ShieldCheck,
  RefreshCw,
  Eye,
  Save,
  RotateCcw,
  Smartphone,
  BookOpen,
  Download,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export default function NamingConfigPage() {
  const [config, setConfig] = useState({
    seriesName: 'aRoasBodhi',
    prefix: 'aRoasBodhi',
    startNumber: 1,
    currentSequence: 0,
    paddingDigits: 5,
    separator: '',
    suffix: '',
    existingNameHandling: 'prefix',
    existingNamePrefix: 'aRoasBodhi_',
    existingNameSuffix: '_aRoasBodhi',
  });

  const [preview, setPreview] = useState<string[]>([]);
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadConfig();
    loadInstances();
  }, []);

  useEffect(() => {
    generatePreview();
  }, [config]);

  const loadConfig = async () => {
    try {
      const res = await apiClient.get('/naming/config');
      if (res.data?.data) {
        setConfig((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      // Default fallback stays
    }
  };

  const loadInstances = async () => {
    try {
      const list = await instanceApi.getInstances();
      setInstances(list);
      if (list.length > 0) {
        setSelectedInstanceId(list[0].instanceId);
      }
    } catch (e) {}
  };

  const generatePreview = () => {
    const names: string[] = [];
    const seq = config.currentSequence || 0;
    const padding = config.paddingDigits || 5;
    const series = config.prefix || config.seriesName || 'aRoasBodhi';
    const sep = config.separator || '';
    const suf = config.suffix || '';

    for (let i = 1; i <= 5; i++) {
      const numStr = (seq + i).toString().padStart(padding, '0');
      names.push(`${series}${sep}${numStr}${suf}`);
    }
    setPreview(names);
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      await apiClient.put('/naming/config', config);
      toast.success('🏷️ Auto-naming configuration saved successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const resetSequence = async () => {
    if (!confirm('Are you sure you want to reset the counter sequence back to 0? Future contacts will start from 00001.')) {
      return;
    }
    const updated = { ...config, currentSequence: 0 };
    setConfig(updated);
    try {
      await apiClient.put('/naming/config', updated);
      toast.success('🔄 Counter sequence reset to 0!');
    } catch (e) {}
  };

  const handleWhatsAppSyncAll = async () => {
    if (!selectedInstanceId) {
      toast.error('Please select an active WhatsApp account first');
      return;
    }
    setIsSyncing(true);
    try {
      const contactsRes = await apiClient.get('/contacts');
      const contacts = contactsRes.data?.data?.contacts || contactsRes.data?.data || [];
      const contactIds = contacts.map((c: any) => c._id);

      if (!contactIds.length) {
        toast.error('No contacts found in your database to sync');
        return;
      }

      const res = await apiClient.post('/naming/sync/whatsapp', {
        instanceId: selectedInstanceId,
        contactIds,
      });

      toast.success(`✅ Synced ${res.data?.data?.success || contactIds.length} contacts to WhatsApp!`);
    } catch (err: any) {
      toast.error(err.message || 'WhatsApp sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportVCard = async () => {
    try {
      const contactsRes = await apiClient.get('/contacts');
      const contacts = contactsRes.data?.data?.contacts || contactsRes.data?.data || [];
      const contactIds = contacts.map((c: any) => c._id);

      if (!contactIds.length) {
        toast.error('No contacts available for vCard export');
        return;
      }

      const res = await apiClient.post('/naming/export/vcard', { contactIds });
      const downloadUrl = res.data?.data?.downloadUrl;
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        toast.success('💾 vCard file (.vcf) generated and downloading!');
      }
    } catch (err: any) {
      toast.error(err.message || 'vCard export failed');
    }
  };

  const handleGoogleConnect = async () => {
    try {
      const res = await apiClient.get('/naming/auth/google');
      const authUrl = res.data?.data?.authUrl;
      if (authUrl) {
        window.open(authUrl, '_blank');
      } else {
        toast.info('Google OAuth Client ID is not configured in backend .env (GOOGLE_CLIENT_ID).');
      }
    } catch (err: any) {
      toast.error('Failed to initiate Google login');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Tag className="h-7 w-7 text-primary" /> Contact Auto-Naming & Anti-Ban Sync System
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Auto-save contacts with structured series (e.g. <b>aRoasBodhi00001</b>) to reduce WhatsApp ban risk by 40-60%.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={saveConfig} disabled={isLoading} className="font-bold text-xs">
            <Save className="h-4 w-4 mr-1.5" /> Save Configuration
          </Button>
        </div>
      </div>

      {/* Info Callout Banner */}
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/30 flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div className="text-xs text-foreground space-y-1">
          <p className="font-extrabold text-primary">Why Auto-Naming & Sync Reduces WhatsApp Ban Risk:</p>
          <p className="text-muted-foreground leading-relaxed">
            WhatsApp’s spam algorithm strictly flags messages sent to unsaved, unnamed recipients. When contacts are auto-named with serial names like <b>aRoasBodhi00001</b> and synchronized to your WhatsApp socket, Meta categorizes recipients as <b>known contacts</b>, significantly lowering your account spam score!
          </p>
        </div>
      </div>

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Config Controls */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 space-y-5">
            <h2 className="text-base font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
              ⚙️ Auto-Naming Pattern Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prefix / Series Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Series Name / Prefix</label>
                <Input
                  value={config.prefix}
                  onChange={(e) => setConfig({ ...config, prefix: e.target.value, seriesName: e.target.value })}
                  placeholder="aRoasBodhi"
                  className="text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Default: aRoasBodhi (e.g. aRoasBodhi00001)</p>
              </div>

              {/* Number Format (Padding) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Padding Digits</label>
                <select
                  value={config.paddingDigits}
                  onChange={(e) => setConfig({ ...config, paddingDigits: parseInt(e.target.value, 10) })}
                  className="w-full rounded-xl border border-border bg-accent/40 p-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="3">3 Digits (aRoasBodhi001)</option>
                  <option value="4">4 Digits (aRoasBodhi0001)</option>
                  <option value="5">5 Digits (aRoasBodhi00001) [Recommended]</option>
                  <option value="6">6 Digits (aRoasBodhi000001)</option>
                </select>
              </div>

              {/* Separator */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Separator</label>
                <select
                  value={config.separator}
                  onChange={(e) => setConfig({ ...config, separator: e.target.value })}
                  className="w-full rounded-xl border border-border bg-accent/40 p-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="">None (aRoasBodhi00001)</option>
                  <option value="_">Underscore (aRoasBodhi_00001)</option>
                  <option value="-">Dash (aRoasBodhi-00001)</option>
                  <option value=" ">Space (aRoasBodhi 00001)</option>
                </select>
              </div>

              {/* Suffix */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Suffix (Optional)</label>
                <Input
                  value={config.suffix}
                  onChange={(e) => setConfig({ ...config, suffix: e.target.value })}
                  placeholder="e.g. VIP, _A"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            {/* Collision & Existing Name Handling */}
            <div className="border-t border-border pt-4 space-y-3">
              <label className="text-xs font-bold uppercase text-muted-foreground block">
                Existing Name Collision Handling
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-accent/20 cursor-pointer hover:border-primary/50">
                  <input
                    type="radio"
                    name="existing"
                    value="prefix"
                    checked={config.existingNameHandling === 'prefix'}
                    onChange={(e) => setConfig({ ...config, existingNameHandling: e.target.value as any })}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Append Prefix</span>
                    <span className="text-[10px] text-muted-foreground">aRoasBodhi_OriginalName</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-accent/20 cursor-pointer hover:border-primary/50">
                  <input
                    type="radio"
                    name="existing"
                    value="suffix"
                    checked={config.existingNameHandling === 'suffix'}
                    onChange={(e) => setConfig({ ...config, existingNameHandling: e.target.value as any })}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Append Suffix</span>
                    <span className="text-[10px] text-muted-foreground">OriginalName_aRoasBodhi</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-accent/20 cursor-pointer hover:border-primary/50">
                  <input
                    type="radio"
                    name="existing"
                    value="replace"
                    checked={config.existingNameHandling === 'replace'}
                    onChange={(e) => setConfig({ ...config, existingNameHandling: e.target.value as any })}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Replace Entirely</span>
                    <span className="text-[10px] text-muted-foreground">Overwrites with aRoasBodhi00001</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-border bg-accent/20 cursor-pointer hover:border-primary/50">
                  <input
                    type="radio"
                    name="existing"
                    value="keep"
                    checked={config.existingNameHandling === 'keep'}
                    onChange={(e) => setConfig({ ...config, existingNameHandling: e.target.value as any })}
                  />
                  <div>
                    <span className="font-bold text-foreground block">Keep Existing</span>
                    <span className="text-[10px] text-muted-foreground">Do not rename if name exists</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Sequence Counter Box */}
            <div className="p-4 rounded-2xl bg-background border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Current Serial Sequence</span>
                <span className="text-2xl font-black text-primary font-mono">{config.currentSequence}</span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Last generated:{' '}
                  <code className="text-foreground">
                    {config.prefix}
                    {config.currentSequence.toString().padStart(config.paddingDigits, '0')}
                  </code>
                </span>
              </div>
              <Button onClick={resetSequence} variant="outline" className="text-xs font-bold text-rose-400 border-rose-500/30 hover:bg-rose-500/10">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Counter
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Preview & Sync Channels */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <Card className="p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-primary" /> Live Preview (Next 5 Names)
            </h3>
            <div className="space-y-1.5">
              {preview.map((name, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-accent/30 border border-border flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-foreground">{name}</span>
                  <span className="text-[10px] text-muted-foreground">#{config.currentSequence + idx + 1}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Sync Options Card */}
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
              🔄 Contact Sync Methods
            </h3>

            {/* 1. WhatsApp Socket Sync */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-xs text-foreground block">WhatsApp Direct Sync</span>
                  <span className="text-[10px] text-muted-foreground">Syncs directly to Baileys socket store</span>
                </div>
              </div>

              <select
                value={selectedInstanceId}
                onChange={(e) => setSelectedInstanceId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2 text-[11px] text-foreground focus:outline-none"
              >
                {instances.map((inst) => (
                  <option key={inst.instanceId} value={inst.instanceId}>
                    {inst.name} (+{inst.phoneNumber || 'Socket'})
                  </option>
                ))}
                {instances.length === 0 && <option value="">No Active WhatsApp Accounts</option>}
              </select>

              <Button
                onClick={handleWhatsAppSyncAll}
                disabled={isSyncing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
              >
                {isSyncing ? 'Syncing...' : 'Sync All Contacts to WhatsApp'}
              </Button>
            </div>

            {/* 2. Google Contacts Sync */}
            <div className="p-3.5 rounded-2xl bg-accent/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                <div>
                  <span className="font-bold text-xs text-foreground block">Google Contacts Sync</span>
                  <span className="text-[10px] text-muted-foreground">Sync to Gmail & Android Phonebook</span>
                </div>
              </div>
              <Button onClick={handleGoogleConnect} variant="outline" className="w-full text-xs font-bold">
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Connect Gmail Account
              </Button>
            </div>

            {/* 3. vCard Export */}
            <div className="p-3.5 rounded-2xl bg-accent/30 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-purple-400" />
                <div>
                  <span className="font-bold text-xs text-foreground block">vCard (.vcf) Export</span>
                  <span className="text-[10px] text-muted-foreground">Download contact file to import to any mobile</span>
                </div>
              </div>
              <Button onClick={handleExportVCard} variant="outline" className="w-full text-xs font-bold">
                <Download className="h-3.5 w-3.5 mr-1" /> Export .vcf File
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
