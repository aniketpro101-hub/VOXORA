'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Cpu, Save, Upload, FileText, CheckCircle2 } from 'lucide-react';

export default function AISettingsPage() {
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful customer support assistant for Voxora. Be polite, concise, professional, and reply in the same language as the customer.'
  );
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiClient
      .get('/auto-reply/ai-config')
      .then((res) => {
        const data = res.data.data;
        if (data) {
          setProvider(data.provider || 'openai');
          setApiKey(data.apiKey || '');
          setModel(data.model || 'gpt-4o-mini');
          setSystemPrompt(data.systemPrompt || systemPrompt);
          setIsActive(data.isActive ?? false);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveAIConfig = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/auto-reply/ai-config', {
        provider,
        apiKey,
        model,
        systemPrompt,
        isActive,
      });
      toast.success('AI Auto-Reply Configuration Saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save AI config');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <Cpu className="h-4 w-4" /> ChatGPT & RAG Knowledge Base
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">AI-Powered Auto-Reply Settings</h1>
          <p className="text-sm text-muted-foreground">
            Connect OpenAI ChatGPT, Anthropic Claude, or Google Gemini for smart contextual fallback responses.
          </p>
        </div>

        <Button onClick={handleSaveAIConfig} isLoading={isLoading} className="bg-purple-600 hover:bg-purple-700">
          <Save className="mr-1.5 h-4 w-4" /> Save AI Configuration
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max">
        <Link href="/auto-reply" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Keyword Rules
        </Link>
        <Link href="/auto-reply/flows" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Conversation Flows
        </Link>
        <Link href="/auto-reply/sessions" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Active Sessions
        </Link>
        <Link href="/auto-reply/ai" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-card text-foreground shadow-sm">
          AI & RAG Config
        </Link>
      </div>

      {/* Toggle Enable */}
      <Card className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Enable AI Fallback Engine</h3>
          <p className="text-xs text-muted-foreground">Automatically answers user queries when no keyword rules match.</p>
        </div>
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-6 w-6 accent-purple-500 rounded cursor-pointer"
        />
      </Card>

      {/* AI Configuration */}
      <Card space-y-4>
        <CardHeader>
          <CardTitle className="text-lg">AI Provider & Credentials</CardTitle>
          <CardDescription>Select model provider and enter API Key</CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'openai', title: 'OpenAI (ChatGPT)' },
              { id: 'anthropic', title: 'Anthropic (Claude)' },
              { id: 'gemini', title: 'Google Gemini' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id as any)}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all ${
                  provider === p.id ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>

          <Input label="API Key *" type="password" placeholder="sk-proj-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          <Input label="Model Name" value={model} onChange={(e) => setModel(e.target.value)} />

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">System Prompt (Bot Personality)</label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
