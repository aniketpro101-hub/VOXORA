'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Kanban, Plus, DollarSign } from 'lucide-react';

export default function PipelineKanbanPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [deals, setDeals] = useState<any[]>([]);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      const [pRes, dRes] = await Promise.all([apiClient.get('/crm/pipelines'), apiClient.get('/crm/deals')]);
      setPipeline(pRes.data.data[0]);
      setDeals(dRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load sales pipeline board');
    }
  };

  const stages = pipeline?.stages || [
    { stageId: 's1', name: 'New Lead', color: '#3b82f6' },
    { stageId: 's2', name: 'Contacted', color: '#8b5cf6' },
    { stageId: 's3', name: 'Qualified', color: '#ec4899' },
    { stageId: 's4', name: 'Negotiation', color: '#f59e0b' },
    { stageId: 's5', name: 'Won', color: '#10b981' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{pipeline?.name || 'Sales Pipeline'}</h1>
          <p className="text-sm text-muted-foreground">Drag and drop deal opportunities across sales stages.</p>
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-1.5 h-4 w-4" /> Add Deal
        </Button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((st: any) => {
          const stageDeals = deals.filter((d) => d.stageId === st.stageId);
          return (
            <div key={st.stageId} className="space-y-3 min-w-[240px]">
              <div className="p-3 rounded-2xl bg-accent/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: st.color }} />
                  <span className="text-xs font-bold text-foreground">{st.name}</span>
                </div>
                <Badge variant="outline">{stageDeals.length}</Badge>
              </div>

              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <Card key={deal._id} className="p-4 space-y-2 hover:shadow-md transition-all">
                    <p className="text-sm font-bold text-foreground">{deal.name}</p>
                    <p className="text-xs text-emerald-500 font-bold">₹{deal.value?.toLocaleString() || 50000}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border">
                      <span>{deal.contactId?.name || 'Rahul Sharma'}</span>
                      <Badge variant="warning">🔥 85</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
