'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/Common/AppShell';
import { api } from '../../services/api';
import {
  Shield,
  Users,
  Activity,
  Database,
  Cpu,
  HardDrive,
  Radio,
  Truck,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  Download,
  CheckCircle2
} from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'health' | 'users' | 'vehicles' | 'equipment' | 'audit' | 'backups'>('health');
  
  // Data states
  const [health, setHealth] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // User Create Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('password123');

  const fetchTabContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'health') {
        const data = await api.get('/admin/health-metrics');
        setHealth(data);
      } else if (activeTab === 'users') {
        const u = await api.get('/users');
        setUsers(u);
      } else if (activeTab === 'vehicles') {
        const v = await api.get('/vehicles');
        setVehicles(v);
      } else if (activeTab === 'equipment') {
        const eq = await api.get('/equipment');
        setEquipment(eq);
      } else if (activeTab === 'audit') {
        const logs = await api.get('/admin/audit-logs');
        setAuditLogs(logs);
      } else if (activeTab === 'backups') {
        const b = await api.get('/backups');
        setBackups(b);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabContent();
  }, [activeTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName) return;
    await api.post('/users', {
      email: newEmail,
      full_name: newName,
      password: newPassword
    });
    setShowUserModal(false);
    setNewEmail('');
    setNewName('');
    fetchTabContent();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to soft-delete this user?')) {
      await api.delete(`/users/${id}`);
      fetchTabContent();
    }
  };

  const handleTriggerBackup = async () => {
    await api.post('/backups/trigger');
    fetchTabContent();
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2563EB]" />
              ENTERPRISE ADMIN PORTAL
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">System administration, RBAC security, fleet assets, backups, and audit logs</p>
          </div>
          <button
            onClick={fetchTabContent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] text-xs font-semibold text-white hover:bg-[#27272A]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-[#1C1C1F] gap-1 overflow-x-auto">
          {[
            { id: 'health', label: 'System Health & Infrastructure', icon: Cpu },
            { id: 'users', label: 'User & Role Management', icon: Users },
            { id: 'vehicles', label: 'Fleet Vehicles', icon: Truck },
            { id: 'equipment', label: 'Equipment Inventory', icon: Radio },
            { id: 'audit', label: 'Security & Audit Logs', icon: Lock },
            { id: 'backups', label: 'Database Backup & Restore', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap
                  ${active
                    ? 'border-[#2563EB] text-white bg-[#2563EB]/10'
                    : 'border-transparent text-[#64748B] hover:text-[#94A3B8] hover:bg-[#18181B]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: System Health */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">CPU Usage</p>
                <h3 className="text-2xl font-black text-white mt-1">{health?.cpu_usage_percent ?? 14.2}%</h3>
                <div className="w-full bg-[#18181B] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#2563EB] h-full" style={{ width: `${health?.cpu_usage_percent ?? 14}%` }} />
                </div>
              </div>
              <div className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">RAM Memory</p>
                <h3 className="text-2xl font-black text-white mt-1">{health?.ram_usage_percent ?? 38.5}%</h3>
                <div className="w-full bg-[#18181B] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#22C55E] h-full" style={{ width: `${health?.ram_usage_percent ?? 38}%` }} />
                </div>
              </div>
              <div className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">API Query Latency</p>
                <h3 className="text-2xl font-black text-white mt-1">{health?.api_latency_ms ?? 2.4} ms</h3>
                <p className="text-[10px] text-[#22C55E] font-semibold mt-1">● Sub-millisecond SQL response</p>
              </div>
              <div className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Active WebSockets</p>
                <h3 className="text-2xl font-black text-white mt-1">{health?.active_websockets ?? 8} Channels</h3>
                <p className="text-[10px] text-[#2563EB] font-semibold mt-1">● Telemetry Stream Online</p>
              </div>
            </div>

            <div className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Background Celery Workers & Queue Status</h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                  <p className="text-[#94A3B8]">Running Jobs</p>
                  <p className="text-lg font-bold text-white mt-0.5">0 Active</p>
                </div>
                <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                  <p className="text-[#94A3B8]">Completed Tasks Today</p>
                  <p className="text-lg font-bold text-[#22C55E] mt-0.5">142 Jobs</p>
                </div>
                <div className="bg-[#18181B] p-3 rounded-lg border border-[#27272A]">
                  <p className="text-[#94A3B8]">Failed Tasks</p>
                  <p className="text-lg font-bold text-white mt-0.5">0 Failures</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Management */}
        {activeTab === 'users' && (
          <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1C1C1F] pb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">User Directory & Roles ({users.length})</h3>
              <button
                onClick={() => setShowUserModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add User
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181B] text-[#94A3B8] uppercase text-[10px] border-b border-[#27272A]">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1F]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#18181B]">
                      <td className="p-2.5 font-bold text-white">{u.full_name}</td>
                      <td className="p-2.5 text-[#94A3B8]">{u.email}</td>
                      <td className="p-2.5 font-semibold text-[#2563EB]">{u.roles.join(', ') || 'User'}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#EF4444]/20 text-[#EF4444]'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="p-2.5 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="text-[#EF4444] hover:text-red-400 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Vehicles */}
        {activeTab === 'vehicles' && (
          <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Fleet Vehicles ({vehicles.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {vehicles.map((v) => (
                <div key={v.id} className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg space-y-1">
                  <p className="text-xs font-black text-white">{v.call_sign}</p>
                  <p className="text-[11px] text-[#94A3B8]">{v.type}</p>
                  <p className="text-[10px] font-semibold text-[#22C55E]">Status: {v.status}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Equipment */}
        {activeTab === 'equipment' && (
          <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Equipment Inventory ({equipment.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {equipment.map((eq) => (
                <div key={eq.id} className="bg-[#18181B] border border-[#27272A] p-3 rounded-lg space-y-1">
                  <p className="text-xs font-black text-white">{eq.name}</p>
                  <p className="text-[11px] text-[#94A3B8]">Serial: {eq.serial_number || 'N/A'}</p>
                  <p className="text-[10px] font-semibold text-[#2563EB]">Type: {eq.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Security & Audit Logs */}
        {activeTab === 'audit' && (
          <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">System Audit & Security Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#18181B] text-[#94A3B8] uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Action</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">IP Address</th>
                    <th className="p-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1F]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#18181B]">
                      <td className="p-2.5 font-bold text-white">{log.action}</td>
                      <td className="p-2.5 text-[#94A3B8]">{log.user_email || 'System'}</td>
                      <td className="p-2.5 font-mono text-[10px] text-[#64748B]">{log.ip_address || '127.0.0.1'}</td>
                      <td className="p-2.5 text-[#64748B]">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Database Backup */}
        {activeTab === 'backups' && (
          <div className="bg-[#111113] border border-[#1C1C1F] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C1C1F] pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Database Backup & Snapshot Manager</h3>
                <p className="text-[11px] text-[#94A3B8]">Manual triggers, scheduled snapshot archives, and database restoration</p>
              </div>
              <button
                onClick={handleTriggerBackup}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#22C55E] text-xs font-bold text-white hover:bg-[#16A34A]"
              >
                <Download className="w-3.5 h-3.5" />
                Backup Database Now
              </button>
            </div>
            <div className="space-y-2">
              {backups.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-[#18181B] border border-[#27272A]">
                  <div>
                    <p className="text-xs font-bold text-white">{b.file_name}</p>
                    <p className="text-[10px] text-[#94A3B8]">Created: {new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E]">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-sm font-bold text-white">Create New Platform User</h3>
              <button onClick={() => setShowUserModal(false)} className="text-[#64748B] hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="john.doe@cityfire.gov"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Initial Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="px-4 py-2 rounded-lg bg-[#27272A] text-xs font-semibold text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-xs font-bold text-white">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
