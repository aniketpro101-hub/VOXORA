'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Sparkles,
  GitBranch,
  MessageSquare,
  Cpu,
  Check,
  X,
} from 'lucide-react';

export default function AutoReplyPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Rule Form
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('hi, hello, namaste, नमस्ते');
  const [matchType, setMatchType] = useState('any');
  const [replyType, setReplyType] = useState('text');
  const [replyText, setReplyText] = useState('Hello {{name}}! Welcome to our WhatsApp support bot. How can we assist you today?');
  const [priority, setPriority] = useState(1);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auto-reply/rules');
      setRules(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load auto-reply rules');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (id: string) => {
    try {
      await apiClient.patch(`/auto-reply/rules/${id}/toggle`);
      toast.success('Rule status toggled');
      fetchRules();
    } catch (err) {
      toast.error('Failed to toggle rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await apiClient.delete(`/auto-reply/rules/${id}`);
      toast.success('Rule deleted');
      fetchRules();
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  const handleCreateRule = async () => {
    if (!name.trim()) {
      toast.error('Rule name is required');
      return;
    }

    try {
      const kwArray = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      await apiClient.post('/auto-reply/rules', {
        name,
        keywords: kwArray,
        matchType,
        replyType,
        replyContent: replyText,
        priority,
      });

      toast.success('Auto-Reply Rule Created!');
      setIsModalOpen(false);
      setName('');
      fetchRules();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create rule');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <Bot className="h-4 w-4" /> AI & Keyword Bot Suite
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Auto-Reply Bot System</h1>
          <p className="text-sm text-muted-foreground">
            Configure multi-language keyword triggers, interactive button bots, multi-step conversation flows, and ChatGPT AI fallbacks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/auto-reply/flows">
            <Button variant="outline">
              <GitBranch className="mr-1.5 h-4 w-4" /> Visual Flow Builder
            </Button>
          </Link>
          <Link href="/auto-reply/ai">
            <Button variant="outline">
              <Cpu className="mr-1.5 h-4 w-4 text-purple-400" /> AI Settings
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Auto-Reply Rule
          </Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max">
        <Link href="/auto-reply" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-card text-foreground shadow-sm">
          Keyword Rules
        </Link>
        <Link href="/auto-reply/flows" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Conversation Flows
        </Link>
        <Link href="/auto-reply/sessions" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Active Sessions
        </Link>
        <Link href="/auto-reply/ai" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          AI & RAG Config
        </Link>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((r) => (
          <Card key={r._id} className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${r.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent text-muted-foreground'}`}>
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{r.name}</h3>
                    <Badge variant={r.isActive ? 'success' : 'outline'}>
                      {r.isActive ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                    <Badge variant="outline">Priority: #{r.priority}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Triggers: <span className="font-semibold text-primary">{r.keywords?.join(', ')}</span> | Match: <span className="capitalize">{r.matchType}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant={r.isActive ? 'outline' : 'primary'} onClick={() => handleToggleRule(r._id)}>
                  {r.isActive ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
                  {r.isActive ? 'Disable' : 'Enable'}
                </Button>
                <button onClick={() => handleDeleteRule(r._id)} className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-accent/30 text-xs font-medium text-foreground">
              💬 Reply: "{typeof r.replyContent === 'string' ? r.replyContent : r.replyContent?.text || 'Bot Reply'}"
            </div>
          </Card>
        ))}
      </div>

      {/* Modal for Creating New Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Create Auto-Reply Rule</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-muted-foreground hover:bg-accent rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input label="Rule Name *" placeholder="e.g. Greeting Bot" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Keywords (comma-separated) *" placeholder="hi, hello, namaste, नमस्ते" value={keywords} onChange={(e) => setKeywords(e.target.value)} />

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Match Algorithm</label>
                <select
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value)}
                  className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none"
                >
                  <option value="any">Contains Any Keyword</option>
                  <option value="exact">Exact Match</option>
                  <option value="starts_with">Starts With Keyword</option>
                  <option value="regex">Regex Pattern</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Reply Message Text</label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule}>Save Auto-Reply Rule</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
