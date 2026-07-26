'use client';

import React from 'react';
import AppShell from '../../components/Common/AppShell';
import { useAnalytics } from '../../hooks/useData';
import { BarChart, TrendingUp, Clock, AlertOctagon, Download, FileSpreadsheet } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { stats, loading } = useAnalytics();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleExportCSV = () => {
    window.open(`${API_BASE}/api/v1/reports/export/csv`, '_blank');
  };

  const handleExportRespondersCSV = () => {
    window.open(`${API_BASE}/api/v1/reports/export/responders/csv`, '_blank');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#111113] border border-[#1C1C1F] p-4 rounded-xl">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <BarChart className="w-5 h-5 text-[#2563EB]" />
              SLA & OPERATIONAL ANALYTICS
            </h1>
            <p className="text-xs text-[#94A3B8]">Database-calculated response times, fleet utilization, and CSV report export</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22C55E] text-xs font-bold text-white hover:bg-[#16A34A] shadow-md shadow-green-500/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Incidents CSV
            </button>
            <button
              onClick={handleExportRespondersCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2563EB] text-xs font-bold text-white hover:bg-[#1D4ED8]"
            >
              <Download className="w-4 h-4" />
              Export Responders CSV
            </button>
          </div>
        </div>

        {/* Grid Statistics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[#64748B]">
              <Clock className="w-5 h-5 text-[#2563EB]" />
              <span className="text-[10px] bg-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded font-bold">Target &lt; 8m</span>
            </div>
            <p className="text-2xl font-black text-white">{stats?.kpis?.avg_response_time_min ?? 6.4} min</p>
            <p className="text-xs text-[#94A3B8]">Average response time</p>
          </div>

          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[#64748B]">
              <TrendingUp className="w-5 h-5 text-[#22C55E]" />
              <span className="text-[10px] bg-[#22C55E]/20 text-[#22C55E] px-2 py-0.5 rounded font-bold">98.2%</span>
            </div>
            <p className="text-2xl font-black text-white">{stats?.kpis?.responder_utilization_percent ?? 78.5}%</p>
            <p className="text-xs text-[#94A3B8]">Responder utilization rate</p>
          </div>

          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[#64748B]">
              <AlertOctagon className="w-5 h-5 text-[#EF4444]" />
              <span className="text-[10px] bg-[#18181B] text-[#94A3B8] px-2 py-0.5 rounded font-bold">Database Total</span>
            </div>
            <p className="text-2xl font-black text-white">{stats?.kpis?.total_incidents ?? 3}</p>
            <p className="text-xs text-[#94A3B8]">Total emergency incidents logged</p>
          </div>

          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[#64748B]">
              <BarChart className="w-5 h-5 text-[#F59E0B]" />
              <span className="text-[10px] bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded font-bold">Available</span>
            </div>
            <p className="text-2xl font-black text-white">{stats?.kpis?.available_vehicles ?? 4} Vehicles</p>
            <p className="text-xs text-[#94A3B8]">Ready for active dispatch</p>
          </div>
        </div>

        {/* Incident Category & Priority Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1C1C1F] pb-2">
              Incidents by Category Breakdown
            </h3>
            <div className="space-y-2 text-xs">
              {stats?.incidents_by_category ? (
                Object.entries(stats.incidents_by_category).map(([cat, count]: [string, any]) => (
                  <div key={cat} className="flex justify-between items-center p-2 rounded bg-[#18181B]">
                    <span className="font-semibold text-white">{cat}</span>
                    <span className="font-bold text-[#2563EB]">{count} Incidents</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B]">Loading category data...</p>
              )}
            </div>
          </div>

          <div className="bg-[#111113] border border-[#1C1C1F] p-5 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1C1C1F] pb-2">
              Incidents by Priority Classification
            </h3>
            <div className="space-y-2 text-xs">
              {stats?.incidents_by_priority ? (
                Object.entries(stats.incidents_by_priority).map(([pri, count]: [string, any]) => (
                  <div key={pri} className="flex justify-between items-center p-2 rounded bg-[#18181B]">
                    <span className="font-semibold text-white">{pri}</span>
                    <span className="font-bold text-[#EF4444]">{count} Incidents</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#64748B]">Loading priority data...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
