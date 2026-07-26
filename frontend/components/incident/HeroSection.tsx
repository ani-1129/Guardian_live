'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, MapPin, Camera, Zap, ArrowRight, ShieldCheck, Activity, Clock, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '12,000+', label: 'Incidents Reported', icon: Activity },
  { value: '4.8s', label: 'Avg Response Time', icon: Clock },
  { value: '99.9%', label: 'Platform Uptime', icon: Globe },
  { value: '150+', label: 'Agencies Connected', icon: ShieldCheck },
];

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-32">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-radial opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, rgba(37,99,235,0.08) 40%, transparent 70%)',
        }}
      />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
        }}
      />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Guardian Emergency Portal • No Login Required
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.1]"
          >
            Report Emergencies{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-400 to-amber-400 animate-gradient bg-[length:200%_200%]">
              Instantly
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            Help emergency responders by submitting accurate incident reports with your
            live location, instant GPS tracking, and timestamped photo evidence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link
              href="/report"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-all transform hover:-translate-y-0.5 shadow-lg shadow-red-900/30 active:translate-y-0 shimmer-btn"
            >
              <ShieldAlert className="w-5 h-5" />
              Report an Incident
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-zinc-800/60 hover:bg-zinc-800 text-slate-200 border border-zinc-700/60 font-medium text-base transition-all backdrop-blur-sm"
            >
              Learn How It Works
            </a>
          </motion.div>

          {/* Trust Highlights */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs text-slate-400 border-t border-zinc-800/60 max-w-2xl mx-auto"
          >
            {[
              { icon: Zap, label: '< 30s Submission', color: 'text-amber-400' },
              { icon: MapPin, label: 'Live GPS Pinpoint', color: 'text-blue-400' },
              { icon: Camera, label: 'Auto Watermarking', color: 'text-emerald-400' },
              { icon: ShieldCheck, label: 'Anonymous Option', color: 'text-purple-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 py-3">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span className="font-medium">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats Counter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="glass-card rounded-2xl p-1">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-heading font-bold text-white">{stat.value}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
