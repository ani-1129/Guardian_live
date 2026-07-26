'use client';

import React from 'react';
import Link from 'next/link';
import { HeroSection } from '../components/incident/HeroSection';
import { FeaturesGrid } from '../components/incident/FeaturesGrid';
import { HowItWorksTimeline } from '../components/incident/HowItWorksTimeline';
import { EmergencyButton } from '../components/incident/EmergencyButton';
import { ShieldAlert, LayoutDashboard, ArrowRight } from 'lucide-react';

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-slate-100 selection:bg-red-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white block leading-none">
              GUARDIAN LIVE
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">
              Enterprise Emergency Dispatch Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/console"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-slate-300 border border-zinc-800 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-blue-400" />
            Dispatch Console
          </Link>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-900/40"
          >
            Report Incident
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section Cards */}
        <FeaturesGrid />

        {/* 4-Step How It Works Timeline */}
        <HowItWorksTimeline />
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 bg-zinc-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Guardian Live Enterprise. All rights reserved. Emergency Response Protocol.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/report" className="hover:text-red-400 transition-colors font-medium">
              Public Incident Reporting
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Responder Login
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating Emergency Button */}
      <EmergencyButton />
    </div>
  );
}
