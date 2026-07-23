'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Mail,
  Flame,
  MessageSquare,
  Plus,
  Clock,
} from 'lucide-react';

export default function ContactDetailClientPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) fetchContactDetails();
  }, [id]);

  const fetchContactDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/crm/contacts/${id}`);
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to load contact timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await apiClient.post(`/crm/contacts/${id}/notes`, { note: newNote });
      toast.success('Note added to timeline');
      setNewNote('');
      fetchContactDetails();
    } catch (err) {
      toast.error('Failed to add note');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-mono">Loading contact timeline...</div>;
  }

  const contact = data?.contact || {};
  const timeline = data?.timeline || [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
            {contact.name ? contact.name.charAt(0).toUpperCase() : <User />}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{contact.name || 'Unknown Contact'}</h1>
            <p className="text-xs text-muted-foreground font-mono">{contact.phone}</p>
          </div>
        </div>

        <Badge variant={contact.leadScore > 50 ? 'success' : 'outline'} className="text-sm py-1 px-3">
          <Flame className="mr-1 h-4 w-4 inline" /> Score: {contact.leadScore || 0}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase text-muted-foreground border-b border-border pb-2">Contact Details</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-muted-foreground block font-bold">Email</span>
              <span className="text-foreground">{contact.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block font-bold">Stage</span>
              <Badge variant="outline" className="mt-1">{contact.stage || 'Lead'}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block font-bold">Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(contact.tags || ['WhatsApp']).map((t: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="md:col-span-2 p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase text-muted-foreground border-b border-border pb-2">Timeline Activity</h3>

          <div className="flex gap-2">
            <Input
              placeholder="Add internal note or follow-up comment..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="text-xs"
            />
            <Button size="sm" onClick={handleAddNote}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Note
            </Button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {timeline.map((item: any, idx: number) => (
              <div key={idx} className="p-3 rounded-2xl bg-accent/20 border border-border text-xs space-y-1">
                <div className="flex justify-between font-bold text-foreground">
                  <span>{item.title || 'Activity'}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
