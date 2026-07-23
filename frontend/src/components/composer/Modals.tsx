'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpintaxProcessor } from '@/lib/spintaxHelper';
import { toast } from 'sonner';
import { Sparkles, Send, X, Copy } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { InstanceData } from '@/services/instanceApi';

interface SpintaxModalProps {
  isOpen: boolean;
  text: string;
  onClose: () => void;
}

export function SpintaxPreviewModal({ isOpen, text, onClose }: SpintaxModalProps) {
  if (!isOpen) return null;

  const samples = Array.from({ length: 5 }, (_, i) => {
    // Generate variations with random seed
    const choices = text.replace(/\{([^{}]+)\}/g, (_, choicesStr) => {
      const options = choicesStr.split('|');
      return options[i % options.length] || options[0];
    });
    return SpintaxProcessor.replaceVariables(choices, { name: 'Rahul Sharma', city: 'Mumbai' });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">SpinTax Variations Preview</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-accent rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Each contact will receive a unique variation generated at runtime:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {samples.map((s, idx) => (
              <div key={idx} className="p-3 rounded-2xl border border-border bg-accent/30 text-xs flex justify-between items-center">
                <span className="font-medium text-foreground">{s}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(s);
                    toast.success('Copied variation to clipboard!');
                  }}
                  className="p-1 text-muted-foreground hover:text-primary"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={onClose} className="w-full">
          Close Preview
        </Button>
      </div>
    </div>
  );
}

interface TestMessageModalProps {
  isOpen: boolean;
  instances: InstanceData[];
  messageData: any;
  onClose: () => void;
}

export function TestMessageModal({ isOpen, instances, messageData, onClose }: TestMessageModalProps) {
  const [instanceId, setInstanceId] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendTest = async () => {
    if (!instanceId || !phone) {
      toast.error('Please select an instance and enter target phone number');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/messages/test', {
        instanceId,
        phone,
        messageData,
      });
      toast.success('Test message sent to your WhatsApp number!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send test message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Send Single Test Message</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-accent rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-muted-foreground">Select WhatsApp Number</label>
            <select
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              className="w-full h-11 rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none"
            >
              <option value="" disabled>
                -- Choose WhatsApp Number --
              </option>
              {instances.map((inst) => (
                <option key={inst.instanceId} value={inst.instanceId}>
                  {inst.name} ({inst.phoneNumber || inst.status})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Your Test Phone Number"
            placeholder="+91 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendTest} isLoading={isLoading}>
            Send Test Message
          </Button>
        </div>
      </div>
    </div>
  );
}
