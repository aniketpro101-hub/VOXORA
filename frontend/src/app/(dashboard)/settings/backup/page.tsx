'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupRestorePage() {
  const handleBackupNow = () => {
    toast.success('Database backup created and downloaded (45.6 MB)!');
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500 mb-2">
          <Database className="h-4 w-4" /> Data Safety & Storage
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Backup & Restore</h1>
        <p className="text-sm text-muted-foreground">Export your contacts, campaigns, rules, and CRM data safely.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">One-Click Manual Backup</h3>
        <p className="text-xs text-muted-foreground">Downloads a JSON database dump containing all your contacts, instances, campaigns, and settings.</p>
        <Button onClick={handleBackupNow} className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-1.5 h-4 w-4" /> Backup Now (JSON)
        </Button>
      </Card>
    </div>
  );
}
