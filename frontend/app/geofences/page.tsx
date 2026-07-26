'use client';

import React, { useState } from 'react';
import AppShell from '../../components/Common/AppShell';
import { useGeofences } from '../../hooks/useData';
import { Target, MapPin, Trash2, Plus, X, AlertTriangle, Shield } from 'lucide-react';

export default function GeofencesPage() {
  const { geofences, loading, createGeofence, deleteGeofence } = useGeofences();
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [boundaryType, setBoundaryType] = useState('Polygon');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const coords = JSON.stringify([
      [40.715, -74.012],
      [40.720, -74.002],
      [40.710, -74.000],
      [40.708, -74.010]
    ]);

    await createGeofence({
      name: name.trim(),
      boundary_type: boundaryType,
      coordinates: coords,
      organization_id: "00000000-0000-0000-0000-000000000000",
      is_active: true,
      alert_on_entry: true,
      alert_on_exit: true
    });

    setShowModal(false);
    setName('');
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#2563EB]" />
              GEOFENCE & SPATIAL BOUNDARY STUDIO
            </h1>
            <p className="text-xs text-[#94A3B8]">Safe zones, restricted perimeters, and automated breach detection boundaries</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8]"
          >
            <Plus className="w-4 h-4" />
            New Geofence
          </button>
        </div>

        {/* Geofences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-xs text-[#64748B] col-span-3 text-center py-12">Loading geofences from database...</p>
          ) : geofences.length === 0 ? (
            <p className="text-xs text-[#64748B] col-span-3 text-center py-12">No geofences created yet</p>
          ) : (
            geofences.map((gf) => (
              <div key={gf.id} className="bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{gf.name}</span>
                  <button onClick={() => deleteGeofence(gf.id)} className="text-[#EF4444] hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-[#94A3B8] space-y-1">
                  <p>Type: <span className="font-semibold text-white">{gf.boundary_type}</span></p>
                  <p>Alerts: Entry & Exit Breach Alert</p>
                </div>
                <div className="pt-2 border-t border-[#1C1C1F] flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${gf.is_active ? 'bg-[#22C55E]/20 text-[#22C55E]' : 'bg-[#64748B]/20 text-[#64748B]'}`}>
                    {gf.is_active ? 'Active Spatial Watch' : 'Disabled'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-sm font-bold text-white">Create Spatial Geofence</h3>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Zone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Downtown Safe Zone"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#94A3B8] uppercase">Boundary Type</label>
                <select
                  value={boundaryType}
                  onChange={(e) => setBoundaryType(e.target.value)}
                  className="w-full bg-[#111113] border border-[#27272A] rounded-lg px-3 py-2 text-xs text-white mt-1"
                >
                  <option value="Polygon">Polygon (Multi-Point)</option>
                  <option value="Circle">Circle Radius</option>
                  <option value="Rectangle">Rectangle Sector</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-[#27272A] text-xs font-semibold text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#2563EB] text-xs font-bold text-white">Save Geofence</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
