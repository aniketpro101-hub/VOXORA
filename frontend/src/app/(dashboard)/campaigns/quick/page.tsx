'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MessageEditor from '@/components/composer/MessageEditor';
import MediaUploader, { AttachmentItem } from '@/components/composer/MediaUploader';
import TemplateManager, { SavedTemplate } from '@/components/composer/TemplateManager';
import ButtonBuilder, { ButtonItem } from '@/components/composer/ButtonBuilder';
import ListMenuBuilder, { ListMenuData } from '@/components/composer/ListMenuBuilder';
import ContactInfoSection from '@/components/campaigns/ContactInfoSection';
import { parseNumbersFromText } from '@/lib/phoneNormalizer';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Zap, ShieldCheck, AlertTriangle, Eye, Smartphone } from 'lucide-react';

function QuickCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom');

  // Selected Instance
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');

  // Contacts
  const [phoneText, setPhoneText] = useState('');
  const [defaultCountry, setDefaultCountry] = useState('91');

  // Message & Templates
  const [message, setMessage] = useState('{Hi|Hello} {{name}}, check out our special offer today!');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [interactiveMode, setInteractiveMode] = useState<'none' | 'buttons' | 'list'>('none');
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [contactInfo, setContactInfo] = useState<any>({
    website: { url: '', label: '' },
    callNumbers: [],
    whatsappNumbers: [],
    socialMedia: { instagram: { username: '' }, youtube: { channel: '' } },
    emails: [],
    customLinks: [],
  });
  const [previewTab, setPreviewTab] = useState<'button' | 'text'>('button');
  const [listMenu, setListMenu] = useState<ListMenuData>({
    title: 'Select Service',
    description: 'Tap below to choose',
    buttonText: 'View Options',
    sections: [],
  });

  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    instanceApi.getInstances().then((res) => {
      setInstances(res || []);
      if (res && res.length > 0) setSelectedInstanceId(res[0].instanceId);
    });

    apiClient.get('/campaigns').then((res) => {
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list)) {
        setRecentCampaigns(list.slice(0, 5));
      }
    }).catch(() => {});

    if (cloneFromId) {
      apiClient.get(`/campaigns/${cloneFromId}`).then((res) => {
        const c = res.data?.data || res.data;
        if (c) {
          handleLoadPastCampaign(c);
          toast.success('Loaded campaign data into editor. Edit text, media, or recipients before sending!');
        }
      }).catch(() => {});
    }
  }, [cloneFromId]);

  const handleLoadPastCampaign = (past: any) => {
    const text = past.message || past.messageTemplate || past.messageTemplates?.[0] || '';
    if (text) setMessage(text);

    if (past.mediaFiles && past.mediaFiles.length > 0) {
      setAttachments(past.mediaFiles.map((url: string, i: number) => ({ id: `att_${i}`, url, type: 'image', fileName: `Media #${i + 1}` })));
    } else if (past.mediaUrl) {
      setAttachments([{ id: 'att_1', url: past.mediaUrl, type: 'image', fileName: 'Media Attachment' }]);
    }

    if (past.buttons && past.buttons.length > 0) {
      setButtons(past.buttons);
      setInteractiveMode('buttons');
    }

    if (past.contactInfo) {
      setContactInfo(past.contactInfo);
    }

    toast.success('Loaded past Quick Send message! Click Send Now to re-send.');
  };

  const parsed = parseNumbersFromText(phoneText, defaultCountry);

  const handleSendNow = async () => {
    if (parsed.validCount === 0) {
      toast.error('Please enter at least 1 valid phone number');
      return;
    }
    if (!message.trim()) {
      toast.error('Message content cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: `Quick Send ${new Date().toLocaleTimeString()}`,
        campaignType: 'instant',
        message: message,
        messageTemplate: message,
        messageTemplates: [message],
        caption: message,
        instanceIds: selectedInstanceId ? [selectedInstanceId] : [],
        totalContacts: parsed.validCount,
        recipientNumbers: parsed.valid,
        mediaUrl: attachments.length > 0 ? attachments[0].url : undefined,
        mediaFiles: attachments.map((a) => a.url),
        buttons: interactiveMode === 'buttons' ? buttons : [],
        listMenu: interactiveMode === 'list' ? listMenu : undefined,
        contactInfo,
        showContactInfo: true,
        contactInfoHeader: '📞 *Contact Us:*',
      };

      const res = await apiClient.post('/campaigns', payload);
      const campaignId = res.data?.data?._id;
      if (!campaignId) throw new Error('Failed to create campaign record');

      await apiClient.post(`/campaigns/${campaignId}/start`);
      toast.success(`⚡ Quick Campaign launched to ${parsed.validCount} numbers!`);
      router.push('/campaigns');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Quick Send failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    setMessage(tpl.messageText || '');
    if (tpl.mediaUrl) {
      setAttachments([{ id: 'att_tpl', url: tpl.mediaUrl, type: 'image', fileName: 'Template Media' }]);
    }
    if (tpl.buttons && tpl.buttons.length > 0) {
      setButtons(tpl.buttons);
      setInteractiveMode('buttons');
    }
    if (tpl.listMenu) {
      setListMenu(tpl.listMenu);
      setInteractiveMode('list');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-7 w-7 text-amber-500" /> Quick Campaign (One-Click Send)
          </h1>
          <p className="text-sm text-muted-foreground">Bypass the wizard and send WhatsApp messages instantly in 1 simple screen.</p>
        </div>

        <TemplateManager
          onLoadTemplate={handleLoadTemplate}
          currentMessageText={message}
          currentMediaUrl={attachments[0]?.url}
          currentButtons={buttons}
          currentListMenu={listMenu}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Columns: Config */}
        <div className="md:col-span-2 space-y-6">
          {/* Instance Selection */}
          <Card className="p-4 space-y-3">
            <label className="text-xs font-bold uppercase text-muted-foreground">1. Select WhatsApp Sender Account</label>
            <select
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
              className="w-full rounded-xl border border-border bg-accent/40 p-3 text-xs text-foreground focus:outline-none"
            >
              {instances.map((inst) => (
                <option key={inst.instanceId} value={inst.instanceId}>
                  {inst.name} (+{inst.phoneNumber || 'Connected Socket'}) [{inst.status.toUpperCase()}]
                </option>
              ))}
              {instances.length === 0 && <option value="">Auto-select Connected WhatsApp Account</option>}
            </select>
          </Card>

          {/* Target Phone Numbers */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-muted-foreground">2. Paste Recipient Numbers</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Default Code:</span>
                <select
                  value={defaultCountry}
                  onChange={(e) => setDefaultCountry(e.target.value)}
                  className="rounded-lg border border-border bg-accent/40 p-1 text-[11px] text-foreground focus:outline-none"
                >
                  <option value="91">🇮🇳 India (+91)</option>
                  <option value="1">🇺🇸 USA (+1)</option>
                  <option value="44">🇬🇧 UK (+44)</option>
                  <option value="971">🇦🇪 UAE (+971)</option>
                </select>
              </div>
            </div>

            <textarea
              rows={4}
              value={phoneText}
              onChange={(e) => setPhoneText(e.target.value)}
              placeholder="Paste numbers line-by-line or comma separated (e.g. 9876543210, +919999999999)"
              className="w-full rounded-xl border border-border bg-accent/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
            />

            {phoneText && (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-accent/50 border border-border">
                <span className="text-muted-foreground">Total Detected: <b>{parsed.total}</b></span>
                <span className="text-emerald-500 font-bold">Valid: {parsed.validCount}</span>
                <span className="text-rose-500 font-bold">Invalid: {parsed.invalidCount}</span>
                <span className="text-amber-500 font-bold">Duplicates: {parsed.duplicateCount}</span>
              </div>
            )}
          </Card>

          {/* Message Editor */}
          <Card className="p-4 space-y-4">
            <label className="text-xs font-bold uppercase text-muted-foreground">3. Message Template</label>
            <MessageEditor text={message} onChange={setMessage} />

            {/* Media Upload */}
            <MediaUploader attachments={attachments} onAttachmentsChange={setAttachments} />

            {/* Interactive Options Mode Toggle */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Interactive Call-To-Action</label>
              <div className="flex gap-2">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'buttons', label: 'Reply Buttons (Max 3)' },
                  { id: 'list', label: 'List Menu (Pop-up)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInteractiveMode(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      interactiveMode === m.id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {interactiveMode === 'buttons' && (
                <div className="space-y-3 pt-2">
                  <ButtonBuilder buttons={buttons} onChange={setButtons} />

                  {/* Info Notice on Unofficial WhatsApp API Buttons */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>About WhatsApp Buttons on Unofficial APIs</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      WhatsApp restricts native interactive buttons on unofficial Baileys/Reverse-Engineered sockets for iPhones and newer WhatsApp Web versions. When delivered to those devices, VOXORA automatically converts your buttons into a <b>beautiful formatted text menu</b>. Recipients can simply reply with the number (e.g. <b>"1"</b>) to trigger instant auto-replies!
                    </p>
                  </div>
                </div>
              )}

              {interactiveMode === 'list' && <ListMenuBuilder data={listMenu} onChange={setListMenu} />}
            </div>
          </Card>

          {/* Contact Info & Auto-Clickable Links Section */}
          <ContactInfoSection value={contactInfo} onChange={setContactInfo} />
        </div>

        {/* Right Column: Send Summary & Quick Action */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4 sticky top-6">
            <h3 className="text-base font-extrabold text-foreground border-b border-border pb-3">Quick Send Summary</h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Recipients:</span>
                <span className="font-bold text-foreground">{parsed.validCount} valid numbers</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Media Attached:</span>
                <span className="font-bold text-foreground">{attachments.length} files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CTA Elements:</span>
                <span className="font-bold text-foreground uppercase">{interactiveMode}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
              <p className="font-bold text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4" /> Anti-Ban Active
              </p>
              <p className="text-[11px] text-muted-foreground">Messages will send with randomized human delays.</p>
            </div>

            <Button
              onClick={handleSendNow}
              disabled={isLoading || parsed.validCount === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-sm rounded-2xl shadow-lg"
            >
              <Zap className="mr-2 h-5 w-5 text-amber-300" /> {isLoading ? 'Sending Campaign...' : '⚡ Send Now'}
            </Button>
          </Card>

          {/* Recent Quick Messages History (1-Click Re-Send) */}
          {recentCampaigns.length > 0 && (
            <Card className="p-5 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                <span>📜 Recent Messages</span>
                <span className="text-[10px] text-primary">Click to Re-Send</span>
              </h4>
              <div className="space-y-2">
                {recentCampaigns.map((past: any) => {
                  const pastText = past.message || past.messageTemplate || past.messageTemplates?.[0] || past.name;
                  return (
                    <button
                      key={past._id}
                      type="button"
                      onClick={() => handleLoadPastCampaign(past)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-accent/30 hover:bg-primary/10 hover:border-primary/50 transition-all space-y-1 group"
                    >
                      <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary">{past.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{pastText}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>{new Date(past.createdAt).toLocaleDateString()}</span>
                        <span className="text-emerald-400 font-bold">⚡ Re-use Message</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuickCampaignPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Quick Send...</div>}>
      <QuickCampaignForm />
    </React.Suspense>
  );
}
