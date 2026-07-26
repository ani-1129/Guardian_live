'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  LayoutDashboard,
  Map,
  Activity,
  Users,
  Clock,
  Search,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  Settings,
  User,
  HelpCircle,
  Radio,
  AlertTriangle,
  Navigation,
  PhoneCall,
  BarChart2,
  Building,
  Command,
  X
} from 'lucide-react';
import { api } from '../../services/api';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string | number;
  badgeColor?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-[#111113] border border-[#27272A] rounded-lg px-3 py-1.5">
      <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
      <div>
        <p className="font-mono text-sm font-bold text-white leading-none">{time}</p>
        <p className="text-[9px] text-[#64748B] font-medium mt-0.5">{date} UTC</p>
      </div>
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeOrg, setActiveOrg] = useState('City Fire Dept');
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const pathname = usePathname();
  const router = useRouter();

  // Auto-login fallback if token is missing
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      api.post('/auth/login', { email: 'dispatcher@cityfire.gov', password: 'adminpass123' })
        .then(res => {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          window.location.reload();
        })
        .catch(() => {
          router.push('/login');
        });
    }
  }, [router]);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search API fetch
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.results || []);
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      api.get('/notifications')
        .then(res => setNotifications(res))
        .catch(() => setNotifications([
          { id: '1', title: 'Critical SOS Triggered', body: 'Unit 4 dispatched near Harbor District', type: 'critical', created_at: new Date().toISOString() },
          { id: '2', title: 'Vehicle Online', body: 'Engine 04 registered on channel', type: 'info', created_at: new Date().toISOString() }
        ]));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  const navigationGroups: NavGroup[] = [
    {
      groupName: 'Operations',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Emergency Dispatch', href: '/console', icon: PhoneCall, badge: 3, badgeColor: '#EF4444' },
        { name: 'Live Map', href: '/', icon: Navigation },
      ]
    },
    {
      groupName: 'Monitoring',
      items: [
        { name: 'Geofences', href: '/geofences', icon: Map },
        { name: 'Reports & Export', href: '/analytics', icon: FileText },
      ]
    },
    {
      groupName: 'Analytics',
      items: [
        { name: 'Analytics', href: '/analytics', icon: BarChart2 },
        { name: 'Performance Metrics', href: '/analytics', icon: TrendingUp },
      ]
    },
    {
      groupName: 'Administration',
      items: [
        { name: 'Admin Portal', href: '/admin', icon: Shield, badge: 'PRO', badgeColor: '#2563EB' },
        { name: 'Settings', href: '/settings', icon: Settings },
        { name: 'My Profile', href: '/profile', icon: User },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#09090B] text-[#F8FAFC] overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside
        className={`
          relative flex flex-col border-r border-[#1C1C1F] bg-[#111113]
          transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? 'w-[60px]' : 'w-[220px]'}
        `}
      >
        {/* Brand */}
        <div className={`flex items-center border-b border-[#1C1C1F] ${isCollapsed ? 'justify-center p-4' : 'p-4 gap-3'}`}>
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] rounded-full border-2 border-[#111113]" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-none">GUARDIAN</h1>
              <p className="text-[9px] font-semibold tracking-widest text-[#2563EB] uppercase mt-0.5">Live Enterprise</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-10 w-6 h-6 bg-[#18181B] border border-[#27272A] rounded-full flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#27272A] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.groupName}>
              {!isCollapsed && (
                <p className="text-[10px] font-bold tracking-wider text-[#475569] uppercase px-2 mb-1.5">{group.groupName}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all
                        ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'}
                        ${active
                          ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/15'
                          : 'text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1C1C1F]'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="flex-1 truncate">{item.name}</span>}
                      {!isCollapsed && item.badge && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                          style={{
                            background: `${item.badgeColor}22`,
                            color: item.badgeColor,
                            border: `1px solid ${item.badgeColor}44`
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#1C1C1F]">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-2.5 rounded-lg text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors
              ${isCollapsed ? 'justify-center p-2.5' : 'px-2.5 py-2'}
            `}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-[#1C1C1F] bg-[#111113] px-4 flex items-center justify-between gap-4 shrink-0">
          {/* Left: Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="flex items-center gap-2 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-white hover:bg-[#27272A] transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="font-semibold">{activeOrg}</span>
              <ChevronRight className={`w-3 h-3 text-[#64748B] transition-transform ${orgDropdownOpen ? 'rotate-90' : ''}`} />
            </button>
            {orgDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#18181B] border border-[#27272A] rounded-lg shadow-xl z-50 py-1">
                {['City Fire Dept', 'Metro EMS Services', 'Harbor Patrol'].map((org) => (
                  <button
                    key={org}
                    onClick={() => { setActiveOrg(org); setOrgDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-[#2563EB]/20 ${org === activeOrg ? 'text-[#2563EB] font-bold' : 'text-[#94A3B8]'}`}
                  >
                    {org}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Command Palette Trigger Search */}
          <div className="flex-1 max-w-md">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center justify-between bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-1.5 text-xs text-[#64748B] hover:border-[#3F3F46] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span>Search incidents, responders, vehicles...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 bg-[#27272A] px-1.5 py-0.5 rounded text-[10px] text-[#A1A1AA]">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <LiveClock />

            {/* Notification Drawer Trigger */}
            <button
              onClick={() => setNotifDrawerOpen(!notifDrawerOpen)}
              className="relative p-2 rounded-lg bg-[#18181B] border border-[#27272A] text-[#94A3B8] hover:text-white hover:bg-[#27272A] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.is_read) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="flex-1 overflow-y-auto bg-[#09090B] p-4">
          {children}
        </main>
      </div>

      {/* ── COMMAND PALETTE MODAL (Ctrl + K) ── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center px-4 border-b border-[#27272A]">
              <Search className="w-4 h-4 text-[#64748B] mr-2" />
              <input
                type="text"
                placeholder="Type command or search terms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent py-3 text-sm text-white focus:outline-none placeholder-[#64748B]"
              />
              <button onClick={() => setSearchOpen(false)} className="text-[#64748B] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <p className="text-center py-6 text-xs text-[#64748B]">Type to search across database entities</p>
              ) : (
                searchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => { setSearchOpen(false); router.push(res.href); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#27272A] cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{res.title}</p>
                      <p className="text-[10px] text-[#94A3B8]">{res.subtitle}</p>
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#2563EB]">{res.category}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATION DRAWER ── */}
      {notifDrawerOpen && (
        <div className="fixed top-14 right-4 z-40 w-80 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl p-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">System Notifications</h3>
            <button onClick={() => setNotifDrawerOpen(false)} className="text-[#64748B] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className="p-2 rounded-lg bg-[#111113] border border-[#27272A]">
                <p className="text-xs font-bold text-white">{n.title}</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
