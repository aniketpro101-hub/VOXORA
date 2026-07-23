'use client';

import React from 'react';
import { Type, Image, Radio, List, Images } from 'lucide-react';

export type MessageType = 'text' | 'media' | 'buttons' | 'media_buttons' | 'list' | 'carousel';

interface MessageTypeSelectorProps {
  selectedType: MessageType;
  onSelect: (type: MessageType) => void;
}

export default function MessageTypeSelector({ selectedType, onSelect }: MessageTypeSelectorProps) {
  const types = [
    { id: 'text' as MessageType, title: 'Text Only', desc: 'Standard WhatsApp text with SpinTax', icon: Type },
    { id: 'media' as MessageType, title: 'Text + Media', desc: 'Images, Videos, PDFs or Voice Notes', icon: Image },
    { id: 'buttons' as MessageType, title: 'Interactive Buttons', desc: 'Quick Reply, URL & Call buttons', icon: Radio },
    { id: 'media_buttons' as MessageType, title: 'Media + Buttons', desc: 'Combine Image with Action buttons', icon: Image },
    { id: 'list' as MessageType, title: 'Interactive List', desc: 'Structured dropdown menu list', icon: List },
    { id: 'carousel' as MessageType, title: 'Carousel Cards', desc: 'Swipeable cards with media & buttons', icon: Images },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {types.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedType === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
              isSelected
                ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary text-white' : 'bg-accent text-muted-foreground'}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <span className="font-bold text-sm text-foreground">{item.title}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
