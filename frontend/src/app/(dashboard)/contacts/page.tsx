'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QuickMessageModal from '@/components/contacts/QuickMessageModal';
import ContactDetailModal from '@/components/contacts/ContactDetailModal';
import WhatsAppImportModal from '@/components/contacts/WhatsAppImportModal';
import { parseNumbersFromText } from '@/lib/phoneNormalizer';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  Users,
  FolderPlus,
  Upload,
  FileSpreadsheet,
  Trash2,
  Download,
  Plus,
  CheckCircle2,
  History,
  FileText,
  Search,
  Zap,
  Star,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  Phone,
  Inbox,
} from 'lucide-react';

export default function ContactManagementPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'favorites' | 'recent' | 'imports' | 'unsaved' | 'whatsapp' | 'blacklisted'>('all');

  // Stats
  const [stats, setStats] = useState({ total: 0, groups: 0, today: 0, whatsapp: 0, blacklisted: 0 });

  // Data Lists
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [importHistory, setImportHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isQuickMsgOpen, setIsQuickMsgOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isWaImportOpen, setIsWaImportOpen] = useState(false);
  const [waImportType, setWaImportType] = useState<'contacts' | 'group_members'>('contacts');
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);

  // Group Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Paste / Import Tab State
  const [pasteText, setPasteText] = useState('');
  const [defaultCode, setDefaultCode] = useState('91');
  const [selectedGroup, setSelectedGroup] = useState('General');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsRes = await apiClient.get('/contacts/stats').catch(() => null);
      if (statsRes?.data?.data) setStats(statsRes.data.data);

      const groupsRes = await apiClient.get('/contacts/groups').catch(() => null);
      setGroups(groupsRes?.data?.data || []);

      const historyRes = await apiClient.get('/contacts/imports').catch(() => null);
      setImportHistory(historyRes?.data?.data || []);

      const contactsRes = await apiClient.get('/contacts', { params: { tab: activeTab, search: searchTerm } });
      setContacts(contactsRes.data?.data?.contacts || []);
    } catch (err: any) {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    try {
      await apiClient.post('/contacts/groups', { name: newGroupName, description: newGroupDesc });
      toast.success(`Group "${newGroupName}" created!`);
      setIsGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create group');
    }
  };

  const parsed = parseNumbersFromText(pasteText, defaultCode);

  const handleImportNumbers = async () => {
    if (parsed.validCount === 0) {
      toast.error('No valid numbers to import');
      return;
    }
    try {
      await apiClient.post('/contacts/imports', {
        fileName: 'Paste_Import.txt',
        totalRows: parsed.total,
        validRows: parsed.validCount,
        invalidRows: parsed.invalidCount,
        duplicateRows: parsed.duplicateCount,
        groupName: selectedGroup,
      });
      toast.success(`Imported ${parsed.validCount} valid contacts to "${selectedGroup}" group!`);
      setPasteText('');
      fetchData();
      setActiveTab('imports');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Import failed');
    }
  };

  const handleVCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const res = await apiClient.post('/contacts/import/vcard', { fileContent: text });
      toast.success(res.data?.message || `vCard imported successfully!`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to parse vCard file');
    }
  };

  const handleGoogleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const res = await apiClient.post('/contacts/import/google-csv', { fileContent: text });
      toast.success(res.data?.message || `Google Contacts CSV imported!`);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to parse Google Contacts CSV');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Page Header & Stats Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Contact Management
          </h1>
          <p className="text-sm text-muted-foreground">Manage contacts, segment groups, and import WhatsApp lists.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsQuickMsgOpen(true)} className="bg-amber-400 text-slate-950 font-bold hover:bg-amber-300">
            <Zap className="mr-1.5 h-4 w-4" /> Quick Message
          </Button>

          <Button onClick={() => setIsGroupModalOpen(true)} variant="outline" className="font-bold border-border">
            <FolderPlus className="mr-1.5 h-4 w-4" /> Create Group
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-3.5 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Total Contacts</p>
          <p className="text-xl font-extrabold text-foreground">{stats.total}</p>
        </Card>
        <Card className="p-3.5 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Contact Groups</p>
          <p className="text-xl font-extrabold text-primary">{stats.groups}</p>
        </Card>
        <Card className="p-3.5 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">WhatsApp Active</p>
          <p className="text-xl font-extrabold text-emerald-400">{stats.whatsapp}</p>
        </Card>
        <Card className="p-3.5 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Starred Favorites</p>
          <p className="text-xl font-extrabold text-amber-400">{stats.today}</p>
        </Card>
        <Card className="p-3.5 space-y-1">
          <p className="text-[11px] font-bold text-muted-foreground uppercase">Blacklisted</p>
          <p className="text-xl font-extrabold text-rose-400">{stats.blacklisted}</p>
        </Card>
      </div>

      {/* Contacts List Card */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts by name, phone, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchData()}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-accent/40 text-xs text-foreground focus:outline-none"
            />
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">Loading contacts from database...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs font-bold text-foreground">No Contacts Found</p>
              <p className="text-[11px] text-muted-foreground">Add contacts manually or import from CSV/WhatsApp.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Name / Phone</th>
                  <th className="py-2.5 px-3">WhatsApp Status</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-extrabold text-foreground">{c.name || 'Unnamed Contact'}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">+{c.phone}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.isOnWhatsApp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent text-muted-foreground'}`}>
                        {c.isOnWhatsApp ? 'WhatsApp Registered' : 'Not Verified'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-[11px] uppercase font-bold">{c.source || 'Manual'}</td>
                    <td className="py-3 px-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedContact(c); setIsDetailOpen(true); }}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modals */}
      <QuickMessageModal isOpen={isQuickMsgOpen} onClose={() => setIsQuickMsgOpen(false)} />
      {selectedContact && <ContactDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} contact={selectedContact} onRefresh={fetchData} />}
      <WhatsAppImportModal isOpen={isWaImportOpen} onClose={() => setIsWaImportOpen(false)} type={waImportType} onRefresh={fetchData} />
    </div>
  );
}
