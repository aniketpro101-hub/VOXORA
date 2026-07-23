'use client';

import React, { useState, useEffect } from 'react';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getSocket } from '@/lib/socketClient';
import {
  QrCode,
  PhoneCall,
  CheckCircle2,
  RefreshCw,
  Copy,
  Smartphone,
  BatteryCharging,
  X,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface AddInstanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddInstanceModal({ isOpen, onClose, onSuccess }: AddInstanceModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loginMethod, setLoginMethod] = useState<'qr' | 'phone'>('qr');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [createdInstance, setCreatedInstance] = useState<InstanceData | null>(null);

  const [qrCode, setQrCode] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setName('');
      setPhoneNumber('');
      setCreatedInstance(null);
      setQrCode('');
      setPairingCode('');
      setCountdown(30);
    }
  }, [isOpen]);

  // Real-time socket updates for QR code & status
  useEffect(() => {
    if (!createdInstance?._id) return;

    const socket = getSocket();
    socket.emit('join:instance', createdInstance._id);

    const handleQrUpdated = (data: { instanceId: string; qrCode: string }) => {
      if (data.instanceId === createdInstance._id) {
        setQrCode(data.qrCode);
        setCountdown(30);
      }
    };

    const handlePairingGenerated = (data: { instanceId: string; code: string }) => {
      if (data.instanceId === createdInstance._id) {
        setPairingCode(data.code);
      }
    };

    const handleStatusChanged = (data: { instanceId: string; status: 'connecting' | 'open' | 'close' }) => {
      if (data.instanceId === createdInstance._id) {
        if (data.status === 'open') {
          setStep(3);
          toast.success('WhatsApp Connected Successfully!');
          onSuccess();
        }
      }
    };

    socket.on('qrCode:updated', handleQrUpdated);
    socket.on('pairingCode:generated', handlePairingGenerated);
    socket.on('status:changed', handleStatusChanged);

    return () => {
      socket.off('qrCode:updated', handleQrUpdated);
      socket.off('pairingCode:generated', handlePairingGenerated);
      socket.off('status:changed', handleStatusChanged);
      socket.emit('leave:instance', createdInstance._id);
    };
  }, [createdInstance, onSuccess]);

  // QR Countdown Timer
  useEffect(() => {
    if (step !== 2 || loginMethod !== 'qr' || !createdInstance) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRefreshQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, loginMethod, createdInstance]);

  const handleRefreshQR = async () => {
    if (!createdInstance?._id) return;
    try {
      const res = await instanceApi.refreshQR(createdInstance._id);
      if (res.qrCode) {
        setQrCode(res.qrCode);
        setCountdown(30);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Please enter an instance name');
      return;
    }
    if (loginMethod === 'phone' && !phoneNumber.trim()) {
      toast.error('Please enter phone number for pairing code');
      return;
    }

    setIsLoading(true);
    try {
      const inst = await instanceApi.createInstance({
        name,
        loginMethod,
        phoneNumber,
      });

      setCreatedInstance(inst);
      if (inst.qrCode) setQrCode(inst.qrCode);
      if (inst.pairingCode) setPairingCode(inst.pairingCode);

      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create instance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      toast.success('Pairing code copied to clipboard!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(1)}
                className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-foreground">Connect WhatsApp Number</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: CHOOSE METHOD & NAME */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-muted-foreground">Select Login Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLoginMethod('qr')}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                    loginMethod === 'qr'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <QrCode className="h-10 w-10 mb-2" />
                  <span className="font-bold text-sm text-foreground">Scan QR Code</span>
                  <span className="text-[11px] text-muted-foreground text-center mt-1">Fast & Easy scan with camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all ${
                    loginMethod === 'phone'
                      ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <PhoneCall className="h-10 w-10 mb-2" />
                  <span className="font-bold text-sm text-foreground">Phone Login</span>
                  <span className="text-[11px] text-muted-foreground text-center mt-1">8-digit pairing code</span>
                </button>
              </div>
            </div>

            <Input
              label="Instance / Business Name"
              placeholder="e.g. Sales Team #1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {loginMethod === 'phone' && (
              <Input
                label="WhatsApp Phone Number (with Country Code)"
                placeholder="e.g. +91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            )}

            <Button onClick={handleCreate} isLoading={isLoading} className="w-full">
              Continue to Connection
            </Button>
          </div>
        )}

        {/* STEP 2A: QR CODE FLOW */}
        {step === 2 && loginMethod === 'qr' && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <Badge variant="purple">Scan with Phone Camera</Badge>
              <h3 className="text-lg font-bold text-foreground">{name}</h3>
            </div>

            <div className="relative mx-auto flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/40 rounded-3xl bg-accent/30 max-w-[260px]">
              {qrCode ? (
                <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 rounded-xl shadow-md" />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 w-48">
                  <RefreshCw className="h-8 w-8 text-primary animate-spin mb-2" />
                  <span className="text-xs text-muted-foreground">Generating QR...</span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                <span>Auto-refreshing in {countdown}s</span>
              </div>
            </div>

            <div className="rounded-2xl bg-accent/50 p-4 text-left space-y-2 text-xs text-muted-foreground">
              <p className="font-bold text-foreground">Steps to Connect:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open WhatsApp on your phone</li>
                <li>Tap <strong>Settings → Linked Devices</strong></li>
                <li>Tap <strong>Link a Device</strong></li>
                <li>Point camera at this screen to scan QR code</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefreshQR} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" /> Force Refresh
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2B: PHONE PAIRING CODE FLOW */}
        {step === 2 && loginMethod === 'phone' && (
          <div className="space-y-6 text-center">
            <div className="space-y-1">
              <Badge variant="success">Phone Pairing Code</Badge>
              <h3 className="text-lg font-bold text-foreground">{name}</h3>
              <p className="text-xs text-muted-foreground">{phoneNumber}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-primary/40 rounded-3xl bg-primary/10 space-y-3">
              <span className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
                Enter Code in WhatsApp
              </span>
              <div className="text-3xl font-mono font-black tracking-widest text-primary bg-card px-6 py-3 rounded-2xl border border-border shadow-inner">
                {pairingCode || 'XXXX-XXXX'}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyCode}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Code
              </Button>
            </div>

            <div className="rounded-2xl bg-accent/50 p-4 text-left space-y-2 text-xs text-muted-foreground">
              <p className="font-bold text-foreground">Steps to Pair:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open WhatsApp on your mobile phone</li>
                <li>Tap <strong>Settings → Linked Devices</strong></li>
                <li>Tap <strong>Link a Device → Link with phone number</strong></li>
                <li>Enter the 8-character pairing code shown above</li>
              </ol>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS SCREEN */}
        {step === 3 && (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-foreground">WhatsApp Connected!</h3>
              <p className="text-xs text-muted-foreground">
                {createdInstance?.name} ({createdInstance?.phoneNumber || 'Active Session'}) is now live.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-accent/30 p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="success">OPEN / ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Battery Level:</span>
                <span className="font-bold text-foreground flex items-center gap-1">
                  <BatteryCharging className="h-4 w-4 text-emerald-500" /> 85%
                </span>
              </div>
            </div>

            <Button onClick={onClose} className="w-full">
              Done & Go to Numbers List
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
