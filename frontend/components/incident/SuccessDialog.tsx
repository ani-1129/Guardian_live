'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ShieldCheck, Home, RotateCcw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuccessDialogProps {
  incidentId: string;
  estimatedResponseTime: number;
  onReset: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  incidentId,
  estimatedResponseTime,
  onReset,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Top Red/Emerald Gradient Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />

        {/* Animated Checkmark Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950">
          <CheckCircle className="w-10 h-10 animate-live-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Incident Reported Successfully
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Your emergency alert has been logged into the Guardian Live Enterprise dispatch system.
          </p>
        </div>

        {/* Incident ID & Status Card */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-zinc-800/80 pb-2">
            <span className="text-slate-400">Incident Tracking ID</span>
            <span className="font-mono font-bold text-red-400">{incidentId}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Estimated Response
            </span>
            <span className="font-semibold text-emerald-400">
              ~ {estimatedResponseTime} Minutes
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Dispatch Status</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[11px]">
              Triage & Unit Assignment Active
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>

          <button
            type="button"
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Report Another Incident
          </button>
        </div>

        <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Encrypted & Logged via Guardian Emergency Protocol
        </p>
      </motion.div>
    </div>
  );
};
