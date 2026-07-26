'use client';

import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, X } from 'lucide-react';

export const EmergencyButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Expanded Quick Dial Menu */}
      {isOpen && (
        <div className="mb-3 p-4 bg-zinc-900/95 border border-red-500/40 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100 space-y-3 w-64 animate-slide-in">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> Quick Emergency Dial
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <a
              href="tel:112"
              className="flex items-center justify-between p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-200 font-semibold transition-colors"
            >
              <span>National Emergency Hotline</span>
              <span className="font-mono bg-red-600 text-white px-2 py-0.5 rounded">112 / 911</span>
            </a>

            <a
              href="tel:101"
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium transition-colors"
            >
              <span>Fire Rescue Services</span>
              <span className="font-mono text-amber-400">101</span>
            </a>

            <a
              href="tel:102"
              className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-300 font-medium transition-colors"
            >
              <span>Ambulance / Medical</span>
              <span className="font-mono text-emerald-400">102</span>
            </a>
          </div>
        </div>
      )}

      {/* Floating Trigger Circle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-950/60 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 group relative"
        title="Immediate Emergency Hotline"
      >
        <span className="absolute -inset-1 rounded-full bg-red-500 opacity-40 animate-ping pointer-events-none" />
        <PhoneCall className="w-6 h-6 relative z-10" />
      </button>
    </div>
  );
};
