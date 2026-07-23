'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Calendar, Plus, CheckCircle2, Clock } from 'lucide-react';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await apiClient.get('/crm/tasks');
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load tasks');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Tasks & Scheduled Follow-ups</h1>
          <p className="text-sm text-muted-foreground">Track call reminders, proposal dispatches, and meeting follow-ups.</p>
        </div>

        <Button className="bg-primary">
          <Plus className="mr-1.5 h-4 w-4" /> New Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map((t) => (
          <Card key={t._id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{t.title}</p>
                <p className="text-xs text-muted-foreground">Due: {new Date(t.dueDate).toLocaleString()}</p>
              </div>
            </div>

            <Badge variant={t.priority === 'high' ? 'danger' : 'outline'}>{t.priority.toUpperCase()}</Badge>
          </Card>
        ))}

        {tasks.length === 0 && <Card className="p-12 text-center text-muted-foreground">No pending tasks for today.</Card>}
      </div>
    </div>
  );
}
