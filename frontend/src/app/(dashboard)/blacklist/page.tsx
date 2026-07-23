'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Plus,
  Unlock,
  Trash2,
  Filter,
  FileSpreadsheet,
  Download,
  Key,
  X,
} from 'lucide-react';

export default function BlacklistPage() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Ban Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banPhone, setBanPhone] = useState('');
  const [banReason, setBanReason] = useState('Manual Ban');

  useEffect(() => {
    fetchBlacklist();
  }, [categoryFilter, search]);

  const fetchBlacklist = async () => {
    setIsLoading(true);
    try {
      let url = `/blacklist?category=${categoryFilter === 'all' ? '' : categoryFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await apiClient.get(url);
      setNumbers(res.data.data.numbers || []);
    } catch (err) {
      toast.error('Failed to load blacklist numbers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnban = async (phone: string) => {
    try {
      await apiClient.delete(`/blacklist/${phone}`);
      toast.success(`Unbanned ${phone}`);
      fetchBlacklist();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to unban (Admin role required)');
    }
  };

  const handleAddBan = async () => {
    if (!banPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    try {
      await apiClient.post('/blacklist', {
        phone: banPhone,
        reason: banReason,
        category: 'manual',
      });

      toast.success(`Blacklisted ${banPhone}`);
      setIsModalOpen(false);
      setBanPhone('');
      fetchBlacklist();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to ban number');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-500 mb-2">
            <ShieldAlert className="h-4 w-4" /> Blacklist & Spam Shield
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Blacklist Manager</h1>
          <p className="text-sm text-muted-foreground">
            Auto-blacklist contacts based on opt-out replies (STOP), angry responses, "Not Interested" buttons, and invalid numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/blacklist/keywords">
            <Button variant="outline">
              <Key className="mr-1.5 h-4 w-4 text-amber-500" /> Opt-Out Keywords
            </Button>
          </Link>
          <Button onClick={() => setIsModalOpen(true)} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="mr-1.5 h-4 w-4" /> Add Manual Ban
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-accent/40 border border-border w-max overflow-x-auto">
          {['all', 'opt_out', 'angry', 'blocked', 'invalid', 'spam', 'manual'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                categoryFilter === cat ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <Input
          placeholder="Search by phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* Blacklist Table Card */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-accent/50 border-b border-border font-bold text-foreground">
              <tr>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Category</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Date Added</th>
                <th className="p-3 text-right">Actions (Admin Only)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {numbers.map((item) => (
                <tr key={item._id} className="hover:bg-accent/20">
                  <td className="p-3 font-bold text-rose-500">{item.phone}</td>
                  <td className="p-3">
                    <Badge variant={item.category === 'angry' ? 'danger' : item.category === 'opt_out' ? 'warning' : 'outline'}>
                      {item.category.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3 text-foreground font-medium">{item.reason}</td>
                  <td className="p-3 text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => handleUnban(item.phone)}>
                      <Unlock className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Unban
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Ban Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground">Add Manual Blacklist Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-muted-foreground hover:bg-accent rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Input label="Phone Number *" placeholder="+91 9876543210" value={banPhone} onChange={(e) => setBanPhone(e.target.value)} />
              <Input label="Reason" placeholder="User requested manual opt-out" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBan} className="bg-rose-600 hover:bg-rose-700">
                Blacklist Number
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
