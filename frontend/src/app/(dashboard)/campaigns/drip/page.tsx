'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, ArrowDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DripCampaignPage() {
  const [steps, setSteps] = useState([
    { day: 'Day 0 (Immediate)', title: 'Welcome Message + Product Brochure PDF' },
    { day: 'Day 2 (10:00 AM)', title: 'Product Demo Video Link' },
    { day: 'Day 5 (10:00 AM)', title: 'Special 20% Discount Offer' },
    { day: 'Day 7 (10:00 AM)', title: 'Customer Testimonials & Social Proof' },
  ]);

  const handleAddStep = () => {
    setSteps([...steps, { day: `Day ${steps.length * 3}`, title: 'Follow-up Check-in Message' }]);
    toast.success('Drip sequence step added');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 mb-2">
            <Calendar className="h-4 w-4" /> Multi-Day Automated Sequences
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Welcome Drip Series</h1>
          <p className="text-sm text-muted-foreground">Automated multi-day drip campaigns triggered when contacts enter a specific lifecycle stage.</p>
        </div>

        <Button onClick={() => toast.success('Drip campaign activated!')} className="bg-emerald-600 hover:bg-emerald-700">
          Activate Drip Sequence
        </Button>
      </div>

      {/* Timeline steps */}
      <Card className="p-8 flex flex-col items-center space-y-4">
        <div className="w-full max-w-lg space-y-4">
          {steps.map((st, idx) => (
            <React.Fragment key={idx}>
              <div className="p-4 rounded-2xl border border-border bg-accent/20 flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="mb-1">{st.day}</Badge>
                  <p className="text-sm font-bold text-foreground">{st.title}</p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="h-4 w-4 text-primary animate-bounce" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button variant="outline" onClick={handleAddStep}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Sequence Step
        </Button>
      </Card>
    </div>
  );
}
