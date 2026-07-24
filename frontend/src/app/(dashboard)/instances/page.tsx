'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socketClient';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Smartphone,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Plus,
  Trash2,
  X,
  Inbox,
  ShieldAlert,
  Sliders,
  Calendar,
  Zap,
} from 'lucide-react';

const AGE_OPTIONS = [
  { label: '🆕 New (< 7 days)', value: 3, category: 'new', limit: '20 msgs/day' },
  { label: '👶 Young (1-2 weeks)', value: 10, category: 'young', limit: '50 msgs/day' },
  { label: '📈 Growing (2-4 weeks)', value: 21, category: 'growing', limit: '100 msgs/day' },
  { label: '✅ Established (1-3 months)', value: 60, category: 'established', limit: '200 msgs/day' },
  { label: '💪 Mature (3-6 months)', value: 120, category: 'mature', limit: '300 msgs/day' },
  { label: '👑 Veteran (6+ months)', value: 200, category: 'veteran', limit: '500 msgs/day' },
];

export default function WhatsAppInstancesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [loginMethod, setLoginMethod] = useState<'qr' | 'phone'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');

  // QR Modal Flow State
  const [activeInstance, setActiveInstance] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'creating' | 'fetching_qr' | 'ready' | 'connected' | 'timeout' | 'error'>('idle');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Phase B: Account Age Modal State
  const [ageModalInstance, setAgeModalInstance] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number>(3);
  const [exactDaysInput, setExactDaysInput] = useState<string>('');
  const [useExactDays, setUseExactDays] = useState(false);
  const [isAgeSaving, setIsAgeSaving] = useState(false);

  // Phase B: Admin Override Modal State
  const [overrideInstance, setOverrideInstance] = useState<any>(null);
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [customDailyLimit, setCustomDailyLimit] = useState<string>('500');
  const [customHourlyLimit, setCustomHourlyLimit] = useState<string>('50');
  const [customMinDelay, setCustomMinDelay] = useState<string>('15');
  const [customMaxDelay, setCustomMaxDelay] = useState<string>('45');
  const [isVerifiedEnterprise, setIsVerifiedEnterprise] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [isOverrideSaving, setIsOverrideSaving] = useState(false);

  useEffect(() => {
    fetchInstances();
  }, []);

  // Real-time socket updates for QR code & status
  useEffect(() => {
    if (!activeInstance) return;

    const socket = getSocket();
    if (activeInstance._id) socket.emit('join:instance', activeInstance._id);
    if (activeInstance.instanceId) socket.emit('join:instance', activeInstance.instanceId);

    const handleQrUpdated = (data: { id?: string; instanceId?: string; qrCode: string }) => {
      if (
        data.id === activeInstance._id ||
        data.instanceId === activeInstance._id ||
        data.instanceId === activeInstance.instanceId
      ) {
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setStatus('ready');
        }
      }
    };

    const handleStatusChanged = (data: { id?: string; instanceId?: string; status: string }) => {
      if (
        data.id === activeInstance._id ||
        data.instanceId === activeInstance._id ||
        data.instanceId === activeInstance.instanceId
      ) {
        if (data.status === 'open') {
          setStatus('connected');
          toast.success('✅ WhatsApp Connected Successfully!');
          fetchInstances();
          setTimeout(() => {
            setIsModalOpen(false);
            setAgeModalInstance(activeInstance);
          }, 1500);
        }
      }
    };

    socket.on('qrCode:updated', handleQrUpdated);
    socket.on('status:changed', handleStatusChanged);

    return () => {
      socket.off('qrCode:updated', handleQrUpdated);
      socket.off('status:changed', handleStatusChanged);
      if (activeInstance._id) socket.emit('leave:instance', activeInstance._id);
      if (activeInstance.instanceId) socket.emit('leave:instance', activeInstance.instanceId);
    };
  }, [activeInstance]);

  const fetchInstances = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/instances');
      setInstances(res.data?.data || []);
    } catch (err: any) {
      setInstances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setInstanceName(`WhatsApp Account ${instances.length + 1}`);
    setStatus('idle');
    setQrCode(null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleCreateInstance = async () => {
    const finalName = instanceName.trim() || `WhatsApp Account ${instances.length + 1}`;

    setStatus('creating');
    setCountdown(0);
    setError(null);

    const timer = setInterval(() => {
      setCountdown((prev) => prev + 1);
    }, 1000);

    try {
      const res = await apiClient.post('/instances', {
        name: finalName,
        loginMethod,
        phoneNumber,
      });

      const newInst = res.data?.data;
      if (!newInst || !newInst._id) {
        throw new Error('Server returned invalid instance response');
      }

      setActiveInstance(newInst);
      setStatus('fetching_qr');

      let attempts = 0;
      const maxAttempts = 60;

      const pollQR = async () => {
        try {
          const qrRes = await apiClient.get(`/instances/${newInst._id}/qr`);
          const code = qrRes.data?.data?.qrCode;
          const connStatus = qrRes.data?.data?.status;

          if (connStatus === 'open') {
            setStatus('connected');
            clearInterval(timer);
            toast.success('✅ WhatsApp Connected Successfully!');
            fetchInstances();
            setTimeout(() => {
              setIsModalOpen(false);
              setAgeModalInstance(newInst);
            }, 1500);
            return;
          }

          if (code) {
            setQrCode(code);
            setStatus('ready');
          }
        } catch (e: any) {
          console.warn('[QR Poll Warning]', e?.message);
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollQR, 1500);
        } else {
          setStatus('timeout');
          setError('QR code scan timed out. Please click Try Again to regenerate.');
          clearInterval(timer);
        }
      };

      setTimeout(pollQR, 300);
    } catch (err: any) {
      setStatus('error');
      setError(err?.response?.data?.message || err.message || 'Failed to generate QR code. Check connection.');
      clearInterval(timer);
    }
  };

  const handleDeleteInstance = async (id: string) => {
    try {
      await apiClient.delete(`/instances/${id}`);
      toast.success('Instance deleted successfully');
      fetchInstances();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete instance');
    }
  };

  // Phase B: Save Account Age
  const handleSaveAccountAge = async () => {
    if (!ageModalInstance) return;
    const finalDays = useExactDays && exactDaysInput ? parseInt(exactDaysInput, 10) : selectedDays;

    setIsAgeSaving(true);
    try {
      await apiClient.post(`/instances/${ageModalInstance._id}/age`, { days: finalDays });
      toast.success(`✅ Account age set to ${finalDays} days! Smart limits applied.`);
      setAgeModalInstance(null);
      fetchInstances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update account age');
    } finally {
      setIsAgeSaving(false);
    }
  };

  // Phase B: Open Admin Override Modal
  const handleOpenOverride = (inst: any) => {
    setOverrideInstance(inst);
    setOverrideEnabled(inst.adminOverride?.enabled || false);
    setCustomDailyLimit(inst.adminOverride?.customDailyLimit?.toString() || '500');
    setCustomHourlyLimit(inst.adminOverride?.customHourlyLimit?.toString() || '50');
    setCustomMinDelay(inst.adminOverride?.customMinDelay?.toString() || '15');
    setCustomMaxDelay(inst.adminOverride?.customMaxDelay?.toString() || '45');
    setIsVerifiedEnterprise(inst.adminOverride?.isVerifiedEnterprise || false);
    setOverrideReason(inst.adminOverride?.overrideReason || '');
    setShowOverrideWarning(false);
  };

  // Phase B: Submit Admin Override
  const handleSubmitOverride = async () => {
    if (!overrideInstance) return;

    if (overrideEnabled && !showOverrideWarning) {
      setShowOverrideWarning(true);
      return;
    }

    setIsOverrideSaving(true);
    try {
      await apiClient.post(`/instances/${overrideInstance._id}/override`, {
        enabled: overrideEnabled,
        customDailyLimit: parseInt(customDailyLimit, 10),
        customHourlyLimit: parseInt(customHourlyLimit, 10),
        customMinDelay: parseInt(customMinDelay, 10),
        customMaxDelay: parseInt(customMaxDelay, 10),
        isVerifiedEnterprise,
        overrideReason,
      });

      toast.success(`Admin override ${overrideEnabled ? 'enabled' : 'disabled'}!`);
      setOverrideInstance(null);
      fetchInstances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to apply admin override');
    } finally {
      setIsOverrideSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" /> WhatsApp Connected Accounts
          </h1>
          <p className="text-sm text-muted-foreground">Manage your connected WhatsApp accounts, monitor session health, and set account age safety limits.</p>
        </div>
        <Button onClick={handleOpenModal} className="bg-primary hover:bg-primary/90 text-white font-extrabold">
          <Plus className="mr-1.5 h-4 w-4" /> Add New WhatsApp
        </Button>
      </div>

      {/* Instance Cards Grid */}
      {loading ? (
        <Card className="p-12 text-center text-xs text-muted-foreground">
          Loading connected WhatsApp instances...
        </Card>
      ) : instances.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <h3 className="font-extrabold text-base text-foreground">No WhatsApp Accounts Connected</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Scan QR code with your WhatsApp app to link your WhatsApp account and start sending bulk messages safely.
          </p>
          <Button onClick={handleOpenModal} className="bg-primary text-white font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Connect WhatsApp Account
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {instances.map((inst) => {
            const dailyCap = inst.adminOverride?.enabled
              ? inst.adminOverride.customDailyLimit || inst.smartLimits?.dailyLimit || inst.dailyLimit
              : inst.smartLimits?.dailyLimit || inst.dailyLimit || 30;

            const currentDay = inst.smartLimits?.currentDayCount ?? inst.currentDayCount ?? 0;
            const usagePercent = Math.min(100, Math.round((currentDay / Math.max(1, dailyCap)) * 100));
            const category = inst.accountAge?.ageCategory || 'new';
            const ageDays = inst.accountAge?.days || 3;

            const isCircuitBreaker = inst.antibanHealth?.circuitBreakerActive;
            const isResting = inst.antibanHealth?.needsRest;

            return (
              <Card key={inst._id} className="p-5 space-y-4 hover:border-primary/50 transition-all relative overflow-hidden">
                {/* Admin Override Badge Indicator */}
                {inst.adminOverride?.enabled && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Admin Override Active
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                      📱
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        {inst.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">+{inst.phoneNumber || 'Not Linked'}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      inst.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {inst.status === 'open' ? '🟢 Connected' : '🟡 Offline'}
                  </span>
                </div>

                {/* Phase B: Account Age & Daily Limits Widget */}
                <div className="rounded-xl border border-border bg-accent/30 p-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-foreground">Age:</span>
                      <span className="font-bold text-foreground">{ageDays} days</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px] uppercase">
                      {category}
                    </span>
                  </div>

                  {/* Daily Quota Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                      <span>Daily Usage</span>
                      <span className="font-mono font-bold text-foreground">
                        {currentDay} / {dailyCap} msgs
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Health Status Indicator */}
                  <div className="flex items-center justify-between text-[10px] pt-1">
                    <span className="text-muted-foreground">Health Status:</span>
                    <span className="font-bold">
                      {isCircuitBreaker ? (
                        <span className="text-rose-400">🔴 Cooldown (463 Warning)</span>
                      ) : isResting ? (
                        <span className="text-amber-400">🟡 Resting Mode</span>
                      ) : (
                        <span className="text-emerald-400">🟢 Healthy (100%)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAgeModalInstance(inst)}
                      className="px-2 py-1 rounded-lg border border-border hover:bg-accent text-foreground text-[11px] font-semibold flex items-center gap-1"
                      title="Update Account Age"
                    >
                      <Calendar className="h-3 w-3 text-primary" /> Age
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenOverride(inst)}
                        className="px-2 py-1 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                        title="Admin Override Settings"
                      >
                        <Sliders className="h-3 w-3 text-amber-400" /> Override
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchInstances()}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                    <button onClick={() => handleDeleteInstance(inst._id)} className="text-rose-500 hover:text-rose-600 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Phase B: Post-QR Scan Account Age Onboarding Modal */}
      {ageModalInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-primary/40 bg-card p-6 shadow-2xl space-y-5 text-foreground">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground">Account Connected!</h2>
              <p className="text-xs text-muted-foreground">
                Help VOXORA optimize Anti-Ban safety limits — tell us how old this WhatsApp account is:
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedDays(opt.value);
                    setUseExactDays(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all text-xs space-y-1 ${
                    !useExactDays && selectedDays === opt.value
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-md'
                      : 'border-border bg-accent/30 text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <p className="font-bold text-foreground">{opt.label}</p>
                  <p className="text-[10px] text-primary/80 font-mono">{opt.limit}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={useExactDays}
                  onChange={(e) => setUseExactDays(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-semibold text-muted-foreground">I know the exact number of days</span>
              </label>

              {useExactDays && (
                <Input
                  type="number"
                  placeholder="e.g. 45 days"
                  value={exactDaysInput}
                  onChange={(e) => setExactDaysInput(e.target.value)}
                  className="font-mono text-xs"
                />
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAgeModalInstance(null)}
              >
                Skip / Default (3d)
              </Button>
              <Button
                onClick={handleSaveAccountAge}
                isLoading={isAgeSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
              >
                Save & Apply Limits
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phase B: Super-Admin Manual Override Modal */}
      {overrideInstance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-card p-6 shadow-2xl space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-extrabold text-amber-300 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-400" /> Super-Admin Manual Override
              </h3>
              <button onClick={() => setOverrideInstance(null)} className="p-1 rounded-xl text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {showOverrideWarning ? (
              <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-200 space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-8 w-8 text-amber-400 shrink-0" />
                  <div className="text-xs space-y-1">
                    <p className="font-extrabold text-sm text-amber-300">⚠️ Manual Override Confirmation</p>
                    <p className="text-amber-200/90">
                      Bypassing automated account age safety limits increases WhatsApp ban risk if sending cold campaigns.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowOverrideWarning(false)}>
                    Go Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSubmitOverride}
                    isLoading={isOverrideSaving}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    Confirm & Apply Override
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-accent/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideEnabled}
                    onChange={(e) => setOverrideEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <p className="font-bold text-foreground text-sm">Enable Manual Override</p>
                    <p className="text-muted-foreground text-[11px]">Bypass automatic age calculation and set custom daily/hourly quotas.</p>
                  </div>
                </label>

                {overrideEnabled && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Custom Daily Limit"
                        type="number"
                        value={customDailyLimit}
                        onChange={(e) => setCustomDailyLimit(e.target.value)}
                      />
                      <Input
                        label="Custom Hourly Limit"
                        type="number"
                        value={customHourlyLimit}
                        onChange={(e) => setCustomHourlyLimit(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Min Delay (seconds)"
                        type="number"
                        value={customMinDelay}
                        onChange={(e) => setCustomMinDelay(e.target.value)}
                      />
                      <Input
                        label="Max Delay (seconds)"
                        type="number"
                        value={customMaxDelay}
                        onChange={(e) => setCustomMaxDelay(e.target.value)}
                      />
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVerifiedEnterprise}
                        onChange={(e) => setIsVerifiedEnterprise(e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-500"
                      />
                      <div>
                        <p className="font-bold text-emerald-300">Verified Enterprise Number</p>
                        <p className="text-[10px] text-emerald-200/80">Applies Veteran Tier limits (500+ msgs/day) instantly.</p>
                      </div>
                    </label>

                    <Input
                      label="Reason for Override"
                      placeholder="e.g. Official company support phone number"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button variant="outline" onClick={() => setOverrideInstance(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitOverride} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                    Save Override Settings
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add WhatsApp QR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <QrCode className="h-6 w-6 text-primary" /> Connect WhatsApp Account
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === 'idle' && (
              <div className="space-y-4 text-xs">
                <Input
                  label="Instance Name *"
                  placeholder="e.g. My Business Support"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Login Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLoginMethod('qr')}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center ${
                        loginMethod === 'qr' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/30 text-muted-foreground'
                      }`}
                    >
                      📷 Scan QR Code
                    </button>
                    <button
                      onClick={() => setLoginMethod('phone')}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center ${
                        loginMethod === 'phone' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-accent/30 text-muted-foreground'
                      }`}
                    >
                      🔢 Phone Pairing Code
                    </button>
                  </div>
                </div>

                {loginMethod === 'phone' && (
                  <Input
                    label="Phone Number with Country Code"
                    placeholder="e.g. 919876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInstance} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                    Generate QR Code Now
                  </Button>
                </div>
              </div>
            )}

            {status === 'creating' && (
              <div className="text-center py-8 space-y-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                <p className="text-base font-bold text-foreground">Creating WhatsApp Instance...</p>
                <p className="text-xs text-muted-foreground">Initializing Baileys socket session</p>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {status === 'fetching_qr' && (
              <div className="text-center py-6 space-y-4">
                <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto" />
                <div>
                  <p className="text-base font-extrabold text-foreground">Generating QR Code... ({countdown}s)</p>
                  <p className="text-xs text-muted-foreground">Connecting Baileys engine (takes ~2-5s)</p>
                </div>
                <div className="w-64 h-64 bg-accent/40 rounded-2xl border border-border flex items-center justify-center mx-auto">
                  <div className="animate-pulse text-cyan-400 font-bold text-xs">Waiting for QR Data...</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {status === 'ready' && qrCode && (
              <div className="text-center py-4 space-y-4 animate-in fade-in">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto rounded-2xl border-2 border-primary shadow-lg" />
                <div>
                  <p className="text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-400" /> Waiting for WhatsApp Scan on Phone...
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Open WhatsApp → Linked Devices → Link a Device</p>
                </div>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel / Close
                </Button>
              </div>
            )}

            {status === 'connected' && (
              <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-400">✅ WhatsApp Connected Successfully!</h2>
                <p className="text-xs text-muted-foreground">Proceeding to Account Age configuration...</p>
                <Button onClick={() => setIsModalOpen(false)} className="bg-primary text-white font-bold w-full">
                  Done
                </Button>
              </div>
            )}

            {(status === 'timeout' || status === 'error') && (
              <div className="text-center py-6 space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <p className="text-amber-400 font-bold text-base">
                  {status === 'timeout' ? '⏳ Taking longer than expected...' : '❌ QR Generation Failed'}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">{error || 'Server error occurred while starting Baileys engine.'}</p>
                <div className="flex justify-center gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={handleCreateInstance} className="bg-primary text-white font-bold">
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
