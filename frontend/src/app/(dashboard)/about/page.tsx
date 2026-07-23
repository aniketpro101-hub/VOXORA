'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Send, Heart, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AboutVoxoraPage() {
  return (
    <div className="space-y-10 max-w-4xl mx-auto py-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
          <Sparkles className="h-4 w-4" /> OFFICIAL RELEASE v1.0.0
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">VOXORA</h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto font-medium">
          The World's Best Bulk WhatsApp Automation, Anti-Ban Protection & Complete CRM System.
        </p>
      </div>

      {/* Developer Card */}
      <Card className="p-8 border-primary/30 bg-primary/5 text-center space-y-6 shadow-xl">
        <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg">
          AS
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">Mr. Aniket Samant</h2>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Creator & Lead Architect</p>
        </div>

        <div className="flex justify-center items-center gap-3">
          <a href="https://t.me/actasiff" target="_blank" rel="noopener noreferrer">
            <Button className="bg-sky-500 hover:bg-sky-600 text-white rounded-2xl px-6">
              <Send className="mr-2 h-4 w-4" /> Telegram: @actasiff
            </Button>
          </a>
        </div>

        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Designed and engineered with zero compromises, production-grade anti-ban safety algorithms, and high-performance multithreaded messaging queues.
        </p>
      </Card>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Card className="p-4 space-y-1">
          <h3 className="text-xl font-bold text-foreground">Phase 1-10</h3>
          <p className="text-[10px] text-muted-foreground">Full Core Engine</p>
        </Card>

        <Card className="p-4 space-y-1">
          <h3 className="text-xl font-bold text-emerald-500">100% Safe</h3>
          <p className="text-[10px] text-muted-foreground">Anti-Ban Engine</p>
        </Card>

        <Card className="p-4 space-y-1">
          <h3 className="text-xl font-bold text-purple-400">BullMQ</h3>
          <p className="text-[10px] text-muted-foreground">Redis Queue System</p>
        </Card>

        <Card className="p-4 space-y-1">
          <h3 className="text-xl font-bold text-amber-500">ChatGPT AI</h3>
          <p className="text-[10px] text-muted-foreground">Auto-Reply RAG</p>
        </Card>
      </div>
    </div>
  );
}
