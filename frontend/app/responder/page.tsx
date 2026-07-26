'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../../components/Common/AppShell';
import { api } from '../../services/api';
import {
  ShieldAlert, Clock, MapPin, Compass, Send, CheckCircle2, AlertTriangle, AlertCircle,
  Play, Pause, RefreshCw, Layers, Layout, Users, Shield, Radio, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const DynamicConsoleMap = dynamic(
  () => import('../../components/Map/ConsoleMap').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-slate-500 gap-2">
        <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
        Loading Tactcal Navigation Map...
      </div>
    ),
  }
);

interface Message {
  id: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export default function ResponderConsole() {
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [operationalStatus, setOperationalStatus] = useState<string>('Available');
  const [responders, setResponders] = useState<any[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Navigation states
  const [navigating, setNavigating] = useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<any | null>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const data = await api.get('/responder/assignment');
      if (data.assignment) {
        setActiveAssignment(data.assignment);
        setOperationalStatus(data.assignment.status);
        localStorage.setItem('cached_assignment', JSON.stringify(data.assignment));
        fetchMessages(data.assignment.id);
      } else {
        setActiveAssignment(null);
      }
    } catch (err) {
      console.warn('Offline or failed to fetch assignment. Trying local cache...');
      const cached = localStorage.getItem('cached_assignment');
      if (cached) {
        setActiveAssignment(JSON.parse(cached));
      }
    }
  }, []);

  const fetchMessages = async (incidentId: string) => {
    try {
      const data = await api.get(`/responder/messages?incident_id=${incidentId}`);
      setMessages(data);
    } catch (err) {
      console.warn('Failed to load messaging history:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeAssignment) return;
    try {
      await api.post(`/responder/message?incident_id=${activeAssignment.id}&message=${encodeURIComponent(newMessage)}`);
      setNewMessage('');
    } catch (err) {
      setToastMsg('⚠️ Message failed to send.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await api.post(`/responder/status?status=${encodeURIComponent(status)}`);
      setOperationalStatus(status);
      setToastMsg(`Status updated to ${status}`);
      setTimeout(() => setToastMsg(null), 3000);
      if (status === 'Resolved' || status === 'Available Again') {
        setActiveAssignment(null);
        localStorage.removeItem('cached_assignment');
      } else {
        fetchAssignment();
      }
    } catch (err) {
      setToastMsg('⚠️ Failed to update status.');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  useEffect(() => {
    fetchAssignment();

    // WebSocket messaging & status update synchronization
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsBase}/ws?token=${encodeURIComponent(token)}`);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: eventName, data } = payload;

        if (eventName === 'dispatch_message' && activeAssignment && data.incident_id === activeAssignment.id) {
          setMessages(prev => [...prev, data]);
        } else if (eventName === 'new_incident' || eventName === 'incident_updated') {
          fetchAssignment();
        }
      } catch (e) {
        console.error('Error handling websocket message:', e);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [fetchAssignment, activeAssignment?.id]);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto p-4 lg:p-6 bg-black min-h-screen text-slate-100">
        
        {/* Top Incident Summary Bar */}
        <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">ACTIVE RESPONDER TERMINAL</span>
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {activeAssignment ? `RESPONDING TO: ${activeAssignment.title}` : 'STANDBY - WAITING FOR ASSIGNMENT'}
            </h1>
            {activeAssignment && (
              <p className="text-xs text-slate-400">{activeAssignment.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Current Unit Status:</span>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
              {operationalStatus}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Navigation Map - occupying 70% width or column equivalent */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-3 flex flex-col h-[500px] shadow-xl overflow-hidden relative">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 px-1">
                <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-500" />
                  LIVE OPERATIONAL NAVIGATION
                </h2>
                {activeAssignment && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNavigating(!navigating)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        navigating ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {navigating ? 'Pause Navigation' : 'Start Navigation'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 rounded-xl overflow-hidden bg-zinc-950 relative">
                <DynamicConsoleMap
                  incidents={activeAssignment ? [activeAssignment] : []}
                  responders={[]}
                  selectedIncidentId={activeAssignment?.id || null}
                />
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h2 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                Operational Status Actions
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {[
                  { label: 'Accept', status: 'Accepted', color: 'bg-emerald-600 hover:bg-emerald-500' },
                  { label: 'Preparing', status: 'Preparing', color: 'bg-amber-600 hover:bg-amber-500' },
                  { label: 'En Route', status: 'En Route', color: 'bg-blue-600 hover:bg-blue-500' },
                  { label: 'On Scene', status: 'On Scene', color: 'bg-indigo-600 hover:bg-indigo-500' },
                  { label: 'Resolved', status: 'Resolved', color: 'bg-emerald-700 hover:bg-emerald-600' }
                ].map((act) => (
                  <button
                    key={act.label}
                    onClick={() => handleStatusChange(act.status)}
                    disabled={!activeAssignment}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 ${act.color}`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch Messages & Info */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Info Cards */}
            {activeAssignment && (
              <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 shadow-xl space-y-4">
                <h2 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2">
                  Route & Incident Info
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-slate-400">Incident Category</span>
                    <span className="text-white font-bold">{activeAssignment.category}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-slate-400">Priority Level</span>
                    <span className={`font-bold ${activeAssignment.priority === 'Critical' ? 'text-red-500' : 'text-amber-500'}`}>
                      {activeAssignment.priority}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                    <span className="text-slate-400">Dispatch Location</span>
                    <span className="text-white font-bold truncate max-w-[200px]">{activeAssignment.address}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dispatch Communications / Chat */}
            <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 shadow-xl flex flex-col h-[320px]">
              <h2 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3">
                Dispatch Communications
              </h2>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 mb-3 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    No dispatcher messages.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="p-2.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-extrabold text-blue-400">{m.sender_name}</span>
                        <span className="text-slate-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-200">{m.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Send reply to dispatcher..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Toast Feedback popup */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 bg-[#22C55E] text-black text-xs font-black px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" />
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}
