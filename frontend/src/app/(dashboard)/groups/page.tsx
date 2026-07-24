'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Users, ShieldCheck, RefreshCw, UserPlus, Download, Search, AlertTriangle, CheckCircle, ExternalLink, Filter } from 'lucide-react';

export default function GroupGrabberPage() {
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAdminFilter, setOnlyAdminFilter] = useState(false);

  // Group Details & Member Modal
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isFetchingMembers, setIsFetchingMembers] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTagName, setSyncTagName] = useState('');
  const [syncOnlyAdmins, setSyncOnlyAdmins] = useState(false);

  useEffect(() => {
    fetchConnectedInstances();
  }, []);

  const fetchConnectedInstances = async () => {
    try {
      const res = await apiClient.get('/instances');
      const list = (res.data?.data || []).filter((i: any) => i.status === 'open');
      setInstances(list);
      if (list.length > 0) {
        setSelectedInstanceId(list[0]._id);
        fetchGroups(list[0]._id);
      }
    } catch (e) {
      setInstances([]);
    }
  };

  const fetchGroups = async (instId: string) => {
    if (!instId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/instances/${instId}/groups`);
      setGroups(res.data?.data || []);
      toast.success(`Fetched ${res.data?.data?.length || 0} WhatsApp groups!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch WhatsApp groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewGroupMembers = async (group: any) => {
    setSelectedGroup(group);
    setSyncTagName(`group-${group.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`);
    setIsFetchingMembers(true);
    try {
      const res = await apiClient.get(`/instances/${selectedInstanceId}/groups/${encodeURIComponent(group.groupJid)}/members`);
      setMembers(res.data?.data?.members || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch group members');
    } finally {
      setIsFetchingMembers(false);
    }
  };

  const handleSyncGroupMembers = async () => {
    if (!selectedGroup) return;
    setIsSyncing(true);
    try {
      const res = await apiClient.post(`/instances/${selectedInstanceId}/groups/${encodeURIComponent(selectedGroup.groupJid)}/sync`, {
        tagName: syncTagName,
        onlyAdmins: syncOnlyAdmins,
      });

      toast.success(`✅ Extracted & synced ${res.data?.data?.newContacts || 0} new members into Contacts!`);
      setSelectedGroup(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync group members');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAdmin = onlyAdminFilter ? g.isAdmin : true;
    return matchesSearch && matchesAdmin;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> WhatsApp Group Grabber
          </h1>
          <p className="text-sm text-muted-foreground">
            Extract phone numbers, admins, and members from your WhatsApp groups directly into VOXORA Contacts.
          </p>
        </div>

        {/* Account Selector */}
        {instances.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Account:</span>
            <select
              value={selectedInstanceId}
              onChange={(e) => {
                setSelectedInstanceId(e.target.value);
                fetchGroups(e.target.value);
              }}
              className="bg-accent border border-border text-foreground font-bold text-xs rounded-xl p-2.5 focus:ring-primary"
            >
              {instances.map((inst) => (
                <option key={inst._id} value={inst._id}>
                  📱 {inst.name} (+{inst.phoneNumber})
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => fetchGroups(selectedInstanceId)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Legal & Responsible Use Banner */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-200 text-xs flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
        <div>
          <p className="font-bold text-amber-300">⚠️ Responsible & Ethical Usage Disclaimer</p>
          <p className="text-amber-200/90 text-[11px]">
            Group extraction must follow local privacy guidelines and WhatsApp Terms of Service. Always ensure recipients opt-in before bulk messaging.
          </p>
        </div>
      </Card>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search group name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOnlyAdminFilter(!onlyAdminFilter)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              onlyAdminFilter
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-accent/30 text-muted-foreground'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Groups I Admin Only
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <Card className="p-12 text-center text-xs text-muted-foreground">
          Scanning WhatsApp groups from connected account...
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
          <h3 className="font-extrabold text-base text-foreground">No WhatsApp Groups Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Ensure your connected WhatsApp account is joined to active group chats.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filteredGroups.map((group) => (
            <Card key={group.groupJid} className="p-5 space-y-4 hover:border-primary/50 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                      👥
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm line-clamp-1">{group.name}</h3>
                      <p className="text-xs text-muted-foreground">{group.memberCount} members</p>
                    </div>
                  </div>
                  {group.isAdmin && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase">
                      Admin
                    </span>
                  )}
                </div>

                {group.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    "{group.description}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewGroupMembers(group)}
                  className="text-xs font-bold"
                >
                  👁️ View Members
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(group);
                    setSyncTagName(`group-${group.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`);
                    handleSyncGroupMembers();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <UserPlus className="mr-1 h-3.5 w-3.5" /> Grab Members
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Member Viewing & Sync Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-primary/40 bg-card p-6 shadow-2xl space-y-5 text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  👥 {selectedGroup.name}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedGroup.memberCount} Members Extracted</p>
              </div>
              <button onClick={() => setSelectedGroup(null)} className="p-1 rounded-xl text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {/* Sync Configuration Options */}
            <div className="p-3 rounded-2xl border border-border bg-accent/30 space-y-3 text-xs">
              <Input
                label="Assign Tag for Contact Database *"
                value={syncTagName}
                onChange={(e) => setSyncTagName(e.target.value)}
                className="text-xs font-mono"
              />
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground">
                <input
                  type="checkbox"
                  checked={syncOnlyAdmins}
                  onChange={(e) => setSyncOnlyAdmins(e.target.checked)}
                  className="rounded text-primary focus:ring-primary"
                />
                Extract Only Group Admins
              </label>
            </div>

            {/* Members List Table Preview */}
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border bg-background p-3 space-y-1.5 text-xs">
              {isFetchingMembers ? (
                <div className="text-center py-6 text-muted-foreground">Fetching group participants...</div>
              ) : members.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No member details available. Click Grab Members below.</div>
              ) : (
                members.map((m) => (
                  <div key={m.jid} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/40 border border-border/50">
                    <span className="font-mono font-bold text-foreground">+{m.phone}</span>
                    {m.isAdmin && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                        Admin
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedGroup(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSyncGroupMembers}
                isLoading={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <UserPlus className="mr-1.5 h-4 w-4" /> Save Members to Contacts
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
