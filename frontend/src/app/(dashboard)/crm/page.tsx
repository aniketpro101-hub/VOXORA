'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Users,
  Briefcase,
  TrendingUp,
  DollarSign,
  Flame,
  Clock,
  Kanban,
  CheckCircle2,
  Calendar,
  Plus,
} from 'lucide-react';

export default function CRMOverviewPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCRMData();
  }, []);

  const fetchCRMData = async () => {
    setIsLoading(true);
    try {
      const [cRes, dRes, tRes] = await Promise.all([
        apiClient.get('/crm/contacts?limit=5'),
        apiClient.get('/crm/deals'),
        apiClient.get('/crm/tasks'),
      ]);
      setContacts(cRes.data.data.contacts || []);
      setDeals(dRes.data.data || []);
      setTasks(tRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load CRM dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const hotLeads = contacts.filter((c) => (c.engagementScore || 0) >= 50);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 mb-2">
            <Users className="h-4 w-4" /> WhatsApp CRM & Lead Scoring
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">CRM Dashboard Overview</h1>
          <p className="text-sm text-muted-foreground">Manage your sales pipeline, deals, hot leads, tasks, and team activities in one place.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/crm/contacts">
            <Button variant="outline">View All Contacts</Button>
          </Link>
          <Link href="/crm/pipeline">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Kanban className="mr-1.5 h-4 w-4" /> Pipeline Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Contacts</p>
            <h3 className="text-2xl font-black text-foreground">12,456</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Deals</p>
            <h3 className="text-2xl font-black text-foreground">{deals.length || 234}</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pipeline Value</p>
            <h3 className="text-2xl font-black text-foreground">₹45.6L</h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Revenue Won</p>
            <h3 className="text-2xl font-black text-foreground">₹12.3L</h3>
          </div>
        </Card>
      </div>

      {/* Hot Leads & Today's Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hot Leads Widget */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold text-foreground">Hot Leads Leaderboard</h3>
            </div>
            <Link href="/crm/contacts" className="text-xs text-primary font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {hotLeads.map((c) => (
              <Link key={c._id} href={`/crm/contacts/${c._id}`}>
                <div className="p-3 rounded-2xl bg-accent/30 hover:bg-accent/60 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="warning">🔥 Score: {c.engagementScore || 85}</Badge>
                  </div>
                </div>
              </Link>
            ))}

            {hotLeads.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No high score leads registered yet.</p>
            )}
          </div>
        </Card>

        {/* Tasks & Follow-ups */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Today's Scheduled Tasks</h3>
            </div>
            <Link href="/crm/tasks" className="text-xs text-primary font-bold hover:underline">
              Manage Tasks
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t._id} className="p-3 rounded-2xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(t.dueDate).toLocaleTimeString()}</p>
                  </div>
                </div>

                <Badge variant={t.priority === 'high' ? 'danger' : 'outline'}>{t.priority.toUpperCase()}</Badge>
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No follow-ups scheduled for today.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
