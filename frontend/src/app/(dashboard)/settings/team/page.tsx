'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, ShieldCheck, UserCheck } from 'lucide-react';

export default function TeamManagementPage() {
  const members = [
    { name: 'Aniket Samant', email: 'aniket@example.com', role: 'owner', status: 'Active' },
    { name: 'Priya Patel', email: 'priya@example.com', role: 'manager', status: 'Active' },
    { name: 'Rahul Kumar', email: 'rahul@example.com', role: 'agent', status: 'Active' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Team Management</h1>
          <p className="text-sm text-muted-foreground">Invite team members and assign role-based access permissions.</p>
        </div>

        <Button className="bg-primary">
          <Plus className="mr-1.5 h-4 w-4" /> Invite Member
        </Button>
      </div>

      {/* Member List */}
      <div className="space-y-4">
        {members.map((m) => (
          <Card key={m.email} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                {m.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={m.role === 'owner' ? 'danger' : m.role === 'manager' ? 'warning' : 'outline'} className="uppercase">
                {m.role}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
