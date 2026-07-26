'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '../../components/Common/AppShell';
import { useIncidents, useResponders } from '../../hooks/useData';
import { api } from '../../services/api';
import dynamic from 'next/dynamic';
import {
  Play, UserPlus, X, MapPin, Clock, Radio, ShieldAlert,
  AlertCircle, CheckCircle2, Phone, Eye, Navigation, Users, Plus, Compass,
  Volume2, VolumeX, Shield, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import Console Map to avoid SSR errors
const DynamicConsoleMap = dynamic(
  () => import('../../components/Map/ConsoleMap').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[550px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-slate-500 gap-2">
        <MapPin className="w-8 h-8 text-red-500 animate-bounce" />
        Loading Live Tactical Map...
      </div>
    ),
  }
);

interface TimelineEvent {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'alert' | 'success' | 'update';
}

export default function DispatchConsole() {
  const { incidents: initialIncidents, loading: incLoading, updateIncidentStatus, refresh: refreshIncidents } = useIncidents();
  const { responders: initialResponders, refresh: refreshResponders } = useResponders();

  // Local state for real-time responsiveness
  const [incidents, setIncidents] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  // Extra state for recommendations, timeline, override, and deletion
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [recommendations, setRecommendations] = useState<any | null>(null);
  const [incidentTimeline, setIncidentTimeline] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteReason, setDeleteReason] = useState<string>('');
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideUnitId, setOverrideUnitId] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch recommendations and timeline history whenever selectedIncident changes
  useEffect(() => {
    if (selectedIncident?.id) {
      api.get(`/incidents/${selectedIncident.id}/recommendations`)
        .then(res => setRecommendations(res))
        .catch(err => console.warn('Failed to load recommendations:', err));

      api.get(`/incidents/${selectedIncident.id}/timeline`)
        .then(res => setIncidentTimeline(res))
        .catch(err => console.warn('Failed to load timeline:', err));
    } else {
      setRecommendations(null);
      setIncidentTimeline([]);
    }
  }, [selectedIncident]);

  // Handle Delete Incident
  const handleDeleteIncident = async () => {
    if (!selectedIncident) return;
    if (selectedIncident.priority === 'Critical' && deleteConfirmText.trim() !== selectedIncident.title.trim() && deleteConfirmText.trim() !== selectedIncident.id) {
      setToastMsg('⚠️ Please type exact Incident Title or ID to confirm deletion.');
      setTimeout(() => setToastMsg(null), 4000);
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete(`/incidents/${selectedIncident.id}?reason=${encodeURIComponent(deleteReason)}`);
      setIncidents(prev => prev.filter(i => i.id !== selectedIncident.id));
      setSelectedIncident(null);
      setShowDeleteModal(false);
      setToastMsg('🗑️ Incident soft-deleted successfully.');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      setToastMsg(`Deletion failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Chief Dispatcher Override
  const handleChiefOverride = async () => {
    if (!selectedIncident || !overrideUnitId) return;
    try {
      await api.post(`/incidents/${selectedIncident.id}/override?unit_id=${overrideUnitId}&reason=${encodeURIComponent(overrideReason || 'Chief Dispatcher Override')}`);
      setToastMsg('⚡ Chief Dispatcher override executed successfully.');
      setShowOverrideModal(false);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      setToastMsg(`Override failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any | null>(null);
  
  // Real-time WebSocket connection state
  const [socketConnected, setSocketConnected] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([
    { id: '1', time: new Date().toLocaleTimeString(), message: 'Emergency dispatch console initialized.', type: 'info' }
  ]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef<number>(3000);
  const destroyedRef = useRef<boolean>(false);

  // Sync hooks data to state when loaded
  useEffect(() => {
    if (initialIncidents) {
      setIncidents(initialIncidents);
    }
  }, [initialIncidents]);

  useEffect(() => {
    if (initialResponders) {
      setResponders(initialResponders);
    }
  }, [initialResponders]);

  // Audio cues for operational command center feel
  const playSound = useCallback((type: 'new' | 'sos' | 'success') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'new') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'sos') {
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(660, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {
      console.warn('Web Audio API not supported/allowed yet');
    }
  }, [soundEnabled]);

  // WebSockets setup with proper auto-reconnect
  useEffect(() => {
    destroyedRef.current = false;
    reconnectDelayRef.current = 3000;

    const connectWebSocket = () => {
      if (destroyedRef.current) return;

      const token = localStorage.getItem('access_token');
      if (!token) return;

      const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const wsUrl = `${wsBase}/ws?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setSocketConnected(true);
        // Reset backoff on successful connection
        reconnectDelayRef.current = 3000;
        setTimelineEvents(prev => [
          { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: 'Connected to live dispatcher WebSocket network.', type: 'success' as const },
          ...prev
        ]);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventName, data } = payload;

          if (eventName === 'new_incident') {
            playSound('new');
            setIncidents(prev => {
              // Avoid duplicate additions
              if (prev.some((inc: any) => inc.id === data.id)) return prev;
              return [data, ...prev];
            });
            setTimelineEvents(prev => [
              { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `🚨 New reported incident [${data.category}]: "${data.title}" at ${data.address || 'GPS Location Set'}`, type: 'alert' as const },
              ...prev
            ]);
            setToastMsg(`🚨 NEW INCIDENT: ${data.title}`);
            setTimeout(() => setToastMsg(null), 6000);

          } else if (eventName === 'incident_updated') {
            playSound('success');
            setIncidents(prev => prev.map((inc: any) => inc.id === data.id ? { ...inc, ...data } : inc));
            
            // Update selected incident if inspect panel matches
            setSelectedIncident((prev: any) => {
              if (prev && prev.id === data.id) {
                return { ...prev, ...data };
              }
              return prev;
            });

            setTimelineEvents(prev => [
              { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `Incident "${data.title}" updated → Status: ${data.status} | Priority: ${data.priority}`, type: 'update' as const },
              ...prev
            ]);

          } else if (eventName === 'incident_deleted') {
            setIncidents(prev => prev.filter((inc: any) => inc.id !== data.id));
            setSelectedIncident((prev: any) => (prev?.id === data.id ? null : prev));
            setTimelineEvents(prev => [
              { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `🗑️ Incident "${data.title || data.id}" was soft-deleted.`, type: 'alert' as const },
              ...prev
            ]);
            refreshIncidents();
            refreshResponders();
          } else if (eventName === 'statistics_updated') {
            refreshIncidents();
            refreshResponders();
          } else if (eventName === 'location_update') {
            setResponders(prev => prev.map((resp: any) => {
              if (resp.id === data.user_id) {
                return {
                  ...resp,
                  lat: data.latitude,
                  lng: data.longitude,
                  speed: data.speed,
                  battery: data.battery_level,
                  location: `${data.latitude.toFixed(4)}°, ${data.longitude.toFixed(4)}°`
                };
              }
              return resp;
            }));
            
            setTimelineEvents(prev => [
              { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `Unit GPS ping: speed ${data.speed} km/h, battery ${data.battery_level}%`, type: 'info' as const },
              ...prev
            ].slice(0, 50));
          }
        } catch (e) {
          console.error('Error handling websocket message:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Connection error, will reconnect:', err);
      };

      ws.onclose = () => {
        setSocketConnected(false);
        if (destroyedRef.current) return; // intentional unmount, do NOT reconnect

        const delay = reconnectDelayRef.current;
        setTimelineEvents(prev => [
          { id: Math.random().toString(), time: new Date().toLocaleTimeString(), message: `WebSocket disconnected. Reconnecting in ${delay / 1000}s...`, type: 'info' as const },
          ...prev
        ]);

        setTimeout(() => {
          if (!destroyedRef.current) {
            // Exponential backoff: 3s → 6s → 12s → max 30s
            reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
            connectWebSocket();
          }
        }, delay);
      };
    };

    connectWebSocket();

    return () => {
      destroyedRef.current = true;
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [playSound]);

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      await updateIncidentStatus(incidentId, newStatus);
      // Wait for WS to push update, fallback if offline
      if (!socketConnected) {
        setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: newStatus } : inc));
      }
      setToastMsg(`Status updated: ${newStatus}`);
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      setToastMsg(`Update failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleAssignResponder = async () => {
    if (!selectedIncident || !assigneeId) return;
    try {
      // Patch both assignee and change status to Assigned
      const response = await api.patch(`/incidents/${selectedIncident.id}?assigned_user_id=${assigneeId}&status=Assigned`);
      
      // Update selected incident local view
      setSelectedIncident(prev => ({ ...prev, assigned_user_id: assigneeId, status: 'Assigned' }));
      setToastMsg('Unit assigned successfully.');
      setTimeout(() => setToastMsg(null), 3000);
      
      // Compute driving route
      const resp = responders.find(r => r.id === assigneeId);
      if (resp) {
        const route = await api.get(`/geocoding/route?start_lat=${resp.lat}&start_lng=${resp.lng}&end_lat=${selectedIncident.latitude}&end_lng=${selectedIncident.longitude}`);
        setRouteData(route);
      }
    } catch (err: any) {
      setToastMsg(`Assignment failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const handleCalculateRoute = async () => {
    if (!selectedIncident) return;
    const targetUserId = selectedIncident.assigned_user_id || assigneeId;
    if (!targetUserId) return;
    const resp = responders.find(r => r.id === targetUserId);
    if (!resp) return;

    try {
      const route = await api.get(`/geocoding/route?start_lat=${resp.lat}&start_lng=${resp.lng}&end_lat=${selectedIncident.latitude}&end_lng=${selectedIncident.longitude}`);
      setRouteData(route);
      setToastMsg(`Driving Route: ${route.distance_km} km (${route.duration_minutes} min ETA)`);
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate stats
  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;
  const criticalCount = incidents.filter(i => i.status !== 'Resolved' && i.priority === 'Critical').length;
  const highCount = incidents.filter(i => i.status !== 'Resolved' && i.priority === 'High').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;
  const availableResponders = responders.filter(r => r.status === 'Available').length;
  const assignedRespondersCount = responders.filter(r => r.status === 'Busy' || r.status === 'En Route' || r.status === 'On Scene').length;

  // Format elapsed time helper
  const getElapsedTime = (isoStr: string) => {
    const elapsed = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000);
    if (elapsed < 1) return 'Just now';
    if (elapsed < 60) return `${elapsed}m ago`;
    return `${Math.floor(elapsed / 60)}h ${elapsed % 60}m ago`;
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-[#111113]/90 border border-zinc-800 p-4 rounded-2xl gap-4 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-md font-extrabold tracking-tight text-white flex items-center gap-2">
                OPERATIONAL COMMAND CENTER
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-black tracking-widest uppercase">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-xs text-slate-400">Live multi-unit geolocation sharing, dispatch incident routing & CAD dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sound Control Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors"
              title={soundEnabled ? 'Disable Alarm Sound' : 'Enable Alarm Sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>

            {/* Socket Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              socketConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {socketConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 animate-pulse" />
                  LIVE SYNCED
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  RECONNECTING
                </>
              )}
            </div>
          </div>
        </div>

        {/* 1. KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: 'Active Incidents', val: activeCount, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Critical Level', val: criticalCount, color: 'text-red-600', bg: 'bg-red-600/15' },
            { label: 'High Priority', val: highCount, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Resolved Incidents', val: resolvedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Units Available', val: availableResponders, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Units Busy', val: assignedRespondersCount, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Avg Dispatch', val: '6.4m', color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { label: 'SOS Alerts', val: 0, color: 'text-red-500 animate-pulse', bg: 'bg-red-500/10 border border-red-500/20' }
          ].map((card, idx) => (
            <div key={idx} className="bg-[#111113]/90 border border-zinc-800 p-3.5 rounded-2xl flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
              <span className={`text-xl font-black mt-1 ${card.color}`}>{card.val}</span>
            </div>
          ))}
        </div>

        {/* 2. Main Console Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Recent Incidents List (4/12 width) */}
          <div className="lg:col-span-4 bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                Active Incidents ({activeCount})
              </h2>
              <button 
                onClick={() => { refreshIncidents(); refreshResponders(); }}
                className="text-[10px] text-blue-400 hover:underline font-bold"
              >
                Refresh Queue
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {incLoading && incidents.length === 0 ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 w-full bg-zinc-900 animate-pulse rounded-xl border border-zinc-800/80" />
                  ))}
                </div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-20">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">All reports resolved. No pending incidents.</p>
                </div>
              ) : (
                incidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  let priorityColor = 'border-l-blue-500';
                  let priorityText = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
                  if (inc.priority === 'Critical') {
                    priorityColor = 'border-l-red-600';
                    priorityText = 'text-red-400 bg-red-500/10 border-red-500/20';
                  } else if (inc.priority === 'High') {
                    priorityColor = 'border-l-orange-500';
                    priorityText = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
                  } else if (inc.priority === 'Medium') {
                    priorityColor = 'border-l-yellow-500';
                    priorityText = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
                  }

                  return (
                    <div
                      key={inc.id}
                      onClick={() => { setSelectedIncident(inc); setRouteData(null); }}
                      className={`
                        p-3.5 rounded-xl border border-zinc-800/60 border-l-4 ${priorityColor} transition-all cursor-pointer space-y-2.5
                        ${isSelected 
                          ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-950/20' 
                          : 'bg-zinc-900/60 hover:bg-zinc-900/90 hover:border-zinc-700/80'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-black text-slate-100 block leading-tight">{inc.title}</span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">ID: {inc.id.substring(0, 8)}...</span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${priorityText}`}>
                          {inc.priority}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{inc.description || 'No description provided.'}</p>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-red-500/70" />
                        <span className="truncate">{inc.address || 'GPS Coordinates Set'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {getElapsedTime(inc.created_at)}
                        </span>
                        <span className={`font-extrabold uppercase px-1.5 py-0.5 rounded text-[9px] ${
                          inc.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          inc.status === 'On Scene' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          inc.status === 'En Route' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                          inc.status === 'Assigned' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {inc.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Column: Live Tactical Map (5/12 width) */}
          <div className="lg:col-span-5 bg-[#111113]/90 border border-zinc-800 rounded-2xl p-3 flex flex-col h-[650px] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2 px-1">
              <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-500" />
                TACTICAL INCIDENT DISPATCH MAP
              </h2>
            </div>
            
            <div className="flex-1 w-full relative rounded-xl overflow-hidden bg-zinc-950">
              <DynamicConsoleMap
                incidents={incidents}
                responders={responders}
                selectedIncidentId={selectedIncident?.id || null}
                onSelectIncident={(inc) => {
                  setSelectedIncident(inc);
                  setRouteData(null);
                }}
              />
            </div>
          </div>

          {/* Right Column: Selected Incident Side Panel (3/12 width) */}
          <div className="lg:col-span-3 bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <h2 className="text-xs font-black text-white uppercase tracking-widest">
                Incident Inspector
              </h2>
              {selectedIncident && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <X className="w-3 h-3" /> Delete
                </button>
              )}
            </div>
            
            {selectedIncident ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {selectedIncident.id}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                      selectedIncident.priority === 'Critical' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {selectedIncident.priority}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-white text-sm leading-snug">{selectedIncident.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/40">
                    {selectedIncident.description || 'No description provided.'}
                  </p>
                </div>

                <div className="space-y-2 text-xs border-t border-zinc-800 pt-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address Details</p>
                      <p className="text-slate-300 text-xs mt-0.5">{selectedIncident.address || 'GPS Coordinates Set'}</p>
                    </div>
                  </div>
                </div>

                {/* Display route duration info if OSRM loaded */}
                {routeData && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-1">
                    <p className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-400" />
                      OSRM Route Calculated
                    </p>
                    <p className="text-[10px] text-slate-300">Distance: <b className="text-white">{routeData.distance_km} km</b> | ETA: <b className="text-emerald-400">{routeData.duration_minutes} min</b></p>
                  </div>
                )}

                {/* Intelligent Dispatch Recommendations Panel */}
                {recommendations && (
                  <div className="border-t border-zinc-800 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5" /> Intelligent Dispatch Engine
                      </h4>
                      {recommendations.override_required && (
                        <span className="text-[9px] font-black bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                          OVERRIDE REQ
                        </span>
                      )}
                    </div>

                    {/* Warning if no matching available units */}
                    {recommendations.override_required && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] leading-tight space-y-1.5">
                        <p className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          {recommendations.warning_message}
                        </p>
                        <button
                          onClick={() => setShowOverrideModal(true)}
                          className="w-full py-1.5 rounded-lg bg-amber-500 text-black font-black text-[10px] hover:bg-amber-400 transition-all uppercase tracking-wider"
                        >
                          Perform Chief Dispatcher Override
                        </button>
                      </div>
                    )}

                    {/* Recommended Unit List */}
                    {recommendations.recommended_units?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400">Top Recommended Units:</p>
                        {recommendations.recommended_units.map((unit: any) => (
                          <div
                            key={unit.unit_id}
                            onClick={() => setAssigneeId(unit.unit_id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                              assigneeId === unit.unit_id
                                ? 'bg-blue-600/20 border-blue-500 text-white'
                                : 'bg-zinc-900/60 border-zinc-800 text-slate-300 hover:border-zinc-700'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-white text-[11px]">{unit.unit_name} ({unit.unit_type})</p>
                              <p className="text-[10px] text-slate-400">{unit.reason}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-emerald-400 block">{unit.eta_minutes}m ETA</span>
                              <span className="text-[9px] text-slate-500 font-mono">{unit.distance_km} km</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suggested Emergency Resources */}
                    {recommendations.suggested_resources?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">Suggested Resources:</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendations.suggested_resources.map((res: string, i: number) => (
                            <span key={i} className="text-[9px] bg-zinc-900 border border-zinc-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {res}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dispatch / Assignments Controls */}
                <div className="space-y-3 border-t border-zinc-800 pt-3 mt-auto">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CAD Dispatch Actions</h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Assign Unit</label>
                    <select
                      value={assigneeId || selectedIncident.assigned_user_id || ''}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select available unit...</option>
                      {responders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.role}) - {r.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCalculateRoute}
                      disabled={!(selectedIncident.assigned_user_id || assigneeId)}
                      className="py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-slate-200 hover:bg-zinc-800 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Compass className="w-3.5 h-3.5 text-blue-500" /> Calculate Route
                    </button>
                    <button
                      onClick={handleAssignResponder}
                      disabled={!assigneeId || assigneeId === selectedIncident.assigned_user_id}
                      className="py-2 rounded-xl bg-blue-600 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Dispatch Unit
                    </button>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/40">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Update Incident Status</label>
                    <select
                      value={selectedIncident.status}
                      onChange={(e) => handleStatusChange(selectedIncident.id, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="New">New / Unassigned</option>
                      <option value="Assigned">Assigned</option>
                      <option value="En Route">En Route</option>
                      <option value="On Scene">On Scene</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                {/* Incident Activity Timeline */}
                {incidentTimeline.length > 0 && (
                  <div className="border-t border-zinc-800 pt-3 space-y-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Lifecycle Timeline</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto text-[10px] custom-scrollbar">
                      {incidentTimeline.map((item) => (
                        <div key={item.id} className="p-1.5 bg-zinc-900/40 rounded-lg border border-zinc-800/40">
                          <p className="font-bold text-slate-200">{item.action} - <span className="text-slate-400 font-normal">{item.performed_by}</span></p>
                          <p className="text-slate-400">{item.description}</p>
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-slate-400">
                <AlertCircle className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-xs">Select an active incident from the queue to inspect details and assign responders.</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Bottom Panel: Live Update Log timeline */}
        <div className="bg-[#111113]/90 border border-zinc-800 rounded-2xl p-4 shadow-xl">
          <h2 className="text-xs font-black text-white uppercase tracking-widest border-b border-zinc-800 pb-2 mb-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Live Event Feed / Audit Log
          </h2>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar font-mono text-[11px]">
            {timelineEvents.map((evt) => {
              let tagColor = 'text-blue-400';
              if (evt.type === 'alert') tagColor = 'text-red-500 font-extrabold';
              else if (evt.type === 'success') tagColor = 'text-emerald-400';
              else if (evt.type === 'update') tagColor = 'text-amber-400';

              return (
                <div key={evt.id} className="flex items-start gap-3 py-1 border-b border-zinc-900/40 last:border-b-0">
                  <span className="text-slate-500 shrink-0 select-none">[{evt.time}]</span>
                  <span className={`${tagColor} shrink-0 uppercase tracking-widest text-[9px] border px-1 rounded bg-zinc-950/80`}>
                    {evt.type}
                  </span>
                  <span className="text-slate-300">{evt.message}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Incident Modal */}
        <AnimatePresence>
          {showDeleteModal && selectedIncident && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-2 text-red-500 font-extrabold text-sm uppercase tracking-wider">
                  <ShieldAlert className="w-5 h-5 animate-pulse" /> Confirm Incident Deletion
                </div>
                
                <p className="text-xs text-slate-300">
                  Are you sure you want to delete incident <b className="text-white">"{selectedIncident.title}"</b>? This will soft-delete the incident and remove it from all active queue screens.
                </p>

                {selectedIncident.priority === 'Critical' && (
                  <div className="space-y-2 p-3 bg-red-950/20 border border-red-500/25 rounded-xl">
                    <p className="text-[10px] font-bold text-red-400 uppercase">Critical Incident Verification Required</p>
                    <p className="text-[11px] text-slate-300">Please type the exact incident title (<span className="text-white select-all font-mono font-bold">{selectedIncident.title}</span>) or ID below to verify:</p>
                    <input
                      type="text"
                      placeholder="Type incident title or ID..."
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Deletion</label>
                  <textarea
                    placeholder="Enter reason..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs h-20 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmText('');
                      setDeleteReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-slate-300 hover:bg-zinc-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteIncident}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-xl bg-red-600 text-xs font-black text-white hover:bg-red-700 transition-all flex items-center gap-1 disabled:opacity-40"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Incident'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Chief Dispatcher Override Modal */}
        <AnimatePresence>
          {showOverrideModal && selectedIncident && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-[#111113] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center gap-2 text-amber-500 font-extrabold text-sm uppercase tracking-wider">
                  <Shield className="w-5 h-5 animate-pulse" /> Chief Dispatcher Override Center
                </div>

                <p className="text-xs text-slate-300">
                  You are overriding the default unit constraints for incident <b className="text-white">"{selectedIncident.title}"</b>. You can force assign busy units, reassign resources, or escalate.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Select Unit to Force-Assign (Including Busy Units)</label>
                    <select
                      value={overrideUnitId}
                      onChange={(e) => setOverrideUnitId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="">Select unit...</option>
                      {responders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.role}) - {r.status} - Distance: {r.location || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Override Authorization Reason</label>
                    <textarea
                      placeholder="State reason for overriding rules..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 text-slate-200 rounded-xl px-3 py-2 text-xs h-20 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowOverrideModal(false);
                      setOverrideUnitId('');
                      setOverrideReason('');
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-slate-300 hover:bg-zinc-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChiefOverride}
                    disabled={!overrideUnitId || !overrideReason}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all disabled:opacity-40"
                  >
                    Authorize Force Dispatch
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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

