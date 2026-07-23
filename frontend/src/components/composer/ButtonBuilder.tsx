'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Link as LinkIcon, Phone, MessageSquare } from 'lucide-react';

export interface ButtonItem {
  id: string;
  text: string;
  type: 'reply' | 'url' | 'call';
  url?: string;
  phone?: string;
}

interface ButtonBuilderProps {
  buttons: ButtonItem[];
  onChange: (buttons: ButtonItem[]) => void;
}

export default function ButtonBuilder({ buttons, onChange }: ButtonBuilderProps) {
  const [text, setText] = useState('');
  const [type, setType] = useState<'reply' | 'url' | 'call'>('reply');
  const [url, setUrl] = useState('');
  const [phone, setPhone] = useState('');

  const handleAddButton = () => {
    if (!text.trim()) return;
    if (buttons.length >= 3) return;

    const newBtn: ButtonItem = {
      id: `btn_${Date.now()}`,
      text: text.trim(),
      type,
      url: type === 'url' ? url.trim() : undefined,
      phone: type === 'call' ? phone.trim() : undefined,
    };

    onChange([...buttons, newBtn]);
    setText('');
    setUrl('');
    setPhone('');
  };

  const handleRemove = (id: string) => {
    onChange(buttons.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">
          Interactive Buttons ({buttons.length}/3)
        </label>
      </div>

      {/* Button List */}
      <div className="space-y-2">
        {buttons.map((b, idx) => (
          <div key={b.id} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2.5">
              {b.type === 'reply' && <MessageSquare className="h-4 w-4 text-primary" />}
              {b.type === 'url' && <LinkIcon className="h-4 w-4 text-cyanAccent" />}
              {b.type === 'call' && <Phone className="h-4 w-4 text-emerald-500" />}
              <div>
                <p className="text-xs font-bold text-foreground">{b.text}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {b.type} {b.url ? `(${b.url})` : b.phone ? `(${b.phone})` : ''}
                </p>
              </div>
            </div>
            <button onClick={() => handleRemove(b.id)} className="p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 rounded-lg">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Button Controls */}
      {buttons.length < 3 && (
        <div className="p-4 rounded-2xl border border-border bg-accent/20 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-muted-foreground">Type:</label>
            <div className="flex gap-1.5">
              {(['reply', 'url', 'call'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                    type === t ? 'bg-primary text-white' : 'bg-accent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Input placeholder="Button Label (e.g. Buy Now)" value={text} onChange={(e) => setText(e.target.value)} />

          {type === 'url' && (
            <Input placeholder="URL (e.g. https://google.com)" value={url} onChange={(e) => setUrl(e.target.value)} />
          )}

          {type === 'call' && (
            <Input placeholder="Phone Number (e.g. +91 9876543210)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          )}

          <Button type="button" size="sm" onClick={handleAddButton} className="w-full">
            <Plus className="mr-1.5 h-4 w-4" /> Add Button ({buttons.length + 1}/3)
          </Button>
        </div>
      )}
    </div>
  );
}
