'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FlaskConical, Play, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ABTestPage() {
  const [testName, setTestName] = useState('Diwali Special Offer A/B Split');
  const [variantA, setVariantA] = useState('Hi {{name}}! Check out our Diwali special discount offer.');
  const [variantB, setVariantB] = useState('Hello {{name}}! Limited time Diwali deals available today!');

  const handleStartTest = () => {
    toast.success('A/B Test Launched! Sent to 20% sample audience (200 contacts).');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <FlaskConical className="h-4 w-4" /> A/B Split Testing Engine
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Message A/B Testing</h1>
          <p className="text-sm text-muted-foreground">Test multiple message variations on a sample group and automatically send the winning variant to the rest.</p>
        </div>

        <Button onClick={handleStartTest} className="bg-purple-600 hover:bg-purple-700">
          <Play className="mr-1.5 h-4 w-4" /> Launch A/B Test
        </Button>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center justify-between">
            <Badge variant="outline">VARIANT A</Badge>
            <span className="text-xs text-muted-foreground font-bold">100 Contacts (10%)</span>
          </div>
          <textarea
            rows={5}
            value={variantA}
            onChange={(e) => setVariantA(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none"
          />
        </Card>

        <Card className="p-6 space-y-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <Badge variant="success">VARIANT B (PREDICTED WINNER)</Badge>
            <span className="text-xs text-muted-foreground font-bold">100 Contacts (10%)</span>
          </div>
          <textarea
            rows={5}
            value={variantB}
            onChange={(e) => setVariantB(e.target.value)}
            className="w-full rounded-2xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none"
          />
        </Card>
      </div>

      {/* Completed Results Mock */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-bold text-foreground">Last Test Result: Variant B Winner (96.5% Confidence)</h3>
          </div>
          <Badge variant="success">APPLIED TO 800 CONTACTS</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Variant B achieved +100% higher reply rate (24% vs 12%).</p>
      </Card>
    </div>
  );
}
