'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Star, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  const templates = [
    { name: '🛒 E-commerce Welcome Offer', industry: 'ecommerce', usage: '12,456', rating: '4.9', text: 'Hi {{name}}! Welcome to our store. Enjoy 15% off your first purchase using code WELCOME15.' },
    { name: '🏘️ Real Estate Property Alert', industry: 'real_estate', usage: '8,234', rating: '4.8', text: 'Hi {{name}}, new luxury 3BHK apartments available in Mumbai starting at ₹1.2 Cr. Download PDF Brochure below.' },
    { name: '🎉 Diwali Special Festival Sale', industry: 'ecommerce', usage: '15,678', rating: '4.9', text: 'Happy Diwali {{name}}! 🎉 Celebrate with up to 50% discount on all items. Click Buy Now below.' },
    { name: '🎓 Course Enrollment Welcome', industry: 'education', usage: '6,450', rating: '4.7', text: 'Congratulations {{name}}! Your enrollment in Full-Stack Web Development is confirmed. Class starts Monday.' },
    { name: '🏥 Healthcare Appointment Reminder', industry: 'healthcare', usage: '9,120', rating: '4.9', text: 'Hi {{name}}, your appointment with Dr. Sharma is scheduled for tomorrow at 10:30 AM.' },
    { name: '🍔 Restaurant Weekend Offer', industry: 'restaurant', usage: '7,890', rating: '4.6', text: 'Hi {{name}}, enjoy a complimentary dessert on your weekend family dinner booking!' },
  ];

  const filtered = selectedIndustry === 'all' ? templates : templates.filter((t) => t.industry === selectedIndustry);

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
            <BookOpen className="h-4 w-4" /> 100+ Pre-Built Templates
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Message Templates Library</h1>
          <p className="text-sm text-muted-foreground">High-converting message templates tailored for E-commerce, Real Estate, Education, Healthcare, & SaaS.</p>
        </div>

        <Button className="bg-primary">
          <Plus className="mr-1.5 h-4 w-4" /> Create Custom Template
        </Button>
      </div>

      {/* Industry Filters */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max overflow-x-auto">
        {['all', 'ecommerce', 'real_estate', 'education', 'healthcare', 'restaurant'].map((ind) => (
          <button
            key={ind}
            onClick={() => setSelectedIndustry(ind)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
              selectedIndustry === ind ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {ind.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t, idx) => (
          <Card key={idx} className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{t.name}</h3>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="h-4 w-4 fill-amber-500" /> {t.rating}
              </div>
            </div>

            <p className="text-xs text-muted-foreground bg-accent/30 p-3 rounded-2xl font-mono">{t.text}</p>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-muted-foreground">Used {t.usage} times</span>
              <Button size="sm" variant="outline" onClick={() => toast.success('Template copied to message composer!')}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Use Template
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
