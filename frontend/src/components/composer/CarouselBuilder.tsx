'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Image } from 'lucide-react';

export interface CarouselCardItem {
  id: string;
  image?: string;
  title: string;
  body: string;
  footer?: string;
}

interface CarouselBuilderProps {
  cards: CarouselCardItem[];
  onChange: (cards: CarouselCardItem[]) => void;
}

export default function CarouselBuilder({ cards, onChange }: CarouselBuilderProps) {
  const handleAddCard = () => {
    if (cards.length >= 10) return;
    const newCard: CarouselCardItem = {
      id: `card_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: `Card #${cards.length + 1}`,
      body: 'Special offer body text...',
    };
    onChange([...cards, newCard]);
  };

  const handleRemove = (id: string) => {
    onChange(cards.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          Carousel Cards ({cards.length}/10)
        </label>
      </div>

      <div className="space-y-4">
        {cards.map((c, idx) => (
          <div key={c.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">Card #{idx + 1}</span>
              {cards.length > 1 && (
                <button onClick={() => handleRemove(c.id)} className="p-1 text-rose-500 hover:text-rose-600 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <Input
              label="Card Header Title"
              value={c.title}
              onChange={(e) => {
                const updated = [...cards];
                updated[idx].title = e.target.value;
                onChange(updated);
              }}
            />

            <Input
              label="Body Description"
              value={c.body}
              onChange={(e) => {
                const updated = [...cards];
                updated[idx].body = e.target.value;
                onChange(updated);
              }}
            />

            <Input
              label="Image URL"
              placeholder="https://example.com/banner.jpg"
              value={c.image || ''}
              onChange={(e) => {
                const updated = [...cards];
                updated[idx].image = e.target.value;
                onChange(updated);
              }}
            />
          </div>
        ))}
      </div>

      {cards.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={handleAddCard} className="w-full">
          <Plus className="mr-1.5 h-4 w-4" /> Add Carousel Card ({cards.length + 1}/10)
        </Button>
      )}
    </div>
  );
}
