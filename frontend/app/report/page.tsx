import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { IncidentForm } from '../../components/incident/IncidentForm';
import { EmergencyButton } from '../../components/incident/EmergencyButton';
import { ToastProvider } from '../../components/incident/ToastProvider';

export const metadata: Metadata = {
  title: 'Report Incident | Guardian Live Enterprise',
  description: 'Public unauthenticated emergency incident reporting with live GPS location & timestamped photo evidence.',
};

export default function PublicReportPage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 font-sans antialiased text-slate-100">
        {/* Header Bar */}
        <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                GUARDIAN LIVE
              </span>
              <span className="text-[10px] font-semibold text-red-500 uppercase tracking-widest block">
                Public Emergency Portal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-slate-300 border border-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </header>

        {/* Main Incident Form Wizard */}
        <main>
          <IncidentForm />
        </main>

        {/* Floating Quick Emergency Call Button */}
        <EmergencyButton />
      </div>
    </ToastProvider>
  );
}
