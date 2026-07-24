'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import {
  LayoutDashboard,
  Send,
  Bot,
  Users,
  Smartphone,
  BarChart3,
  ShieldAlert,
  FileText,
  UserCheck,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Zap,
  Camera,
  UserPlus,
} from 'lucide-react';

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  icon: any;
  children?: NavChild[];
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    Campaigns: true,
    Contacts: true,
  });

  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const toggleSubmenu = (menuLabel: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      label: 'Campaigns',
      icon: Send,
      children: [
        { label: 'All Campaigns', href: '/campaigns' },
        { label: '⚡ Quick Send & OTP', href: '/campaigns/quick' },
        { label: '+ New Campaign', href: '/campaigns/new' },
      ],
    },
    { label: 'Auto-Reply Bot', href: '/auto-reply', icon: Bot },
    {
      label: 'Contacts',
      icon: Users,
      children: [
        { label: 'All Contacts', href: '/contacts' },
        { label: 'CRM Pipeline', href: '/crm' },
      ],
    },
    { label: 'Group Grabber', href: '/groups', icon: UserPlus },
    { label: 'Status & Stories', href: '/status', icon: Camera },
    { label: 'WhatsApp Numbers', href: '/instances', icon: Smartphone },
    { label: 'Reports & Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'Blacklist System', href: '/blacklist', icon: ShieldAlert },
    { label: 'Templates', href: '/templates', icon: FileText },
    { label: 'Team Management', href: '/settings/team', icon: UserCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'About VOXORA', href: '/about', icon: Info },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-300 z-30 h-screen sticky top-0',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyanAccent text-white shadow-lg shadow-primary/30">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-cyanAccent bg-clip-text text-transparent">
                VOXORA
              </span>
              <span className="block text-[10px] text-muted-foreground font-semibold tracking-wider uppercase">
                Enterprise v1.0
              </span>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyanAccent text-white shadow-lg shadow-primary/30">
            <Zap className="h-6 w-6 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedMenus[item.label];

          const isParentActive =
            (item.href && (pathname === item.href || pathname?.startsWith(item.href + '/'))) ||
            (hasChildren && item.children?.some((c) => pathname === c.href));

          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.label)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                    isParentActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    collapsed && 'justify-center px-0'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5 shrink-0', isParentActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExpanded && 'rotate-180')} />
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div className="ml-7 pl-2 border-l border-border space-y-1">
                    {item.children?.map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'block rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                            isChildActive
                              ? 'bg-primary text-white shadow-sm font-bold'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          )}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href || '#'}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                isParentActive
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              title={collapsed ? item.label : undefined}
            >
              {isParentActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-primary" />}
              <Icon className={cn('h-5 w-5 shrink-0', isParentActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="border-t border-border p-3">
        <div className={cn('flex items-center gap-3 rounded-xl p-2 bg-accent/50', collapsed && 'justify-center p-1')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user?.name || 'VOXORA User'}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'Agent'}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
              className="rounded-lg p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
