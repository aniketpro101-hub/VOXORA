'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Key, Plus, Trash2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function OptOutKeywordsPage() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [language, setLanguage] = useState('english');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKeywords();
  }, []);

  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/blacklist/keywords');
      setKeywords(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load opt-out keywords');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error('Please enter a keyword');
      return;
    }

    try {
      await apiClient.post('/blacklist/keywords', {
        keyword: newKeyword.trim(),
        language,
        category: 'opt_out',
      });
      toast.success('Custom Opt-Out Keyword Added!');
      setNewKeyword('');
      fetchKeywords();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add keyword');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-500 mb-2">
          <Key className="h-4 w-4" /> Multi-Language Opt-Out Dictionary
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Opt-Out & Detection Keywords</h1>
        <p className="text-sm text-muted-foreground">Manage auto-ban trigger words in English, Hindi, and Marathi.</p>
      </div>

      {/* Add Keyword Card */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">Add Custom Trigger Keyword</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="e.g. close krdo, don't message" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} className="flex-1" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 rounded-xl border border-border bg-card px-3 text-xs text-foreground focus:outline-none"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi (हिंदी)</option>
            <option value="marathi">Marathi (मराठी)</option>
          </select>
          <Button onClick={handleAddKeyword} className="bg-amber-600 hover:bg-amber-700">
            <Plus className="mr-1.5 h-4 w-4" /> Add Keyword
          </Button>
        </div>
      </Card>

      {/* Existing Keywords Tag Cloud */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">Active Opt-Out Keywords ({keywords.length})</h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw) => (
            <div key={kw._id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-accent/30 text-xs font-bold text-foreground">
              <span>{kw.keyword}</span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {kw.language}
              </Badge>
            </div>
          ))}

          {keywords.length === 0 && (
            <p className="text-xs text-muted-foreground">Default keywords active: stop, unsubscribe, cancel, opt out, band karo, ruk jao, nahi chahiye.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
