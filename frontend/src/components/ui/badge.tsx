import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'purple';
}

export function Badge({ className, variant = 'primary', ...props }: BadgeProps) {
  const variants = {
    primary: 'bg-primary/15 text-primary border-primary/20',
    success: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
    danger: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    outline: 'border border-border text-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
