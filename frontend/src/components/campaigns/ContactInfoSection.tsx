'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe,
  Phone,
  MessageSquare,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface Props {
  value: any;
  onChange: (value: any) => void;
}

export default function ContactInfoSection({ value, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contactInfo = value || {
    website: { url: '', label: '' },
    callNumbers: [],
    whatsappNumbers: [],
    socialMedia: {
      instagram: { username: '', label: '' },
      youtube: { channel: '', label: '' },
      facebook: { pageId: '', label: '' },
      twitter: { handle: '', label: '' },
      linkedin: { profile: '', label: '' },
    },
    emails: [],
    location: { mapUrl: '', label: '', address: '' },
    customLinks: [],
  };

  const update = (path: string, val: any) => {
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(contactInfo));
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = val;
    onChange(updated);
  };

  const addCallNumber = () => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.callNumbers = [...(updated.callNumbers || []), { name: '', number: '' }];
    onChange(updated);
  };

  const removeCallNumber = (index: number) => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.callNumbers.splice(index, 1);
    onChange(updated);
  };

  const addWhatsApp = () => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.whatsappNumbers = [
      ...(updated.whatsappNumbers || []),
      { name: '', number: '', prefilledMessage: '' },
    ];
    onChange(updated);
  };

  const removeWhatsApp = (index: number) => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.whatsappNumbers.splice(index, 1);
    onChange(updated);
  };

  const addEmail = () => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.emails = [...(updated.emails || []), { name: '', email: '' }];
    onChange(updated);
  };

  const removeEmail = (index: number) => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.emails.splice(index, 1);
    onChange(updated);
  };

  const addCustomLink = () => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.customLinks = [
      ...(updated.customLinks || []),
      { label: '', url: '', icon: '🔗' },
    ];
    onChange(updated);
  };

  const removeCustomLink = (index: number) => {
    const updated = JSON.parse(JSON.stringify(contactInfo));
    updated.customLinks.splice(index, 1);
    onChange(updated);
  };

  return (
    <Card className="p-5 border-sky-500/30 bg-sky-500/5 space-y-4">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400">
            <LinkIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <span>📞 Smart Contact Info & Auto-Clickable Links</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-bold uppercase">
                Works 100% Everywhere
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add website, call numbers, WhatsApp links, social media & maps (auto-clickable on all devices)
            </p>
          </div>
        </div>
        <div className="p-1 rounded-lg hover:bg-accent text-muted-foreground">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-6 pt-3 border-t border-sky-500/20 animate-in fade-in duration-200 text-xs">
          {/* Pro Tip Banner */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sky-400 text-xs">Pro Tip: 100% Reliable Clickable Links</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                These contact links are automatically formatted into your WhatsApp message. WhatsApp instantly turns all URLs and phone numbers into clickable buttons on both Android & iPhone!
              </p>
            </div>
          </div>

          {/* 🌐 Website */}
          <div className="space-y-2">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-sky-400" /> Website URL
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Label (e.g. 'Visit Official Site')"
                value={contactInfo.website?.label || ''}
                onChange={(e) => update('website.label', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="https://yoursite.com"
                value={contactInfo.website?.url || ''}
                onChange={(e) => update('website.url', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* 📞 Call Numbers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-emerald-400" /> Direct Call Numbers
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={addCallNumber} className="text-emerald-400 hover:text-emerald-300 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Call Number
              </Button>
            </div>
            {contactInfo.callNumbers?.map((call: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Name (e.g. 'Support')"
                  value={call.name || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.callNumbers[idx].name = e.target.value;
                    onChange(updated);
                  }}
                  className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={call.number || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.callNumbers[idx].number = e.target.value;
                    onChange(updated);
                  }}
                  className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeCallNumber(idx)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 💬 WhatsApp Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-emerald-500" /> Direct WhatsApp Chat Links (wa.me)
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={addWhatsApp} className="text-emerald-400 hover:text-emerald-300 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add WhatsApp Link
              </Button>
            </div>
            {contactInfo.whatsappNumbers?.map((wa: any, idx: number) => (
              <div key={idx} className="space-y-2 p-3 rounded-xl bg-background border border-border">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Department (e.g. 'Sales')"
                    value={wa.name || ''}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(contactInfo));
                      updated.whatsappNumbers[idx].name = e.target.value;
                      onChange(updated);
                    }}
                    className="w-1/2 px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={wa.number || ''}
                    onChange={(e) => {
                      const updated = JSON.parse(JSON.stringify(contactInfo));
                      updated.whatsappNumbers[idx].number = e.target.value;
                      onChange(updated);
                    }}
                    className="w-1/2 px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                  />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeWhatsApp(idx)} className="text-rose-400 hover:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  type="text"
                  placeholder="Prefilled text (e.g. 'Hi, I want to buy this product')"
                  value={wa.prefilledMessage || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.whatsappNumbers[idx].prefilledMessage = e.target.value;
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>
            ))}
          </div>

          {/* Social Media Links */}
          <div className="space-y-3 pt-2 border-t border-border">
            <label className="font-bold text-foreground">Social Media Handles</label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Instagram */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-pink-400 flex items-center gap-1">
                  <Instagram className="h-3.5 w-3.5" /> Instagram Username
                </span>
                <input
                  type="text"
                  placeholder="username (without @)"
                  value={contactInfo.socialMedia?.instagram?.username || ''}
                  onChange={(e) => update('socialMedia.instagram.username', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* YouTube */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                  <Youtube className="h-3.5 w-3.5" /> YouTube Channel
                </span>
                <input
                  type="text"
                  placeholder="@yourchannel or URL"
                  value={contactInfo.socialMedia?.youtube?.channel || ''}
                  onChange={(e) => update('socialMedia.youtube.channel', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Facebook */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-blue-500 flex items-center gap-1">
                  <Facebook className="h-3.5 w-3.5" /> Facebook Page
                </span>
                <input
                  type="text"
                  placeholder="page-id or facebook.com/page"
                  value={contactInfo.socialMedia?.facebook?.pageId || ''}
                  onChange={(e) => update('socialMedia.facebook.pageId', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Twitter/X */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                  <Twitter className="h-3.5 w-3.5" /> Twitter / X Handle
                </span>
                <input
                  type="text"
                  placeholder="handle (without @)"
                  value={contactInfo.socialMedia?.twitter?.handle || ''}
                  onChange={(e) => update('socialMedia.twitter.handle', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-1 sm:col-span-2">
                <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile / Company
                </span>
                <input
                  type="text"
                  placeholder="profile-username or full URL"
                  value={contactInfo.socialMedia?.linkedin?.profile || ''}
                  onChange={(e) => update('socialMedia.linkedin.profile', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* 📧 Emails */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-purple-400" /> Support Emails
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={addEmail} className="text-purple-400 hover:text-purple-300 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Email
              </Button>
            </div>
            {contactInfo.emails?.map((em: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Name (e.g. 'Support')"
                  value={em.name || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.emails[idx].name = e.target.value;
                    onChange(updated);
                  }}
                  className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <input
                  type="email"
                  placeholder="support@yoursite.com"
                  value={em.email || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.emails[idx].email = e.target.value;
                    onChange(updated);
                  }}
                  className="w-1/2 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeEmail(idx)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* 📍 Location (Google Maps) */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="font-bold text-foreground flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-400" /> Store Location & Google Maps
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Physical Address (e.g. 'Shop #5, MG Road, Mumbai')"
                value={contactInfo.location?.address || ''}
                onChange={(e) => update('location.address', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
              />
              <input
                type="text"
                placeholder="Google Maps Link: https://maps.google.com/..."
                value={contactInfo.location?.mapUrl || ''}
                onChange={(e) => update('location.mapUrl', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* 🔗 Custom Links */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground flex items-center gap-1.5">
                <LinkIcon className="h-4 w-4 text-cyan-400" /> Unlimited Custom Links
              </label>
              <Button type="button" size="sm" variant="ghost" onClick={addCustomLink} className="text-cyan-400 hover:text-cyan-300 text-xs">
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Custom Link
              </Button>
            </div>
            {contactInfo.customLinks?.map((link: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Emoji/Icon"
                  value={link.icon || '🔗'}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.customLinks[idx].icon = e.target.value;
                    onChange(updated);
                  }}
                  className="w-16 px-2 py-2 text-center rounded-xl bg-background border border-border text-foreground focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Label (e.g. 'Download PDF Catalog')"
                  value={link.label || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.customLinks[idx].label = e.target.value;
                    onChange(updated);
                  }}
                  className="w-1/3 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="https://link.com"
                  value={link.url || ''}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(contactInfo));
                    updated.customLinks[idx].url = e.target.value;
                    onChange(updated);
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeCustomLink(idx)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
