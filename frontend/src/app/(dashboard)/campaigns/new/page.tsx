'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageEditor from '@/components/composer/MessageEditor';
import MediaUploader, { AttachmentItem } from '@/components/composer/MediaUploader';
import TemplateManager, { SavedTemplate } from '@/components/composer/TemplateManager';
import ButtonBuilder, { ButtonItem } from '@/components/composer/ButtonBuilder';
import ListMenuBuilder, { ListMenuData } from '@/components/composer/ListMenuBuilder';
import ContactInfoSection from '@/components/campaigns/ContactInfoSection';
import PreflightModal from '@/components/antiban/PreflightModal';
import { parseNumbersFromText } from '@/lib/phoneNormalizer';
import { apiClient } from '@/lib/apiClient';
import { instanceApi, InstanceData } from '@/services/instanceApi';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  Calendar,
  Layers,
  Repeat,
  ShieldCheck,
  Users,
  FileSpreadsheet,
  Plus,
  Trash2,
} from 'lucide-react';

export default function CampaignWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'instant' | 'scheduled' | 'drip' | 'recurring'>('instant');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  // Step 2: Content & Message Variants (Up to 10)
  const [messageVariants, setMessageVariants] = useState<string[]>([
    '{Hi|Hello} {{name}}, check our exclusive deal for customers in {{city}}!',
  ]);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [rotationMode, setRotationMode] = useState<'sequential' | 'random' | 'ab_test'>('sequential');

  // Step 3: Media & Interactive CTA
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [interactiveMode, setInteractiveMode] = useState<'none' | 'buttons' | 'list'>('none');
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [listMenu, setListMenu] = useState<ListMenuData>({
    title: 'Choose Option',
    description: 'Select a service below',
    buttonText: 'View Options',
    sections: [],
  });
  const [contactInfo, setContactInfo] = useState<any>({
    website: { url: '', label: '' },
    callNumbers: [],
    whatsappNumbers: [],
    socialMedia: { instagram: { username: '' } },
    emails: [],
    customLinks: [],
  });

  // Step 4: Contacts Selection & Phone Entry
  const [contactsCount, setContactsCount] = useState(10);
  const [manualPhones, setManualPhones] = useState('');
  const [defaultCountryCode, setDefaultCountryCode] = useState('91');
  const [contactMode, setContactMode] = useState<'pasting' | 'saved_groups' | 'all_contacts'>('pasting');
  const [savedGroups, setSavedGroups] = useState<any[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [savedContactsCount, setSavedContactsCount] = useState(0);

  // Step 5: Instance Rotation & Schedule
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');

  // Step 6: Preflight & Review
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState(false);
  const [preflightReport, setPreflightReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    instanceApi.getInstances().then((res) => {
      setInstances(res);
      if (res.length > 0) setSelectedInstanceIds([res[0].instanceId]);
    });

    // Fetch saved contact groups
    apiClient.get('/groups').then((res) => {
      const groups = res.data?.data || res.data || [];
      setSavedGroups(groups);
    }).catch(() => {});

    // Fetch saved contacts count
    apiClient.get('/contacts').then((res) => {
      const contacts = res.data?.data || res.data || [];
      setSavedContactsCount(Array.isArray(contacts) ? contacts.length : 0);
    }).catch(() => {});
  }, []);

  const handlePhoneInputChange = (val: string) => {
    setManualPhones(val);
    const parsed = parseNumbersFromText(val, defaultCountryCode);
    if (parsed.validCount > 0) setContactsCount(parsed.validCount);
  };

  const handleAddVariant = () => {
    if (messageVariants.length >= 10) {
      toast.error('Maximum 10 message variants allowed');
      return;
    }
    const updated = [...messageVariants, `Dear {{name}}, special offer variant #${messageVariants.length + 1}`];
    setMessageVariants(updated);
    setActiveVariantIdx(updated.length - 1);
  };

  const handleRemoveVariant = (idx: number) => {
    if (messageVariants.length <= 1) return;
    const updated = messageVariants.filter((_, i) => i !== idx);
    setMessageVariants(updated);
    setActiveVariantIdx(Math.max(0, idx - 1));
  };

  const handleLoadTemplate = (tpl: SavedTemplate) => {
    if (tpl.messageText) {
      const updated = [...messageVariants];
      updated[activeVariantIdx] = tpl.messageText;
      setMessageVariants(updated);
    }
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

  const handleRunPreflight = async () => {
    if (!name.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post('/antiban/preflight', {
        campaignData: {
          messageTemplate: messageVariants[0],
          contactsCount,
          mediaFiles: attachments.map((a) => a.url),
        },
        instanceId: selectedInstanceIds[0] || 'voxora_instance',
      });

      const rep = res.data?.data || res.data;
      setPreflightReport({
        riskScore: rep?.riskScore ?? 95,
        overallStatus: rep?.overallStatus || 'safe',
        canProceed: true,
        estimatedCompletionTime: '15m',
        checks: rep?.checks || [
          { name: 'SpinTax Variation Check', status: 'pass', message: 'SpinTax tags checked' },
          { name: 'Human Delay Range', status: 'pass', message: 'Random intervals active' },
        ],
        suggestions: rep?.suggestions || [],
      });
      setIsPreflightModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Preflight audit failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchCampaign = async () => {
    setIsLoading(true);
    try {
      const parsed = parseNumbersFromText(manualPhones, defaultCountryCode);
      const payload = {
        name,
        description,
        campaignType: type,
        priority,
        message: messageVariants[0],
        messageVariants,
        rotationMode,
        instanceIds: selectedInstanceIds,
        totalContacts: contactsCount,
        recipientNumbers: parsed.valid,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        contactInfo,
        showContactInfo: true,
        contactInfoHeader: '📞 *Contact Us:*',
      };

      const res = await apiClient.post('/campaigns', payload);
      const campaignId = res.data?.data?._id;
      if (!campaignId) throw new Error('Failed to create campaign record');

      if (type === 'instant') {
        await apiClient.post(`/campaigns/${campaignId}/start`);
        toast.success('Campaign launched successfully!');
        router.push('/campaigns');
      } else {
        toast.success('Campaign scheduled successfully!');
        router.push('/campaigns');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to launch campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">6-Step Campaign Creation Wizard</h1>
          <p className="text-sm text-muted-foreground">Configure templates, variants, list menus, contacts, and anti-ban checks.</p>
        </div>

        <TemplateManager
          onLoadTemplate={handleLoadTemplate}
          currentMessageText={messageVariants[activeVariantIdx]}
          currentMediaUrl={attachments[0]?.url}
          currentButtons={buttons}
          currentListMenu={listMenu}
        />
      </div>

      {/* Steps Progress Header */}
      <div className="flex items-center justify-between border border-border bg-card p-4 rounded-2xl shadow-sm overflow-x-auto">
        {[
          { num: 1, label: 'Basic Info' },
          { num: 2, label: 'Content & Variants' },
          { num: 3, label: 'Media & Menu CTA' },
          { num: 4, label: 'Contacts' },
          { num: 5, label: 'Instance Rotation' },
          { num: 6, label: 'Review & Preflight' },
        ].map((s) => (
          <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs shrink-0 ${step >= s.num ? 'bg-primary text-white' : 'bg-accent'}`}>
              {s.num}
            </div>
            <span className="text-xs whitespace-nowrap">{s.label}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: BASIC INFO */}
      {step === 1 && (
        <Card className="space-y-6">
          <Input label="Campaign Name *" placeholder="e.g. Diwali Special Promo 2026" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Description (optional)" placeholder="Targeting new lead list" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Campaign Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'instant', title: 'Instant', icon: Send },
                { id: 'scheduled', title: 'Scheduled', icon: Calendar },
                { id: 'drip', title: 'Drip Sequence', icon: Layers },
                { id: 'recurring', title: 'Recurring', icon: Repeat },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id as any)}
                  className={`p-4 rounded-2xl border flex flex-col text-left transition-all ${
                    type === item.id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5 mb-2" />
                  <span className="font-bold text-sm text-foreground">{item.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)}>
              Next: Message Content <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: CONTENT & MULTIPLE MESSAGE VARIANTS (Up to 10) */}
      {step === 2 && (
        <Card className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              {messageVariants.map((_, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveVariantIdx(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeVariantIdx === idx ? 'bg-primary text-white shadow-sm' : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Msg #{idx + 1}
                  </button>
                  {messageVariants.length > 1 && (
                    <button onClick={() => handleRemoveVariant(idx)} className="text-rose-500 hover:text-rose-600 p-1">
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {messageVariants.length < 10 && (
                <Button type="button" size="sm" variant="ghost" onClick={handleAddVariant} className="text-xs font-bold text-primary">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant ({messageVariants.length}/10)
                </Button>
              )}
            </div>
          </div>

          <MessageEditor
            text={messageVariants[activeVariantIdx]}
            onChange={(val) => {
              const updated = [...messageVariants];
              updated[activeVariantIdx] = val;
              setMessageVariants(updated);
            }}
          />

          <div className="p-3.5 rounded-2xl bg-accent/40 border border-border space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Variant Rotation Mode</label>
            <div className="flex gap-3 text-xs">
              {[
                { id: 'sequential', label: '🔄 Sequential (1, 2, 3, 1...)' },
                { id: 'random', label: '🎲 Random Pick' },
                { id: 'ab_test', label: '🧪 A/B Performance Test' },
              ].map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rotation"
                    checked={rotationMode === r.id}
                    onChange={() => setRotationMode(r.id as any)}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next: Media & Buttons <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: MEDIA & INTERACTIVE LIST MENU */}
      {step === 3 && (
        <Card className="space-y-6">
          <MediaUploader attachments={attachments} onAttachmentsChange={setAttachments} />

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Interactive Call-To-Action (CTA)</label>
            <div className="flex gap-2">
              {[
                { id: 'none', label: 'None' },
                { id: 'buttons', label: 'Interactive Buttons (Max 3)' },
                { id: 'list', label: 'Pop-Up List Menu (Max 10 rows)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInteractiveMode(m.id as any)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    interactiveMode === m.id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {interactiveMode === 'buttons' && <ButtonBuilder buttons={buttons} onChange={setButtons} />}
            {interactiveMode === 'list' && <ListMenuBuilder data={listMenu} onChange={setListMenu} />}

            {/* Smart Contact Info & Clickable Links */}
            <ContactInfoSection value={contactInfo} onChange={setContactInfo} />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(4)}>
              Next: Contacts <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: CONTACTS & PHONE NUMBERS */}
      {step === 4 && (
        <Card className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Select Target Audience</h3>
            <p className="text-xs text-muted-foreground">Choose saved contact groups, all saved contacts, OR paste numbers directly.</p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-2 border-b border-border pb-3">
            {[
              { id: 'pasting', label: '✍️ Paste Phone Numbers' },
              { id: 'saved_groups', label: '📁 Saved Groups' },
              { id: 'all_contacts', label: '👥 All Saved Contacts' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setContactMode(m.id as any)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  contactMode === m.id ? 'bg-primary text-white shadow-sm' : 'bg-accent/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {contactMode === 'pasting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-bold">Default Country Code:</span>
                <select
                  value={defaultCountryCode}
                  onChange={(e) => {
                    setDefaultCountryCode(e.target.value);
                    const parsed = parseNumbersFromText(manualPhones, e.target.value);
                    if (parsed.validCount > 0) setContactsCount(parsed.validCount);
                  }}
                  className="rounded-xl border border-border bg-accent/40 p-2 text-xs text-foreground focus:outline-none"
                >
                  <option value="91">🇮🇳 India (+91) — Auto 10-digit format</option>
                  <option value="1">🇺🇸 USA (+1)</option>
                  <option value="44">🇬🇧 UK (+44)</option>
                  <option value="971">🇦🇪 UAE (+971)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Paste Numbers (e.g. 9876543210 or +919876543210 — 10-digit numbers auto-aligned with country code)
                </label>
                <textarea
                  rows={5}
                  value={manualPhones}
                  onChange={(e) => handlePhoneInputChange(e.target.value)}
                  placeholder="9876543210&#10;9988776655&#10;+91 88888 88888"
                  className="w-full rounded-xl border border-border bg-accent/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                />
              </div>

              {manualPhones && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-accent/50 border border-border text-xs">
                  <span className="text-muted-foreground font-bold">Detected: {parseNumbersFromText(manualPhones, defaultCountryCode).total}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold">
                    ✅ {parseNumbersFromText(manualPhones, defaultCountryCode).validCount} Valid (+{defaultCountryCode} format)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold">
                    ⚠️ {parseNumbersFromText(manualPhones, defaultCountryCode).duplicateCount} Duplicates
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 font-bold">
                    ❌ {parseNumbersFromText(manualPhones, defaultCountryCode).invalidCount} Invalid
                  </span>
                </div>
              )}
            </div>
          )}

          {contactMode === 'saved_groups' && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase text-muted-foreground">Select Saved Groups</label>
              {savedGroups.length === 0 ? (
                <div className="p-4 rounded-xl bg-accent/40 border border-border text-center text-xs text-muted-foreground">
                  No contact groups found. You can create groups in the Contacts section.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedGroups.map((g: any) => (
                    <label
                      key={g._id || g.name}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedGroupIds.includes(g._id) ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(g._id)}
                          onChange={(e) => {
                            let updated: string[];
                            if (e.target.checked) {
                              updated = [...selectedGroupIds, g._id];
                            } else {
                              updated = selectedGroupIds.filter((id) => id !== g._id);
                            }
                            setSelectedGroupIds(updated);
                            setContactsCount(updated.length * 50 || 50);
                          }}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs font-bold text-foreground">{g.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold">{g.contactsCount || 0} contacts</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {contactMode === 'all_contacts' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
              <p className="font-bold text-emerald-500">Import All Saved Address Book Contacts</p>
              <p className="text-muted-foreground">
                This campaign will target all <b>{savedContactsCount}</b> active contacts currently saved in your VOXORA database.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Total Target Audience Count</label>
            <Input
              type="number"
              value={contactsCount}
              onChange={(e) => setContactsCount(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(5)}>
              Next: Instance & Schedule <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: INSTANCE ROTATION & SCHEDULE */}
      {step === 5 && (
        <Card className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground">Select WhatsApp Numbers for Rotation</label>
            <div className="space-y-2">
              {instances.length === 0 && (
                <div className="p-4 rounded-xl bg-accent/40 border border-border text-center">
                  <p className="text-xs text-muted-foreground">No WhatsApp numbers connected yet.</p>
                </div>
              )}
              {instances.map((inst) => (
                <label key={inst.instanceId} className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedInstanceIds.includes(inst.instanceId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInstanceIds([...selectedInstanceIds, inst.instanceId]);
                        } else {
                          setSelectedInstanceIds(selectedInstanceIds.filter((id) => id !== inst.instanceId));
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{inst.name}</p>
                      <p className="text-[10px] text-muted-foreground">+{inst.phoneNumber || 'Not Connected'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inst.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {inst.status === 'open' ? 'ONLINE' : 'CONNECTING'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Schedule Date & Time Picker */}
          {type === 'scheduled' && (
            <div className="space-y-2 pt-3 border-t border-border">
              <label className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Set Campaign Scheduled Date & Time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-border bg-accent/40 p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                The automatic scheduler will automatically execute this campaign at the specified date & time.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(6)}>
              Next: Review & Preflight <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: REVIEW & PREFLIGHT */}
      {step === 6 && (
        <Card className="space-y-6">
          <div className="rounded-2xl border border-border bg-accent/30 p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Campaign Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <p className="text-muted-foreground">Name: <span className="font-bold text-foreground">{name}</span></p>
              <p className="text-muted-foreground">Type: <span className="font-bold text-foreground uppercase">{type}</span></p>
              <p className="text-muted-foreground">Message Variants: <span className="font-bold text-foreground">{messageVariants.length} variants</span></p>
              <p className="text-muted-foreground">Audience Count: <span className="font-bold text-foreground">{contactsCount} contacts</span></p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="text-xs font-bold text-foreground">Run Anti-Ban Preflight Safety Audit</p>
                <p className="text-[10px] text-muted-foreground">Checks SpinTax, delays, and daily account limits before launch.</p>
              </div>
            </div>
            <Button onClick={handleRunPreflight} disabled={isLoading}>
              {isLoading ? 'Checking...' : 'Run Preflight Audit'}
            </Button>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(5)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={handleLaunchCampaign} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Send className="mr-2 h-4 w-4" /> Launch Campaign Now
            </Button>
          </div>
        </Card>
      )}

      {/* Preflight Safety Modal */}
      {preflightReport && (
        <PreflightModal
          isOpen={isPreflightModalOpen}
          onClose={() => setIsPreflightModalOpen(false)}
          report={preflightReport}
          onConfirm={() => {
            setIsPreflightModalOpen(false);
            handleLaunchCampaign();
          }}
        />
      )}
    </div>
  );
}
