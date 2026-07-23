import React from 'react';
import '@/styles/globals.css';
import Providers from '@/components/shared/Providers';

export const metadata = {
  title: 'VOXORA — Enterprise Bulk WhatsApp Software & CRM',
  description: 'World-class WhatsApp automation, anti-ban engine, campaign manager, and smart CRM by Mr. Aniket Samant (@actasiff).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
