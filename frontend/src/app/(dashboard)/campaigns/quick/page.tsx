'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageEditor from '@/components/composer/MessageEditor';
import MediaUploader, { AttachmentItem } from '@/components/composer/MediaUploader';
import TemplateManager, { SavedTemplate } from '@/components/composer/TemplateManager';
import ButtonBuilder, { ButtonItem } from '@/components/composer/ButtonBuilder';
import ListMenuBuilder, { ListMenuData } from '@/components/composer/ListMenuBuilder';
import ContactInfoSection from '@/components/campaigns/ContactInfoSection';
import SpeedModeSelector from '@/components/campaigns/SpeedModeSelector';
import { parseNumbersFromText } from '@/lib/phoneNormalizer';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Zap, ShieldCheck, AlertTriangle, Key, Send, RefreshCw, Copy } from 'lucide-react';

const OTP_TEMPLATES = [
  { id: 'login', label: '🔐 App Login Verification', header: '🔐 VOXORA Login Code', body: 'Your login verification code is:\n\n*{{otp}}*\n\nDo not share this code with anyone.' },
  { id: 'bank', label: '🏦 Bank Transaction OTP', header: '🏦 Bank Transaction OTP', body: 'Use OTP *{{otp}}* to authorize your transaction of ₹{{amount}}.' },
  { id: 'reset', label: '🔑 Password Reset OTP', header: '🔑 Account Password Reset', body: 'Your password reset code is *{{otp}}*. Valid for 10 minutes.' },
  { id: 'order', label: '📦 Order Verification', header: '📦 Order Confirmation', body: 'Verify your order with code *{{otp}}* to complete delivery.' },
];

function QuickCampaignForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneFromId = searchParams.get('cloneFrom');

  const [sendMode, setSendMode] = useState<'campaign' | 'otp'>('campaign');

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
  const [listMenu, setListMenu] = useState<ListMenuData>({
    title: 'Select Service',
    description: 'Tap below to choose',
    buttonText: 'View Options',
    sections: [],
  });

  // OTP Mode State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLength, setOtpLength] = useState<4 | 6>(6);
  const [otpTemplate, setOtpTemplate] = useState('login');
  const [otpHeader, setOtpHeader] = useState('🔐 VOXORA Verification Code');
  const [otpBody, setOtpBody] = useState('Your OTP verification code is:\n\n*{{otp}}*\n\nTap the button below to copy the code to your clipboard.');
  const [otpFooter, setOtpFooter] = useState('⏱️ Valid for 5 minutes • Powered by VOXORA');
  const [isOtpSending, setIsOtpSending] = useState(false);

  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpEnabled, setIsOtpEnabled] = useState(false); // Default OFF!
  const [selectedSpeedMode, setSelectedSpeedMode] = useState('medium');

  useEffect(() => {
    apiClient.get('/system/features').then((res) => {
      if (res.data?.data?.enableOtpSender !== undefined) {
        setIsOtpEnabled(!!res.data.data.enableOtpSender);
      }
    }).catch(() => {});

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

  const handleGenerateRandomOtp = () => {
    const min = Math.pow(10, otpLength - 1);
    const max = Math.pow(10, otpLength) - 1;
    const generated = Math.floor(min + Math.random() * (max - min + 1)).toString();
    setOtpCode(generated);
    toast.success(`Generated ${otpLength}-digit random OTP: ${generated}`);
  };

  const handleSelectOtpTemplate = (tId: string) => {
    setOtpTemplate(tId);
    const tpl = OTP_TEMPLATES.find((t) => t.id === tId);
    if (tpl) {
      setOtpHeader(tpl.header);
      setOtpBody(tpl.body);
    }
  };

  const handleSendOtpNow = async () => {
    if (!otpPhone.trim()) {
      toast.error('Please enter recipient phone number for OTP');
      return;
    }

    const finalOtp = otpCode.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    const finalBody = otpBody.replace('{{otp}}', finalOtp);

    setIsOtpSending(true);
    try {
      await apiClient.post('/messages/send-otp', {
        instanceId: selectedInstanceId,
        phone: otpPhone,
        otp: finalOtp,
        header: otpHeader,
        body: finalBody,
        footer: otpFooter,
        buttonText: `Copy ${finalOtp}`,
        template: otpTemplate,
      });

      toast.success(`🔐 OTP ${finalOtp} sent with Copy Code button to +${otpPhone}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP message');
    } finally {
      setIsOtpSending(false);
    }
  };

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
        speedMode: selectedSpeedMode,
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
            <Zap className="h-7 w-7 text-amber-500" /> Quick Message & OTP Sender
          </h1>
          <p className="text-sm text-muted-foreground">Send bulk campaigns or single OTP messages with native Copy Code buttons instantly.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSendMode('campaign')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              sendMode === 'campaign' ? 'bg-primary text-white shadow-md' : 'bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            ⚡ Quick Bulk Send
          </button>
          <button
            onClick={() => setSendMode('otp')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              sendMode === 'otp' ? 'bg-purple-600 text-white shadow-md' : 'bg-accent/40 text-muted-foreground hover:text-foreground'
            }`}
          >
            🔐 Send OTP (Copy Button)
          </button>

          {sendMode === 'campaign' && (
            <TemplateManager
              onLoadTemplate={handleLoadTemplate}
              currentMessageText={message}
              currentMediaUrl={attachments[0]?.url}
              currentButtons={buttons}
              currentListMenu={listMenu}
            />
          )}
        </div>
      </div>

      {sendMode === 'otp' ? (
        /* Dedicated OTP Sender UI */
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-lg font-extrabold text-purple-400 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-400" /> Send OTP Code with Copy Button Node
            </h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
              Native Flow CTA Copy
            </span>
          </div>

          {!isOtpEnabled && (
            <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-xs flex items-center gap-3">
              <Key className="h-6 w-6 text-rose-400 shrink-0" />
              <div>
                <p className="font-extrabold text-sm text-rose-300">🔐 OTP Sender Feature is Turned Off (On Hold)</p>
                <p className="text-rose-200/90 text-[11px]">
                  Super Admin has currently turned off OTP generation. You can enable this feature anytime in <b>Settings & Admin Controls</b>.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 text-xs">
              <Input
                label="Recipient Phone Number *"
                placeholder="e.g. 919876543210"
                value={otpPhone}
                onChange={(e) => setOtpPhone(e.target.value)}
                className="font-mono"
              />

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground">Select OTP Template</label>
                <div className="grid grid-cols-2 gap-2">
                  {OTP_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectOtpTemplate(t.id)}
                      className={`p-2.5 rounded-xl border text-left text-[11px] font-bold ${
                        otpTemplate === t.id ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-border bg-accent/30 text-muted-foreground'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-muted-foreground">OTP Verification Code</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOtpLength(4)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${otpLength === 4 ? 'bg-purple-500 text-white' : 'bg-accent text-muted-foreground'}`}
                    >
                      4-Digit
                    </button>
                    <button
                      onClick={() => setOtpLength(6)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${otpLength === 6 ? 'bg-purple-500 text-white' : 'bg-accent text-muted-foreground'}`}
                    >
                      6-Digit
                    </button>
                    <button
                      onClick={handleGenerateRandomOtp}
                      className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-[11px] font-bold flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" /> Auto-Generate
                    </button>
                  </div>
                </div>

                <Input
                  placeholder="Enter custom OTP code or click Auto-Generate..."
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="font-mono text-base font-extrabold text-purple-400"
                />
              </div>

              <Input
                label="Header Text"
                value={otpHeader}
                onChange={(e) => setOtpHeader(e.target.value)}
              />

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground">Body Text</label>
                <textarea
                  rows={3}
                  value={otpBody}
                  onChange={(e) => setOtpBody(e.target.value)}
                  className="w-full rounded-xl border border-border bg-accent/40 p-3 text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            {/* OTP WhatsApp Mobile Live Preview */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-muted-foreground mb-2">WhatsApp OTP Button Preview</p>
              <div className="w-64 rounded-2xl border border-border bg-accent/40 p-4 space-y-3 shadow-lg">
                <div className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-purple-400" /> {otpHeader}
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {otpBody.replace('{{otp}}', otpCode || '123456')}
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                  {otpFooter}
                </div>
                <button className="w-full p-2.5 rounded-xl border border-purple-500/50 bg-purple-500/10 text-purple-300 text-xs font-extrabold flex items-center justify-center gap-2">
                  <Copy className="h-4 w-4 text-purple-400" /> Copy {otpCode || '123456'}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={handleSendOtpNow}
              isLoading={isOtpSending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-6"
            >
              <Send className="mr-2 h-4 w-4" /> Send OTP Code Now
            </Button>
          </div>
        </Card>
      ) : (
        /* Regular Campaign Bulk Send UI */
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

            {/* Smart Speed Mode Selection */}
            <Card className="p-5">
              <SpeedModeSelector
                contactCount={parsed.validCount || 100}
                instanceCount={selectedInstanceId ? 1 : 1}
                selectedMode={selectedSpeedMode}
                onSelect={(mode) => setSelectedSpeedMode(mode)}
              />
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
      )}
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
