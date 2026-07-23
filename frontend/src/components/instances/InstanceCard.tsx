'use client';

import React from 'react';
import { InstanceData } from '@/services/instanceApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Smartphone,
  BatteryCharging,
  RefreshCw,
  Power,
  Trash2,
  QrCode,
  User,
} from 'lucide-react';

interface InstanceCardProps {
  instance: InstanceData;
  onRestart: (id: string) => void;
  onDisconnect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefreshQR: (id: string) => void;
}

export default function InstanceCard({
  instance,
  onRestart,
  onDisconnect,
  onDelete,
  onRefreshQR,
}: InstanceCardProps) {
  const isConnected = instance.status === 'open';
  const isConnecting = instance.status === 'connecting';

  return (
    <Card className="relative overflow-hidden transition-all hover:border-primary/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {instance.profilePic ? (
              <img
                src={instance.profilePic}
                alt={instance.name}
                className="h-14 w-14 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Smartphone className="h-7 w-7" />
              </div>
            )}
            <span
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${
                isConnected
                  ? 'bg-emerald-500 animate-pulse'
                  : isConnecting
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground">{instance.name}</h3>
              {isConnected && <Badge variant="success">CONNECTED</Badge>}
              {isConnecting && <Badge variant="warning">CONNECTING</Badge>}
              {!isConnected && !isConnecting && <Badge variant="danger">DISCONNECTED</Badge>}
            </div>

            <p className="text-xs text-muted-foreground mt-0.5">
              {instance.phoneNumber ? instance.phoneNumber : 'No phone connected'}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-2">
              <span className="flex items-center gap-1 font-medium">
                <BatteryCharging className="h-3.5 w-3.5 text-emerald-500" />
                Battery: {instance.batteryLevel ?? 85}%
              </span>
              <span>
                Daily Messages: <strong className="text-foreground">{instance.currentDayCount || 0} / {instance.dailyLimit}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
          {!isConnected && (
            <Button size="sm" variant="outline" onClick={() => onRefreshQR(instance._id)}>
              <QrCode className="mr-1.5 h-3.5 w-3.5" /> Show QR
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={() => onRestart(instance._id)} title="Restart Connection">
            <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>

          {isConnected && (
            <Button size="sm" variant="outline" onClick={() => onDisconnect(instance._id)}>
              <Power className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Disconnect
            </Button>
          )}

          <Button size="sm" variant="ghost" onClick={() => onDelete(instance._id)} title="Delete Instance">
            <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
