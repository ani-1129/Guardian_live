'use client';

import React from 'react';
import { UserCheck, ShieldOff, Lock, Info } from 'lucide-react';
import { ReporterInfo as ReporterInfoType } from '../../types/incident';

interface ReporterInfoProps {
  reporter: ReporterInfoType;
  onChange: (reporter: ReporterInfoType) => void;
}

export const ReporterInfo: React.FC<ReporterInfoProps> = ({ reporter, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-red-500" />
          Step 4 — Reporter Details (Optional)
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Provide your contact info for dispatch updates or choose to remain completely anonymous.
        </p>
      </div>

      {/* Anonymous Checkbox Card */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-4">
        <input
          type="checkbox"
          id="remainAnonymous"
          checked={reporter.remainAnonymous}
          onChange={(e) =>
            onChange({
              ...reporter,
              remainAnonymous: e.target.checked,
              ...(e.target.checked ? { fullName: '', phoneNumber: '', email: '' } : {}),
            })
          }
          className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-500 mt-1 cursor-pointer"
        />
        <label htmlFor="remainAnonymous" className="cursor-pointer">
          <span className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-amber-400" />
            Remain Anonymous
          </span>
          <p className="text-xs text-slate-400 mt-0.5">
            Your name, phone number, and email will NOT be attached to this report or shared with first responders.
          </p>
        </label>
      </div>

      {/* Contact Fields (Hidden if Anonymous) */}
      {!reporter.remainAnonymous ? (
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            Optional Contact Details
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Full Name (Optional)</label>
            <input
              type="text"
              value={reporter.fullName}
              onChange={(e) => onChange({ ...reporter, fullName: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={reporter.phoneNumber}
                onChange={(e) => onChange({ ...reporter, phoneNumber: e.target.value })}
                placeholder="e.g. +1 555-0199"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={reporter.email}
                onChange={(e) => onChange({ ...reporter, email: e.target.value })}
                placeholder="e.g. john@example.com"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>Anonymous mode active. No personal contact details will be recorded.</span>
        </div>
      )}
    </div>
  );
};
