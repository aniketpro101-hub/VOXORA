'use client';

import React, { useState, useEffect } from 'react';
import MessageTypeSelector, { MessageType } from '@/components/composer/MessageTypeSelector';
import MessageEditor from '@/components/composer/MessageEditor';
import MediaUploader from '@/components/composer/MediaUploader';
import ButtonBuilder, { ButtonItem } from '@/components/composer/ButtonBuilder';
import ListMenuBuilder, { ListMenuData } from '@/components/composer/ListMenuBuilder';
import CarouselBuilder, { CarouselCardItem } from '@/components/composer/CarouselBuilder';
import PhonePreview from '@/components/composer/PhonePreview';
import { SpintaxPreviewModal, TestMessageModal } from '@/components/composer/Modals';
import { Button } from '@/components/ui/button';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { toast } from 'sonner';
import { Send, Save, Eye, Sparkles } from 'lucide-react';

export default function ComposePage() {
  const [type, setType] = useState<MessageType>('text');
  const [text, setText] = useState('{Hi|Hello} {{name}}, welcome to VOXORA! Check our exclusive deals.');

  // Media
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [fileName, setFileName] = useState('');

  // Buttons
  const [buttons, setButtons] = useState<ButtonItem[]>([
    { id: 'b1', text: 'Buy Now 🛒', type: 'url', url: 'https://voxora.com' },
    { id: 'b2', text: 'Not Interested', type: 'reply' },
  ]);

  // List Menu
  const [listData, setListData] = useState<ListMenuData>({
    title: 'VOXORA Services Menu',
    description: 'Select an option below to get instant information',
    buttonText: 'View Options Menu',
    sections: [
      {
        title: 'Popular Plans',
        rows: [
          { id: 'r1', title: 'Enterprise Plan', description: 'Unlimited numbers & campaigns' },
          { id: 'r2', title: 'Starter Plan', description: 'Up to 5 WhatsApp numbers' },
        ],
      },
    ],
  });

  // Carousel
  const [carouselCards, setCarouselCards] = useState<CarouselCardItem[]>([
    { id: 'c1', title: 'Summer Special #1', body: 'Get 50% discount on all automation tools.' },
    { id: 'c2', title: 'CRM Lead Pipeline #2', body: 'Track hot leads with automated scoring.' },
  ]);

  // Modals state
  const [isSpintaxModalOpen, setIsSpintaxModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [instances, setInstances] = useState<InstanceData[]>([]);

  useEffect(() => {
    instanceApi.getInstances().then(setInstances).catch(() => {});
  }, []);

  const getCompiledPayload = () => {
    return {
      type,
      content: text,
      mediaUrl,
      mediaType,
      fileName,
      buttons,
      data: type === 'list' ? listData : { text, buttons },
      cards: carouselCards,
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Message Composer</h1>
          <p className="text-sm text-muted-foreground">
            Craft text, media, interactive buttons, list menus, and carousels with live WhatsApp preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => toast.success('Draft saved successfully!')}>
            <Save className="mr-1.5 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={() => setIsTestModalOpen(true)}>
            <Send className="mr-1.5 h-4 w-4" /> Send Test Message
          </Button>
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor & Builders (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Message Type Selector */}
          <MessageTypeSelector selectedType={type} onSelect={setType} />

          {/* Core Message Text Editor */}
          <MessageEditor
            text={text}
            onChange={setText}
            onOpenSpintaxPreview={() => setIsSpintaxModalOpen(true)}
          />

          {/* Media Attachment Builder */}
          {(type === 'media' || type === 'media_buttons') && (
            <MediaUploader
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              fileName={fileName}
              onUploadSuccess={(url, t, name) => {
                setMediaUrl(url);
                setMediaType(t);
                setFileName(name);
              }}
              onRemove={() => {
                setMediaUrl('');
                setFileName('');
              }}
            />
          )}

          {/* Interactive Button Builder */}
          {(type === 'buttons' || type === 'media_buttons') && (
            <ButtonBuilder buttons={buttons} onChange={setButtons} />
          )}

          {/* List Menu Builder */}
          {type === 'list' && <ListMenuBuilder data={listData} onChange={setListData} />}

          {/* Carousel Builder */}
          {type === 'carousel' && <CarouselBuilder cards={carouselCards} onChange={setCarouselCards} />}
        </div>

        {/* Right Column: Live Phone Preview (5 cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" /> Live WhatsApp Preview
              </span>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                Real-Time Render
              </span>
            </div>

            <PhonePreview
              type={type}
              text={text}
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              buttons={buttons}
              listData={listData}
              carouselCards={carouselCards}
            />
          </div>
        </div>
      </div>

      {/* SpinTax Preview Modal */}
      <SpintaxPreviewModal
        isOpen={isSpintaxModalOpen}
        text={text}
        onClose={() => setIsSpintaxModalOpen(false)}
      />

      {/* Test Message Modal */}
      <TestMessageModal
        isOpen={isTestModalOpen}
        instances={instances}
        messageData={getCompiledPayload()}
        onClose={() => setIsTestModalOpen(false)}
      />
    </div>
  );
}
