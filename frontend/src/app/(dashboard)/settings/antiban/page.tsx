'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import {
  ShieldCheck,
  Zap,
  Clock,
  Coffee,
  Moon,
  Bot,
  Flame,
  AlertOctagon,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export default function AntibanSettingsPage() {
  const [protectionLevel, setProtectionLevel] = useState<'aggressive' | 'recommended' | 'safe' | 'ultrasafe' | 'custom'>('recommended');
  const [minDelay, setMinDelay] = useState(20);
  const [maxDelay, setMaxDelay] = useState(55);
  const [messagesPerBatch, setMessagesPerBatch] = useState(50);
  const [batchBreakDuration, setBatchBreakDuration] = useState(10);
  const [sleepModeEnabled, setSleepModeEnabled] = useState(true);
  const [sleepStartHour, setSleepStartHour] = useState(22);
  const [sleepEndHour, setSleepEndHour] = useState(8);
  const [typingSimulation, setTypingSimulation] = useState(true);
  const [onlinePresenceSimulation, setOnlinePresenceSimulation] = useState(true);
  const [readReceiptSimulation, setReadReceiptSimulation] = useState(true);
  const [warmupEnabled, setWarmupEnabled] = useState(true);
  const [spintaxRequired, setSpintaxRequired] = useState(true);
  const [pauseOnFailureRate, setPauseOnFailureRate] = useState(20);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/antiban/settings');
      const data = res.data.data;
      if (data) {
        setProtectionLevel(data.protectionLevel || 'recommended');
        setMinDelay(data.minDelay ?? 20);
        setMaxDelay(data.maxDelay ?? 55);
        setMessagesPerBatch(data.messagesPerBatch ?? 50);
        setBatchBreakDuration(data.batchBreakDuration ?? 10);
        setSleepModeEnabled(data.sleepModeEnabled ?? true);
        setSleepStartHour(data.sleepStartHour ?? 22);
        setSleepEndHour(data.sleepEndHour ?? 8);
        setTypingSimulation(data.typingSimulation ?? true);
        setOnlinePresenceSimulation(data.onlinePresenceSimulation ?? true);
        setReadReceiptSimulation(data.readReceiptSimulation ?? true);
        setWarmupEnabled(data.warmupEnabled ?? true);
        setSpintaxRequired(data.spintaxRequired ?? true);
        setPauseOnFailureRate(data.pauseOnFailureRate ?? 20);
      }
    } catch (err) {
      toast.error('Failed to load anti-ban settings');
    }
  };

  const handleApplyPreset = (level: 'aggressive' | 'recommended' | 'safe' | 'ultrasafe') => {
    setProtectionLevel(level);
    if (level === 'aggressive') {
      setMinDelay(10); setMaxDelay(25); setMessagesPerBatch(100); setBatchBreakDuration(5);
    } else if (level === 'recommended') {
      setMinDelay(20); setMaxDelay(55); setMessagesPerBatch(50); setBatchBreakDuration(10);
    } else if (level === 'safe') {
      setMinDelay(35); setMaxDelay(90); setMessagesPerBatch(30); setBatchBreakDuration(15);
    } else if (level === 'ultrasafe') {
      setMinDelay(60); setMaxDelay(180); setMessagesPerBatch(20); setBatchBreakDuration(20);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await apiClient.put('/antiban/settings', {
        protectionLevel,
        minDelay,
        maxDelay,
        messagesPerBatch,
        batchBreakDuration,
        sleepModeEnabled,
        sleepStartHour,
        sleepEndHour,
        typingSimulation,
        onlinePresenceSimulation,
        readReceiptSimulation,
        warmupEnabled,
        spintaxRequired,
        pauseOnFailureRate,
      });
      toast.success('Anti-Ban Protection Settings Saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 mb-2">
            <ShieldCheck className="h-4 w-4" /> VOXORA Smart Protection Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Anti-Ban Protection Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure human-behavior simulation algorithms, weighted random delays, and warmup limits to prevent WhatsApp blocks.
          </p>
        </div>

        <Button onClick={handleSave} isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Save Anti-Ban Settings
        </Button>
      </div>

      {/* Preset Level Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Protection Level Presets</CardTitle>
          <CardDescription>Select an automated speed & safety profile</CardDescription>
        </CardHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'aggressive', title: 'Aggressive', desc: 'Fast (10-25s)', badge: 'Higher Risk' },
            { id: 'recommended', title: 'Recommended', desc: 'Balanced (20-55s)', badge: 'RECOMMENDED' },
            { id: 'safe', title: 'Safe', desc: 'Slow (35-90s)', badge: 'Low Risk' },
            { id: 'ultrasafe', title: 'Ultra-Safe', desc: 'Very Slow (60-180s)', badge: 'Minimal Risk' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleApplyPreset(item.id as any)}
              className={`flex flex-col text-left p-4 rounded-2xl border transition-all ${
                protectionLevel === item.id
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500 shadow-md'
                  : 'border-border bg-card text-muted-foreground hover:bg-accent'
              }`}
            >
              <Badge variant={item.id === 'recommended' ? 'success' : 'outline'} className="w-max mb-2">
                {item.badge}
              </Badge>
              <span className="font-bold text-sm text-foreground">{item.title}</span>
              <span className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Delays & Breaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Message Delays (Weighted Random)</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Minimum Delay (seconds)"
              type="number"
              value={minDelay}
              onChange={(e) => setMinDelay(parseInt(e.target.value) || 10)}
            />
            <Input
              label="Maximum Delay (seconds)"
              type="number"
              value={maxDelay}
              onChange={(e) => setMaxDelay(parseInt(e.target.value) || 30)}
            />
            <p className="text-[11px] text-muted-foreground">
              ℹ️ Delays are generated with Gaussian-weighted randomness to mimic human typing rhythm.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Batch Breaks System</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Take a break after (messages)"
              type="number"
              value={messagesPerBatch}
              onChange={(e) => setMessagesPerBatch(parseInt(e.target.value) || 50)}
            />
            <Input
              label="Break Duration (minutes)"
              type="number"
              value={batchBreakDuration}
              onChange={(e) => setBatchBreakDuration(parseInt(e.target.value) || 10)}
            />
            <p className="text-[11px] text-muted-foreground">
              ☕ Breaks simulate a human stepping away for coffee between bulk batches.
            </p>
          </div>
        </Card>
      </div>

      {/* Sleep Mode & Human Behavior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-400" />
                <CardTitle className="text-base">Night Sleep Mode</CardTitle>
              </div>
              <input
                type="checkbox"
                checked={sleepModeEnabled}
                onChange={(e) => setSleepModeEnabled(e.target.checked)}
                className="h-5 w-5 rounded border-border accent-primary"
              />
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="Sleep Start Hour (24h format, e.g. 22 = 10 PM)"
              type="number"
              value={sleepStartHour}
              onChange={(e) => setSleepStartHour(parseInt(e.target.value) || 22)}
              disabled={!sleepModeEnabled}
            />
            <Input
              label="Sleep End Hour (24h format, e.g. 8 = 8 AM)"
              type="number"
              value={sleepEndHour}
              onChange={(e) => setSleepEndHour(parseInt(e.target.value) || 8)}
              disabled={!sleepModeEnabled}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyanAccent" />
              <CardTitle className="text-base">Human Behavior Simulation</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-bold text-foreground">Simulate Typing Indicator ("composing...")</span>
              <input
                type="checkbox"
                checked={typingSimulation}
                onChange={(e) => setTypingSimulation(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-bold text-foreground">Simulate Online Presence ("available")</span>
              <input
                type="checkbox"
                checked={onlinePresenceSimulation}
                onChange={(e) => setOnlinePresenceSimulation(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
              <span className="text-xs font-bold text-foreground">Simulate Reading Receipts (blue ticks)</span>
              <input
                type="checkbox"
                checked={readReceiptSimulation}
                onChange={(e) => setReadReceiptSimulation(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Number Warmup Schedule & Triggers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Number Warm-Up & Safety Triggers</CardTitle>
          </div>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-border bg-accent/20">
            <div>
              <p className="text-xs font-bold text-foreground">Enable Auto Warm-Up for New Numbers</p>
              <p className="text-[10px] text-muted-foreground">Gradually increases daily limits from 30 &rarr; 1000 msgs/day</p>
            </div>
            <input
              type="checkbox"
              checked={warmupEnabled}
              onChange={(e) => setWarmupEnabled(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl border border-border bg-accent/20">
            <div>
              <p className="text-xs font-bold text-foreground">Require SpinTax Variations</p>
              <p className="text-[10px] text-muted-foreground">Warns if sending identical template text to all contacts</p>
            </div>
            <input
              type="checkbox"
              checked={spintaxRequired}
              onChange={(e) => setSpintaxRequired(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
          </label>
        </div>
      </Card>
    </div>
  );
}
