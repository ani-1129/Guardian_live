'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/Common/AppShell';
import { api } from '../../services/api';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  Key,
  Smartphone,
  Shield,
  Save,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  // Contacts & Sessions
  const [contacts, setContacts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    api.get('/profile/me')
      .then(res => {
        setUser(res);
        setFullName(res.full_name || '');
        setPhone(res.phone_number || '');
        setAddress(res.address || '');
      })
      .catch(err => console.error(err));

    api.get('/profile/contacts').then(setContacts).catch(() => {});
    api.get('/profile/sessions').then(setSessions).catch(() => {});
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await api.put('/profile/me', {
      full_name: fullName,
      phone_number: phone,
      address: address
    });
    setUser(updated);
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/profile/password', { current_password: currentPw, new_password: newPw });
      setPwMsg('Password updated successfully!');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwMsg(err.message || 'Failed to update password');
    }
  };

  const handleTerminateSession = async (id: string) => {
    await api.delete(`/profile/sessions/${id}`);
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white font-extrabold text-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <div>
            <h1 className="text-lg font-black text-white">{user?.full_name || 'Responder Account'}</h1>
            <p className="text-xs text-[#94A3B8]">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#2563EB]">
                Role: {user?.roles?.join(', ') || 'Admin'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E]">
                ● Verified Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info & Password Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Edit Profile Form */}
          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1C1C1F] pb-2 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-[#2563EB]" /> Personal Details
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8] flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> Save Profile Changes
              </button>
            </form>
          </div>

          {/* Security & Password */}
          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1C1C1F] pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#EF4444]" /> Security & Password
            </h2>
            <form onSubmit={handleChangePw} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              {pwMsg && <p className="text-xs text-[#22C55E] font-semibold">{pwMsg}</p>}
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-bold text-white hover:bg-[#27272A]"
              >
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#2563EB]" /> Connected Active Sessions
          </h2>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-[#64748B]">Current session active on this browser</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-[#18181B] border border-[#27272A]">
                  <div>
                    <p className="text-xs font-bold text-white">Browser Session ({s.ip_address || '127.0.0.1'})</p>
                    <p className="text-[10px] text-[#94A3B8]">Logged in: {new Date(s.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleTerminateSession(s.id)}
                    className="text-xs font-bold text-[#EF4444] hover:underline"
                  >
                    Terminate Session
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
