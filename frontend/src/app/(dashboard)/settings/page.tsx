'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { User, Lock, Sun, Moon, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await apiClient.put('/auth/profile', { name, phone });
      setUser(res.data.data.user);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      await apiClient.put('/auth/change-password', { oldPassword, newPassword });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings & Preferences</h1>
        <p className="text-sm text-muted-foreground">Manage your account profile, password, and UI theme options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Profile Information</CardTitle>
                <CardDescription>Update your display name & contact info</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address (Read Only)" value={user?.email || ''} disabled />
            <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button type="submit" isLoading={isUpdatingProfile} className="w-full">
              Save Profile Changes
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>Change your secret account password</CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="secondary" isLoading={isUpdatingPassword} className="w-full">
              Update Password
            </Button>
          </form>
        </Card>
      </div>

      {/* Theme Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance & Theme</CardTitle>
          <CardDescription>Choose between Light Mode and Dark Mode interface</CardDescription>
        </CardHeader>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border ${
              theme === 'light' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground'
            } transition-all`}
          >
            <Sun className="h-5 w-5 text-amber-500" />
            <span>Light Mode</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border ${
              theme === 'dark' ? 'border-primary bg-primary/10 text-primary font-bold' : 'border-border bg-card text-muted-foreground'
            } transition-all`}
          >
            <Moon className="h-5 w-5 text-purple-400" />
            <span>Dark Mode</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
