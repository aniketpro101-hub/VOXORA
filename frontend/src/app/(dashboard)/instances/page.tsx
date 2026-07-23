'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Smartphone, RefreshCw, CheckCircle, AlertCircle, Loader2, QrCode, Plus, Trash2, X, Inbox } from 'lucide-react';

export default function WhatsAppInstancesPage() {
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

  useEffect(() => {
    fetchInstances();
  }, []);

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
      const maxAttempts = 60; // 60 attempts x 1.5s = 90 seconds scan window

      const pollQR = async () => {
        try {
          const qrRes = await apiClient.get(`/instances/${newInst._id}/qr`);
          const code = qrRes.data?.data?.qrCode;
          const connStatus = qrRes.data?.data?.status;

          // 1. Check if WhatsApp QR was scanned on mobile and session connected!
          if (connStatus === 'open') {
            setStatus('connected');
            clearInterval(timer);
            toast.success('✅ WhatsApp Connected Successfully!');
            fetchInstances();
            setTimeout(() => {
              setIsModalOpen(false);
            }, 2500);
            return;
          }

          // 2. Display / Update QR Code image if present
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

      // Poll immediately after 300ms
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Smartphone className="h-8 w-8 text-primary" /> WhatsApp Connected Accounts
          </h1>
          <p className="text-sm text-muted-foreground">Manage your connected WhatsApp accounts and monitor session status.</p>
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
            Scan QR code with your WhatsApp app to link your WhatsApp account and start sending bulk messages.
          </p>
          <Button onClick={handleOpenModal} className="bg-primary text-white font-bold">
            <Plus className="mr-1.5 h-4 w-4" /> Connect WhatsApp Account
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {instances.map((inst) => (
            <Card key={inst._id} className="p-5 space-y-4 hover:border-primary/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                    📱
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{inst.name}</h3>
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

              <div className="flex justify-between items-center pt-2 border-t border-border text-xs">
                <Button variant="outline" size="sm" onClick={() => fetchInstances()}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh Status
                </Button>
                <button onClick={() => handleDeleteInstance(inst._id)} className="text-rose-500 hover:text-rose-600 p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add WhatsApp Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            {/* Modal Header with Close Button */}
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
                <p className="text-xs text-muted-foreground">Closing window automatically...</p>
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
