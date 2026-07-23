'use client';

import React, { useState } from 'react';
import { MessageType } from './MessageTypeSelector';
import { ButtonItem } from './ButtonBuilder';
import { ListMenuData } from './ListMenuBuilder';
import { CarouselCardItem } from './CarouselBuilder';
import { SpintaxProcessor } from '@/lib/spintaxHelper';
import { CheckCheck, Smartphone, ExternalLink, PhoneCall, Image, FileText, Music, List, Video } from 'lucide-react';

interface PhonePreviewProps {
  type: MessageType;
  text: string;
  mediaUrl?: string;
  mediaType?: string;
  buttons: ButtonItem[];
  listData: ListMenuData;
  carouselCards: CarouselCardItem[];
}

export default function PhonePreview({
  type,
  text,
  mediaUrl,
  mediaType,
  buttons,
  listData,
  carouselCards,
}: PhonePreviewProps) {
  const [device, setDevice] = useState<'ios' | 'android'>('ios');

  // Preview data compiled sample
  const sampleContact = { name: 'Rahul Sharma', city: 'Mumbai', company: 'Acme Corp' };
  const previewText = SpintaxProcessor.compileMessage(text || 'Hello {{name}}, welcome to VOXORA!', sampleContact);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Device Switcher */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-accent border border-border text-xs">
        <button
          type="button"
          onClick={() => setDevice('ios')}
          className={`px-3 py-1 font-bold rounded-lg ${device === 'ios' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          iPhone
        </button>
        <button
          type="button"
          onClick={() => setDevice('android')}
          className={`px-3 py-1 font-bold rounded-lg ${device === 'android' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
        >
          Android
        </button>
      </div>

      {/* Realistic Mobile Frame */}
      <div className="relative w-full max-w-[320px] h-[580px] rounded-[40px] border-[8px] border-slate-800 bg-[#0B141A] shadow-2xl overflow-hidden flex flex-col">
        {/* Notch / Dynamic Island */}
        <div className="mx-auto mt-2 h-4 w-28 rounded-full bg-slate-900" />

        {/* WhatsApp Header */}
        <div className="flex items-center gap-3 bg-[#1F2C34] px-4 py-2.5 text-white border-b border-slate-700/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
            V
          </div>
          <div>
            <p className="text-xs font-bold leading-tight">VOXORA Business</p>
            <p className="text-[10px] text-emerald-400">Online</p>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Incoming Sample Date */}
          <div className="mx-auto w-max rounded-lg bg-[#182229] px-2.5 py-0.5 text-[10px] font-semibold text-slate-400">
            TODAY
          </div>

          {/* Outgoing Message Bubble */}
          <div className="ml-auto max-w-[90%] rounded-2xl bg-[#005C4B] p-3 text-white shadow-md space-y-2 relative">
            {/* Media Attachment */}
            {(type === 'media' || type === 'media_buttons') && (
              <div className="rounded-xl overflow-hidden bg-black/30 p-2">
                {mediaUrl && mediaType === 'image' ? (
                  <img src={mediaUrl} alt="Media Preview" className="w-full h-32 object-cover rounded-lg" />
                ) : (
                  <div className="flex items-center gap-2 p-3 text-xs">
                    {mediaType === 'video' ? <Video className="h-5 w-5 text-purple-300" /> : <FileText className="h-5 w-5 text-amber-300" />}
                    <span className="truncate">{mediaUrl || 'Attachment'}</span>
                  </div>
                )}
              </div>
            )}

            {/* Carousel Cards */}
            {type === 'carousel' && carouselCards.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {carouselCards.map((card, i) => (
                  <div key={i} className="min-w-[180px] bg-[#1F2C34] rounded-xl p-2 text-white border border-slate-700 text-xs">
                    {card.image && <img src={card.image} alt={card.title} className="h-20 w-full object-cover rounded-lg mb-1.5" />}
                    <p className="font-bold truncate">{card.title}</p>
                    <p className="text-[10px] text-slate-300 line-clamp-2">{card.body}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Message Text */}
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{previewText}</p>

            {/* List Menu Button Preview */}
            {type === 'list' && (
              <div className="mt-2 border-t border-emerald-600/60 pt-2 text-center">
                <div className="inline-flex items-center justify-center gap-1.5 w-full bg-[#1F2C34] py-1.5 rounded-lg text-xs font-bold text-emerald-400">
                  <List className="h-3.5 w-3.5" />
                  <span>{listData.buttonText || 'Select Option'}</span>
                </div>
              </div>
            )}

            {/* Interactive Buttons */}
            {(type === 'buttons' || type === 'media_buttons') && buttons.length > 0 && (
              <div className="mt-2 border-t border-emerald-600/60 pt-1 space-y-1">
                {buttons.map((btn) => (
                  <div key={btn.id} className="flex items-center justify-center gap-1.5 py-1 bg-[#1F2C34] rounded-lg text-xs font-semibold text-emerald-400 text-center">
                    {btn.type === 'url' && <ExternalLink className="h-3 w-3" />}
                    {btn.type === 'call' && <PhoneCall className="h-3 w-3" />}
                    <span>{btn.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer & Ticks */}
            <div className="flex items-center justify-end gap-1 text-[9px] text-slate-300 pt-1">
              <span>{timeStr}</span>
              <CheckCheck className="h-3 w-3 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
