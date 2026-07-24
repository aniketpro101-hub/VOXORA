'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Camera, Send, RefreshCw, Palette, Image as ImageIcon, Sparkles, Clock, CheckCircle } from 'lucide-react';

const PRESET_COLORS = [
  '#25D366', // WhatsApp Green
  '#128C7E', // Dark Teal
  '#34B7F1', // Cyan Blue
  '#E542A3', // Vibrant Pink
  '#9B51E0', // Deep Purple
  '#F2994A', // Warm Amber
  '#EB5757', // Coral Red
  '#2D9CDB', // Ocean Blue
  '#27AE60', // Emerald
  '#000000', // Midnight Black
];

export default function WhatsAppStatusPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');

  // Text Status State
  const [statusText, setStatusText] = useState('');
  const [bgColor, setBgColor] = useState('#25D366');
  const [isPosting, setIsPosting] = useState(false);

  // Media Status State
  const [mediaUrl, setMediaUrl] = useState('');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    fetchConnectedInstances();
  }, []);

  const fetchConnectedInstances = async () => {
    try {
      const res = await apiClient.get('/instances');
      const list = (res.data?.data || []).filter((i: any) => i.status === 'open');
      setInstances(list);
      if (list.length > 0) {
        setSelectedInstanceId(list[0]._id);
      }
    } catch (e) {
      setInstances([]);
    }
  };

  const handlePostStatus = async () => {
    if (!selectedInstanceId) {
      toast.error('Please connect and select an active WhatsApp account first.');
      return;
    }

    if (activeTab === 'text' && !statusText.trim()) {
      toast.error('Please enter status message text');
      return;
    }

    if (activeTab === 'image' && !mediaUrl.trim()) {
      toast.error('Please provide image URL');
      return;
    }

    setIsPosting(true);
    try {
      await apiClient.post('/messages/post-status', {
        instanceId: selectedInstanceId,
        type: activeTab,
        text: activeTab === 'text' ? statusText : caption,
        mediaUrl: activeTab === 'image' ? mediaUrl : undefined,
        backgroundColor: bgColor,
      });

      toast.success('🎉 WhatsApp Status Posted Successfully to your Status/Stories tab!');
      setStatusText('');
      setMediaUrl('');
      setCaption('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post WhatsApp Status');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Camera className="h-8 w-8 text-primary" /> WhatsApp Status & Stories Composer
          </h1>
          <p className="text-sm text-muted-foreground">
            Publish text & media status updates directly to your WhatsApp Broadcast Status feed.
          </p>
        </div>

        {/* Account Selector */}
        {instances.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Post From:</span>
            <select
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
              className="bg-accent border border-border text-foreground font-bold text-xs rounded-xl p-2.5"
            >
              {instances.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  📱 {inst.name} (+{inst.phoneNumber})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Composer Card */}
      <Card className="p-6 space-y-6">
        {/* Tab Switcher */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('text')}
            className={`pb-3 px-4 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="h-4 w-4" /> Text Status
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`pb-3 px-4 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="h-4 w-4" /> Image Status
          </button>
        </div>

        {/* Text Status Editor & Live Canvas Preview */}
        {activeTab === 'text' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-muted-foreground">Status Message Text *</label>
                <textarea
                  rows={5}
                  placeholder="What's on your mind? Type your status story update..."
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background p-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Background Color Palette Presets */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-muted-foreground">Background Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        bgColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Status Live Screen Mockup */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-muted-foreground mb-2">Live WhatsApp Status Preview</p>
              <div
                className="w-56 h-96 rounded-3xl p-6 shadow-2xl flex flex-col justify-between text-white text-center transition-all duration-300 relative overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <div className="flex justify-between items-center text-[10px] opacity-75">
                  <span>VOXORA Status</span>
                  <span>Just Now</span>
                </div>
                <div className="font-bold text-base leading-relaxed break-words">
                  {statusText || 'Type status text to preview live...'}
                </div>
                <div className="text-[10px] opacity-75">
                  👁️ WhatsApp Broadcast
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Status Editor */}
        {activeTab === 'image' && (
          <div className="space-y-4 max-w-lg">
            <Input
              label="Image URL *"
              placeholder="e.g. https://yoursite.com/status-banner.jpg"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
            <Input
              label="Status Caption (Optional)"
              placeholder="Add caption text to image..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end">
          <Button
            onClick={handlePostStatus}
            isLoading={isPosting}
            className="bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white px-6"
          >
            <Send className="mr-2 h-4 w-4" /> Publish Status Story Now
          </Button>
        </div>
      </Card>
    </div>
  );
}
