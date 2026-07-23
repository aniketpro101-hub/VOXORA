'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Clock, Sparkles, X, Send } from 'lucide-react';

interface PreflightModalProps {
  isOpen: boolean;
  report: any;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function PreflightModal({
  isOpen,
  report,
  isLoading = false,
  onConfirm,
  onClose,
}: PreflightModalProps) {
  if (!isOpen || !report) return null;

  const canProceed = report.canProceed !== false && report.overallStatus !== 'blocked';
  const hasWarnings = report.overallStatus === 'warning' || (report.warnings && report.warnings.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${canProceed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">Anti-Ban Preflight Safety Audit</h2>
              <p className="text-xs text-muted-foreground">Pre-campaign safety diagnostics & risk analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Risk Score Gauge Banner */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/40 border border-border">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase">Overall Audit Status</span>
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-black text-foreground uppercase">{report.overallStatus || 'SAFE'}</h3>
              <Badge variant={report.overallStatus === 'safe' ? 'success' : report.overallStatus === 'warning' ? 'warning' : 'danger'}>
                Safety Score: {report.riskScore ?? 95}/100
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Estimated Duration</span>
            <p className="text-sm font-bold text-primary flex items-center gap-1 justify-end mt-0.5">
              <Clock className="h-4 w-4" /> {report.estimatedCompletionTime || '15m'}
            </p>
          </div>
        </div>

        {/* Diagnostic Checks List */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Diagnostic Audit Checks</label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {report.checks?.map((check: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
                <div className="flex items-center gap-3">
                  {check.status === 'pass' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                  {check.status === 'warning' && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                  {check.status === 'fail' && <XCircle className="h-4 w-4 text-rose-500 shrink-0" />}
                  <div>
                    <span className="font-bold text-foreground">{check.name}: </span>
                    <span className="text-muted-foreground">{check.message}</span>
                  </div>
                </div>
                <Badge variant={check.status === 'pass' ? 'success' : check.status === 'warning' ? 'warning' : 'danger'}>
                  {check.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions & Warnings */}
        {report.suggestions?.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
            <span className="font-bold text-amber-500 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Optimization Suggestions:
            </span>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
              {report.suggestions.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center gap-3 justify-end pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          {hasWarnings && canProceed && (
            <Button
              onClick={onConfirm}
              isLoading={isLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Start Anyway
            </Button>
          )}

          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={!canProceed}
            className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white"
          >
            <Send className="mr-2 h-4 w-4" /> Start Campaign Safely
          </Button>
        </div>
      </div>
    </div>
  );
}
