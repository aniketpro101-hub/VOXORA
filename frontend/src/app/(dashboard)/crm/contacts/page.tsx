'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Users, Plus, Filter, Flame, Eye } from 'lucide-react';

export default function ContactsListPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, [search]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/crm/contacts?search=${encodeURIComponent(search)}`);
      setContacts(res.data.data.contacts || []);
    } catch (err) {
      toast.error('Failed to load contacts list');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Contact Database</h1>
          <p className="text-sm text-muted-foreground">Manage your customer profiles, lead scores, and WhatsApp engagement tags.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/contacts/import">
            <Button variant="outline">Import Contacts</Button>
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <Input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/50 border-b border-border font-bold text-foreground">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Lifecycle Stage</th>
                <th className="p-3">Score</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((c) => (
                <tr key={c._id} className="hover:bg-accent/20">
                  <td className="p-3 font-bold text-foreground">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.phone}</td>
                  <td className="p-3">
                    <Badge variant="outline" className="uppercase">
                      {c.lifecycleStage || 'LEAD'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-amber-500">🔥 {c.engagementScore || 0}</span>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/crm/contacts/${c._id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-1 h-3.5 w-3.5" /> View Profile
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
