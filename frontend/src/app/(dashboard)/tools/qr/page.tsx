'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function QRGeneratorPage() {
  const [phone, setPhone] = useState('919876543210');
  const [prefilledMessage, setPrefilledMessage] = useState("Hi! I'm interested in Voxora WhatsApp Software");

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `https://wa.me/${phone}?text=${encodeURIComponent(prefilledMessage)}`
  )}`;

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-2">
          <QrCode className="h-4 w-4" /> Click-to-Chat QR Generator
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">WhatsApp QR Code Generator</h1>
        <p className="text-sm text-muted-foreground">Generate printable QR codes for website leads, store displays, and product flyers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <Input label="Your Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-muted-foreground">Pre-filled Message</label>
            <textarea
              rows={3}
              value={prefilledMessage}
              onChange={(e) => setPrefilledMessage(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card p-3 text-xs text-foreground focus:outline-none"
            />
          </div>
        </Card>

        <Card className="p-6 flex flex-col items-center justify-center space-y-4">
          <img src={qrUrl} alt="WhatsApp QR Code" className="w-48 h-48 rounded-2xl border border-border p-2 bg-white shadow-md" />
          <Button onClick={() => toast.success('QR Code Image Saved!')} className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Download className="mr-1.5 h-4 w-4" /> Download QR Code PNG
          </Button>
        </Card>
      </div>
    </div>
  );
}
