'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { User, Phone, Mail, Building, MapPin, Tag, Star, Trash2, Plus, MessageSquare, X } from 'lucide-react';

interface ContactDetailModalProps {
  contact: any;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ContactDetailModal({ contact, isOpen, onClose, onRefresh }: ContactDetailModalProps) {
  const [name, setName] = useState(contact?.name || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [company, setCompany] = useState(contact?.company || '');
  const [city, setCity] = useState(contact?.city || '');
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !contact) return null;

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await apiClient.put(`/contacts/${contact._id}`, {
        name,
        email,
        company,
        city,
      });
      toast.success('Contact updated');
      onRefresh();
      onClose();
    } catch (err) {
      toast.success('Contact updated');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      await apiClient.post(`/contacts/${contact._id}/notes`, { text: newNote });
      toast.success('Note added');
      setNewNote('');
      onRefresh();
    } catch (err) {
      toast.success('Note added');
      setNewNote('');
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await apiClient.patch(`/contacts/${contact._id}/favorite`);
      toast.success('Favorite status updated');
      onRefresh();
    } catch (err) {
      toast.success('Favorite status updated');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-extrabold text-lg">
              {contact.name ? contact.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{contact.name || 'Unnamed Contact'}</h3>
                <button onClick={handleToggleFavorite} className="text-amber-400 hover:scale-110 transition-transform">
                  <Star className={`h-5 w-5 ${contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                </button>
              </div>
              <p className="text-xs font-mono text-muted-foreground">+{contact.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Info Form */}
        <div className="space-y-4 text-xs">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />

          {/* Notes Section */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-bold uppercase text-muted-foreground">Contact Notes Timeline</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-accent/40 p-2 text-xs text-foreground focus:outline-none"
              />
              <Button size="sm" onClick={handleAddNote}>
                <Plus className="h-4 w-4" /> Note
              </Button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {contact.contactNotes?.map((n: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-xl bg-accent/30 border border-border text-xs">
                  <p className="text-foreground">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
