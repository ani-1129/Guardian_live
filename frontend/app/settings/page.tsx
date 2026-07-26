'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/Common/AppShell';
import { api } from '../../services/api';
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  MapPin,
  Shield,
  Bell,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({
    org_name: 'City Fire Dept & Dispatch Agency',
    timezone: 'UTC',
    map_provider: 'OpenStreetMap',
    theme: 'dark',
    units: 'metric'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res))
      .catch(err => console.error(err));
  }, []);

  const handleSave = async (key: string, value: string) => {
    await api.post('/settings', { key, value });
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-[#2563EB]" />
              SYSTEM & ENTERPRISE CONFIGURATION
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">Manage organization parameters, map rendering engine, security policies, and localization</p>
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Settings Saved
            </div>
          )}
        </div>

        <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1C1C1F] pb-2">
            <Globe className="w-4 h-4 text-[#2563EB]" /> General Organization Settings
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Organization Name</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={settings.org_name || ''}
                  onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
                  className="flex-1 bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => handleSave('org_name', settings.org_name)}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8] flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Map Provider Engine</label>
                <select
                  value={settings.map_provider || 'OpenStreetMap'}
                  onChange={(e) => handleSave('map_provider', e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                >
                  <option value="OpenStreetMap">OpenStreetMap (Vector standard)</option>
                  <option value="Satellite">Satellite Hybrid View</option>
                  <option value="CartoDB Dark">CartoDB Dark Matter</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">System Timezone</label>
                <select
                  value={settings.timezone || 'UTC'}
                  onChange={(e) => handleSave('timezone', e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                >
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="EST">Eastern Standard Time (EST)</option>
                  <option value="PST">Pacific Standard Time (PST)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-[#1C1C1F] pb-2">
            <Shield className="w-4 h-4 text-[#22C55E]" /> Security & Authentication Policies
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181B] border border-[#27272A]">
              <div>
                <p className="font-bold text-white">Require Two-Factor Authentication (2FA)</p>
                <p className="text-[10px] text-[#94A3B8]">Enforce TOTP authenticator setup for all dispatchers & admins</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-[#2563EB]" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#18181B] border border-[#27272A]">
              <div>
                <p className="font-bold text-white">Session Inactivity Lock</p>
                <p className="text-[10px] text-[#94A3B8]">Automatically terminate active session after 60 minutes of inactivity</p>
              </div>
              <input type="checkbox" defaultChecked className="accent-[#2563EB]" />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
