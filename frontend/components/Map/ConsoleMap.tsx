'use client';

import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

interface ConsoleMapProps {
  incidents: any[];
  responders: any[];
  selectedIncidentId: string | null;
  onSelectIncident?: (incident: any) => void;
}

export default function ConsoleMap({
  incidents,
  responders,
  selectedIncidentId,
  onSelectIncident,
}: ConsoleMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const routePolylinesRef = useRef<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<'dark' | 'osm' | 'satellite'>('dark');

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      LRef.current = L;

      // Fix Leaflet default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [40.7560, -73.9868],
          zoom: 13,
          zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Remove existing tile layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (activeLayer === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
    } else if (activeLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri World Imagery';
    }

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
  }, [activeLayer]); // ONLY re-run when map layer style changes, NOT on incident data changes

  // Draw markers and route polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    // Remove route polylines
    if (routePolylinesRef.current) {
      routePolylinesRef.current.forEach((p: any) => p.remove());
      routePolylinesRef.current = [];
    }

    // 1. Draw Unresolved Incidents
    const activeIncidents = incidents.filter(inc => inc.status !== 'Resolved');
    const markerCoords: any[] = [];

    activeIncidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        // Priority colors
        let color = '#3B82F6'; // Low (Blue)
        if (inc.priority === 'Critical') color = '#EF4444'; // Red
        else if (inc.priority === 'High') color = '#F97316'; // Orange
        else if (inc.priority === 'Medium') color = '#FACC15'; // Yellow

        const isSelected = selectedIncidentId === inc.id;

        // Custom divIcon with CSS animations if selected
        const iconHtml = `
          <div style="
            background-color: ${color}; 
            width: ${isSelected ? '34px' : '28px'}; 
            height: ${isSelected ? '34px' : '28px'}; 
            border-radius: 50%; 
            border: 2px solid white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-size: ${isSelected ? '16px' : '14px'}; 
            box-shadow: 0 0 ${isSelected ? '15px' : '8px'} ${color};
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            transform: ${isSelected ? 'scale(1.2)' : 'none'};
          ">
            🚨
          </div>
        `;

        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: isSelected ? [34, 34] : [28, 28] });
        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; min-width: 150px;">
            <strong style="color: ${color}; font-size: 13px;">${inc.title}</strong><br/>
            <span>Priority: <b>${inc.priority}</b></span><br/>
            <span>Status: <b>${inc.status}</b></span><br/>
            <small style="color: #64748b; display: block; margin-top: 4px;">${inc.address || ''}</small>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectIncident) {
            onSelectIncident(inc);
          }
        });

        markersRef.current[`inc_${inc.id}`] = marker;
        markerCoords.push([inc.latitude, inc.longitude]);
      }
    });

    // 2. Draw Responders
    responders.forEach((resp) => {
      if (resp.lat && resp.lng) {
        const iconHtml = `
          <div style="
            background-color: #2563EB; 
            width: 28px; 
            height: 28px; 
            border-radius: 50%; 
            border: 2px solid white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-weight: bold; 
            font-size: 10px; 
            box-shadow: 0 0 8px #2563EB;
          ">
            ${resp.callSign || 'EMS'}
          </div>
        `;
        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28] });
        const marker = L.marker([resp.lat, resp.lng], { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <strong style="color: #2563EB;">Unit ${resp.name}</strong><br/>
            <span>Role: <b>${resp.role}</b> | Status: <b>${resp.status}</b></span><br/>
            <span>Speed: <b>${resp.speed} km/h</b> | Battery: <b>${resp.battery}%</b></span>
          </div>
        `);

        markersRef.current[`resp_${resp.id}`] = marker;
        markerCoords.push([resp.lat, resp.lng]);
      }
    });

    // 3. Draw Route Polylines if Selected Incident has Assigned Responders
    const ROUTE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
    if (selectedIncidentId) {
      const selInc = incidents.find(inc => inc.id === selectedIncidentId);
      if (selInc) {
        // Draw route for primary assigned user and any other units assigned
        const assignedResps = responders.filter(r => r.id === selInc.assigned_user_id || r.incident_id === selInc.id);
        assignedResps.forEach((resp, index) => {
          if (resp.lat && resp.lng && selInc.latitude && selInc.longitude) {
            const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
            api.get(`/geocoding/route?start_lat=${resp.lat}&start_lng=${resp.lng}&end_lat=${selInc.latitude}&end_lng=${selInc.longitude}`)
              .then((route) => {
                if (route.polyline && mapInstanceRef.current && LRef.current) {
                  const poly = LRef.current.polyline(route.polyline, {
                    color: routeColor,
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '8, 8',
                  }).addTo(mapInstanceRef.current);
                  routePolylinesRef.current.push(poly);
                }
              })
              .catch((e) => console.warn('Could not load driving route line:', e));
          }
        });
      }
    }

    // 4. Fit bounds to display all markers (if they exist)
    if (markerCoords.length > 0) {
      const bounds = L.latLngBounds(markerCoords);
      // Zoom and center to active markers with limit on extreme zoom
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [incidents, responders, selectedIncidentId]);

  // Center Map on selected incident when changed
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIncidentId) return;

    const selInc = incidents.find(inc => inc.id === selectedIncidentId);
    if (selInc && selInc.latitude && selInc.longitude) {
      map.setView([selInc.latitude, selInc.longitude], 15);
      // Open popup
      const marker = markersRef.current[`inc_${selectedIncidentId}`];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedIncidentId]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 rounded-2xl overflow-hidden" />

      {/* Map Layer Switcher (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex bg-[#18181B] border border-[#27272A] rounded-lg p-1 shadow-xl text-xs gap-1">
        {[
          { id: 'dark', label: 'Dark' },
          { id: 'osm', label: 'Street' },
          { id: 'satellite', label: 'Satellite' }
        ].map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as any)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              activeLayer === layer.id
                ? 'bg-[#2563EB] text-white'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>
    </div>
  );
}
