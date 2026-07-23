'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { MessageSquare, UserCheck, Clock, CheckCircle2 } from 'lucide-react';

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auto-reply/sessions/active');
      setSessions(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load active sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHandover = async (sessionId: string) => {
    try {
      await apiClient.post(`/auto-reply/sessions/${sessionId}/handover`);
      toast.success('Session handed over to human support agent');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to handover session');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Active Bot Sessions & Human Handover</h1>
        <p className="text-sm text-muted-foreground">Monitor ongoing automated user sessions and take over conversations seamlessly.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max">
        <Link href="/auto-reply" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Keyword Rules
        </Link>
        <Link href="/auto-reply/flows" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Conversation Flows
        </Link>
        <Link href="/auto-reply/sessions" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-card text-foreground shadow-sm">
          Active Sessions
        </Link>
        <Link href="/auto-reply/ai" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          AI & RAG Config
        </Link>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((s) => (
          <Card key={s._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">{s.phone}</h3>
                  <Badge variant={s.status === 'handedOver' ? 'purple' : 'success'}>
                    {s.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last interaction: {new Date(s.lastInteractionAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            {s.status !== 'handedOver' && (
              <Button size="sm" onClick={() => handleHandover(s._id)} className="bg-purple-600 hover:bg-purple-700">
                <UserCheck className="mr-1.5 h-4 w-4" /> Handover to Human Agent
              </Button>
            )}
          </Card>
        ))}

        {sessions.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            No active bot sessions currently in progress.
          </Card>
        )}
      </div>
    </div>
  );
}
