'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Key, Plus, Copy, Code, Check } from 'lucide-react';

export default function APIKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await apiClient.get('/premium/api-keys');
      setKeys(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load API keys');
    }
  };

  const handleGenerateKey = async () => {
    try {
      await apiClient.post('/premium/api-keys', { name: 'Production API Key' });
      toast.success('New API Key Generated!');
      fetchKeys();
    } catch (err) {
      toast.error('Failed to generate key');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 mb-2">
            <Code className="h-4 w-4" /> Public REST API v1
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">API Keys & Outbound Webhooks</h1>
          <p className="text-sm text-muted-foreground">Authenticate external application requests to send WhatsApp messages programmatically.</p>
        </div>

        <Button onClick={handleGenerateKey} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-1.5 h-4 w-4" /> Generate New API Key
        </Button>
      </div>

      {/* Keys List */}
      <div className="space-y-4">
        {keys.map((k) => (
          <Card key={k._id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{k.name}</p>
              <p className="text-xs text-purple-400 font-mono mt-0.5">{k.key}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => toast.success('API Key Copied!')}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Key
            </Button>
          </Card>
        ))}

        {keys.length === 0 && <Card className="p-8 text-center text-muted-foreground">No active API keys generated yet.</Card>}
      </div>
    </div>
  );
}
