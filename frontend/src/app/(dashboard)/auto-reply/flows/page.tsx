'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Play, ArrowDown, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function FlowBuilderPage() {
  const [flowName, setFlowName] = useState('Product Inquiry Lead Bot');
  const [nodes, setNodes] = useState([
    { id: 'n1', title: 'START: Trigger Keyword ("hi" | "price")', type: 'trigger' },
    { id: 'n2', title: 'MESSAGE: "Welcome! Choose a service option below"', type: 'message' },
    { id: 'n3', title: 'BUTTONS: [Products] [Pricing] [Talk to Agent]', type: 'buttons' },
  ]);

  const handleAddStep = () => {
    setNodes([
      ...nodes,
      { id: `n_${Date.now()}`, title: `STEP #${nodes.length + 1}: Send Interactive Response`, type: 'message' },
    ]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <GitBranch className="h-4 w-4" /> Visual Flow Builder
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{flowName}</h1>
          <p className="text-sm text-muted-foreground">Build conditional multi-step WhatsApp conversation trees with interactive buttons.</p>
        </div>

        <Button onClick={() => toast.success('Conversation flow saved successfully!')} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="mr-1.5 h-4 w-4" /> Save Conversation Flow
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max">
        <Link href="/auto-reply" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Keyword Rules
        </Link>
        <Link href="/auto-reply/flows" className="px-4 py-1.5 text-xs font-bold rounded-xl bg-card text-foreground shadow-sm">
          Conversation Flows
        </Link>
        <Link href="/auto-reply/sessions" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          Active Sessions
        </Link>
        <Link href="/auto-reply/ai" className="px-4 py-1.5 text-xs font-bold rounded-xl text-muted-foreground hover:text-foreground">
          AI & RAG Config
        </Link>
      </div>

      {/* Visual Flow Canvas */}
      <Card className="p-8 space-y-6 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-4">
          {nodes.map((node, idx) => (
            <React.Fragment key={node.id}>
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/10 shadow-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{node.title}</p>
                    <Badge variant="outline" className="text-[10px] uppercase mt-0.5">
                      {node.type} Node
                    </Badge>
                  </div>
                </div>
              </div>

              {idx < nodes.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="h-5 w-5 text-primary animate-bounce" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button variant="outline" onClick={handleAddStep}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Step Node to Flow
        </Button>
      </Card>
    </div>
  );
}
