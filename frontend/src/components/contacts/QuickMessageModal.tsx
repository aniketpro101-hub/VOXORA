'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageEditor from '@/components/composer/MessageEditor';
import { parseNumbersFromText } from '@/lib/phoneNormalizer';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Zap, X, Send, UserPlus, Eye, ArrowLeft, CheckCheck } from 'lucide-react';

interface QuickMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickMessageModal({ isOpen, onClose }: QuickMessageModalProps) {
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('91');
  const [message, setMessage] = useState('Hi! Check out our special offer today.');
  const [saveContact, setSaveContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const parsed = parseNumbersFromText(phone, countryCode);

  const handleSend = async () => {
    if (parsed.validCount === 0) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/contacts/quick-message', {
        phone: parsed.valid[0],
        message,
        saveContact,
        name: contactName,
      });

      toast.success(`⚡ Quick Message sent to +${parsed.valid[0]}!`);
      setStep('edit');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to send Quick Message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" /> Quick Message (Without Saving)
          </h3>
          <button onClick={onClose} className="p-1 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'edit' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Country</label>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-accent/40 p-2.5 text-xs text-foreground focus:outline-none"
                >
                  <option value="91">🇮🇳 +91</option>
                  <option value="1">🇺🇸 +1</option>
                  <option value="44">🇬🇧 +44</option>
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase text-muted-foreground">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-accent/40 p-2.5 text-xs text-foreground font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveContact}
                  onChange={(e) => setSaveContact(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <UserPlus className="h-4 w-4 text-emerald-500" /> Save contact to address book after sending
              </label>
              {saveContact && (
                <Input placeholder="Contact Name (optional)" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              )}
            </div>

            <MessageEditor text={message} onChange={setMessage} />

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep('preview')}
                disabled={parsed.validCount === 0 || !message.trim()}
                className="bg-primary hover:bg-primary/90 font-bold text-white"
              >
                <Eye className="mr-1.5 h-4 w-4" /> Preview Message
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs animate-in zoom-in duration-200">
            <div className="p-3.5 rounded-2xl bg-accent/40 border border-border space-y-1">
              <p className="font-bold text-muted-foreground uppercase text-[10px]">Recipient</p>
              <p className="font-mono text-foreground font-bold text-sm">+{parsed.valid[0] || ''}</p>
              {saveContact && contactName && <p className="text-emerald-400 font-semibold">Save Name: {contactName}</p>}
            </div>

            <div className="p-4 rounded-3xl bg-slate-950 border border-emerald-900/40 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-emerald-400/80 border-b border-slate-800 pb-2">
                <span>🟢 WhatsApp Live Engine</span>
                <span>Direct Message</span>
              </div>

              {/* Chat Bubble */}
              <div className="bg-emerald-950/60 border border-emerald-800/40 text-slate-100 p-3.5 rounded-2xl space-y-2 max-w-sm ml-auto shadow-md">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{message}</p>
                <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300/70 pt-1">
                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="h-3 w-3 text-cyan-400" />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold text-center">
              ⚠️ This message will be sent immediately via your connected WhatsApp session.
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setStep('edit')}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Edit
              </Button>
              <Button onClick={handleSend} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
                <Send className="mr-1.5 h-4 w-4" /> {isLoading ? 'Sending...' : 'Confirm & Send Now'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
