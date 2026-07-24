'use client';

import React, { useState, useEffect } from 'react';
import { Turtle, Timer, Zap, Rocket, AlertTriangle, Check, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface Props {
  contactCount: number;
  instanceCount?: number;
  onSelect: (modeId: string) => void;
  selectedMode?: string;
}

export default function SpeedModeSelector({
  contactCount,
  instanceCount = 1,
  onSelect,
  selectedMode = 'medium',
}: Props) {
  const [modes, setModes] = useState<any[]>([]);
  const [selected, setSelected] = useState(selectedMode);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<any>(null);

  useEffect(() => {
    fetchModes();
  }, [contactCount, instanceCount]);

  const fetchModes = async () => {
    try {
      const res = await apiClient.get(`/campaigns/speed-modes?contacts=${contactCount}&instances=${instanceCount}`);
      setModes(res.data?.data?.modes || []);
    } catch (e) {
      setModes([]);
    }
  };

  const handleModeClick = (mode: any) => {
    if (mode.riskLevel === 'high' || mode.riskLevel === 'critical') {
      setPendingMode(mode);
      setShowWarningModal(true);
    } else {
      setSelected(mode.id);
      onSelect(mode.id);
    }
  };

  const handleConfirmHighRisk = () => {
    if (pendingMode) {
      setSelected(pendingMode.id);
      onSelect(pendingMode.id);
    }
    setShowWarningModal(false);
    setPendingMode(null);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'minimal':
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-accent text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            🚀 Choose Sending Speed & Risk Level
          </h3>
          <p className="text-xs text-muted-foreground">
            Faster speed = higher sending volume per hour. Choose based on your WhatsApp account age.
          </p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-accent text-foreground">
          {contactCount.toLocaleString()} Contacts Target
        </span>
      </div>

      {/* Speed Mode Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {modes.map((mode) => {
          const isSelected = selected === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeClick(mode)}
              className={`p-4 rounded-2xl border text-left transition-all relative space-y-3 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-lg'
                  : 'border-border bg-accent/20 hover:border-primary/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                    <span>{mode.icon}</span> {mode.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{mode.description}</p>
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="p-1.5 rounded-lg bg-background border border-border">
                  <span className="text-muted-foreground block">Est. Time</span>
                  <b className="text-foreground">{mode.estimate?.humanReadable || 'N/A'}</b>
                </div>
                <div className="p-1.5 rounded-lg bg-background border border-border">
                  <span className="text-muted-foreground block">Ban Risk</span>
                  <b className={mode.riskColor === 'green' ? 'text-emerald-400' : mode.riskColor === 'yellow' ? 'text-amber-400' : 'text-rose-400'}>
                    {mode.banProbability}
                  </b>
                </div>
                <div className="p-1.5 rounded-lg bg-background border border-border">
                  <span className="text-muted-foreground block">Per Hour</span>
                  <b className="text-foreground">{mode.hourlyLimit} msgs</b>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className={`px-2 py-0.5 rounded-full border font-bold uppercase ${getRiskBadge(mode.riskLevel)}`}>
                  Risk: {mode.riskLevel}
                </span>
                <span className="text-muted-foreground italic truncate max-w-[160px]">
                  {mode.recommendedFor}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* High Risk Confirmation Modal */}
      {showWarningModal && pendingMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-rose-500/50 bg-card p-6 shadow-2xl space-y-4 text-foreground text-center">
            <div className="h-14 w-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-rose-300">
                ⚠️ High Speed Mode Selected ({pendingMode.name})
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                You have selected a high-velocity sending mode ({pendingMode.banProbability} ban probability).
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200/90 text-left space-y-1">
              <p className="font-bold text-rose-300">Important Advisory:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>High speed sending should only be used on established accounts (30+ days old).</li>
                <li>Ensure recipients have opted-in or interact with your messages.</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowWarningModal(false);
                  setSelected('medium');
                  onSelect('medium');
                }}
                className="flex-1 py-2.5 rounded-xl border border-border bg-accent/40 hover:bg-accent text-xs font-bold"
              >
                Use Safe Mode Instead
              </button>
              <button
                type="button"
                onClick={handleConfirmHighRisk}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                I Accept Risk & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
