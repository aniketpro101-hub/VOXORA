'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, X } from 'lucide-react';

interface DuplicatePreviewModalProps {
  isOpen: boolean;
  report: any;
  onConfirm: (strategy: 'keep_first' | 'keep_latest' | 'merge') => void;
  onClose: () => void;
}

export default function DuplicatePreviewModal({
  isOpen,
  report,
  onConfirm,
  onClose,
}: DuplicatePreviewModalProps) {
  const [strategy, setStrategy] = React.useState<'keep_first' | 'keep_latest' | 'merge'>('keep_first');

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Contact Analysis & Duplicate Report</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-accent rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-card border border-border">
            <p className="text-xl font-black text-foreground">{report.totalContacts}</p>
            <p className="text-[10px] text-muted-foreground">Total Rows</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xl font-black text-emerald-500">{report.uniqueCount}</p>
            <p className="text-[10px] text-muted-foreground">Unique Contacts</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xl font-black text-amber-500">{report.duplicateCount}</p>
            <p className="text-[10px] text-muted-foreground">Duplicates</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <p className="text-xl font-black text-rose-500">{report.blacklistedCount}</p>
            <p className="text-[10px] text-muted-foreground">Blacklisted</p>
          </div>
        </div>

        {/* Handling Strategy Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Duplicate Handling Strategy</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'keep_first', title: 'Keep First', desc: 'Ignore subsequent duplicates' },
              { id: 'keep_latest', title: 'Keep Latest', desc: 'Use newest row data' },
              { id: 'merge', title: 'Merge Data', desc: 'Combine names & tags' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStrategy(st.id as any)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  strategy === st.id ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary' : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <p className="text-xs font-bold text-foreground">{st.title}</p>
                <p className="text-[10px] text-muted-foreground">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(strategy)} className="bg-emerald-600 hover:bg-emerald-700">
            Proceed with Clean List ({report.uniqueCount} Contacts)
          </Button>
        </div>
      </div>
    </div>
  );
}
