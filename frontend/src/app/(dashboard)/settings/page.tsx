'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from 'next-themes';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/apiClient';
import { User, Lock, Sun, Moon, Sliders, ShieldAlert, Key, Users, Camera, Bot, Layers } from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const isAdmin = user?.role === 'admin';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Admin Feature Enable/Disable Toggles
  const [featureToggles, setFeatureToggles] = useState({
    enableOtpSender: false, // Turned OFF by default per directive!
    enableGroupGrabber: true,
    enableStatusComposer: true,
    enableCarousel: true,
    enableButtons: true,
    enableAutoReply: true,
    enableBlacklist: true,
  });
  const [isSavingToggles, setIsSavingToggles] = useState(false);

  useEffect(() => {
    fetchFeatureToggles();
  }, []);

  const fetchFeatureToggles = async () => {
    try {
      const res = await apiClient.get('/system/features');
      if (res.data?.data) {
        setFeatureToggles((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {}
  };

  const handleToggleChange = (key: keyof typeof featureToggles) => {
    setFeatureToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveFeatureToggles = async () => {
    setIsSavingToggles(true);
    try {
      await apiClient.post('/system/features', featureToggles);
      toast.success('✅ Admin feature toggles updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update feature toggles');
    } finally {
      setIsSavingToggles(false);
    }
  };

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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings & Admin Controls</h1>
        <p className="text-sm text-muted-foreground">Manage your account profile, password, UI theme, and enable/disable features for clients.</p>
      </div>

      {/* Super-Admin Feature Management Card */}
      {isAdmin && (
        <Card className="border-amber-500/40 bg-amber-500/5 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Sliders className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-amber-300">Super-Admin Feature Enable / Disable Panel</h2>
                <p className="text-xs text-amber-200/80">Toggle features ON or OFF for clients. Disabled features will be hidden or locked across the platform.</p>
              </div>
            </div>
            <Button
              onClick={handleSaveFeatureToggles}
              isLoading={isSavingToggles}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs"
            >
              Save Feature Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* OTP Sender Toggle */}
            <label className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              !featureToggles.enableOtpSender ? 'border-rose-500/40 bg-rose-500/10' : 'border-border bg-card'
            }`}>
              <div className="flex items-center gap-2.5">
                <Key className="h-4 w-4 text-purple-400" />
                <div>
                  <p className="font-extrabold text-foreground">🔐 OTP Sender (Copy Code Button)</p>
                  <p className="text-[11px] text-muted-foreground">Currently: <b className={featureToggles.enableOtpSender ? 'text-emerald-400' : 'text-rose-400'}>{featureToggles.enableOtpSender ? 'ENABLED' : 'DISABLED (Turned Off)'}</b></p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableOtpSender}
                onChange={() => handleToggleChange('enableOtpSender')}
                className="h-5 w-5 rounded text-amber-500 focus:ring-amber-500"
              />
            </label>

            {/* Group Grabber Toggle */}
            <label className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-extrabold text-foreground">👥 WhatsApp Group Grabber</p>
                  <p className="text-[11px] text-muted-foreground">Extract group members & sync</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableGroupGrabber}
                onChange={() => handleToggleChange('enableGroupGrabber')}
                className="h-5 w-5 rounded text-amber-500"
              />
            </label>

            {/* Status Composer Toggle */}
            <label className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Camera className="h-4 w-4 text-emerald-400" />
                <div>
                  <p className="font-extrabold text-foreground">📸 WhatsApp Status & Stories</p>
                  <p className="text-[11px] text-muted-foreground">Publish status broadcast updates</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableStatusComposer}
                onChange={() => handleToggleChange('enableStatusComposer')}
                className="h-5 w-5 rounded text-amber-500"
              />
            </label>

            {/* Carousel Toggle */}
            <label className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="font-extrabold text-foreground">🎠 Carousel Messages</p>
                  <p className="text-[11px] text-muted-foreground">Multi-card product slider</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableCarousel}
                onChange={() => handleToggleChange('enableCarousel')}
                className="h-5 w-5 rounded text-amber-500"
              />
            </label>

            {/* Interactive Buttons Toggle */}
            <label className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Sliders className="h-4 w-4 text-amber-400" />
                <div>
                  <p className="font-extrabold text-foreground">💬 Interactive Buttons & Lists</p>
                  <p className="text-[11px] text-muted-foreground">Quick reply & CTA buttons</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableButtons}
                onChange={() => handleToggleChange('enableButtons')}
                className="h-5 w-5 rounded text-amber-500"
              />
            </label>

            {/* Auto Reply Bot Toggle */}
            <label className="p-3.5 rounded-2xl border border-border bg-card flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Bot className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="font-extrabold text-foreground">🤖 Auto-Reply Chatbot</p>
                  <p className="text-[11px] text-muted-foreground">Automated keyword auto-replies</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={featureToggles.enableAutoReply}
                onChange={() => handleToggleChange('enableAutoReply')}
                className="h-5 w-5 rounded text-amber-500"
              />
            </label>
          </div>
        </Card>
      )}

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
