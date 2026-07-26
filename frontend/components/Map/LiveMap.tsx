'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Layers, Navigation, Radio, AlertTriangle, X, Shield, MapPin, Compass, Phone } from 'lucide-react';
import { api } from '../../services/api';

interface LiveMapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  selectedResponderId?: string;
  selectedIncidentId?: string;
}

export default function LiveMap({ onLocationSelect, selectedResponderId, selectedIncidentId }: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  // Map state
  const [activeLayer, setActiveLayer] = useState<'dark' | 'osm' | 'satellite'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  
  // Real DB Data
  const [incidents, setIncidents] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance_km: number; duration_minutes: number } | null>(null);

  // Load Leaflet dynamically on client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      LRef.current = L;

      // Fix Leaflet marker default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Center on New York Manhattan (or default seed center)
        const map = L.map(mapContainerRef.current, {
          center: [40.7560, -73.9868],
          zoom: 13,
          zoomControl: false
        });

        // Add Zoom control top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        mapInstanceRef.current = map;

        setTimeout(() => {
          map.invalidateSize();
        }, 200);

        // Click on map reverse geocoding picker
        map.on('click', async (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          try {
            const rev = await api.get(`/geocoding/reverse?lat=${lat}&lng=${lng}`);
            const address = rev.formatted_address || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
            setSelectedAddress(address);
            if (onLocationSelect) {
              onLocationSelect({ lat, lng, address });
            }
          } catch (err) {
            console.error(err);
          }
        });
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
  }, [activeLayer]);

  // Fetch Incidents & Responders from Backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        const incs = await api.get('/incidents').catch(() => []);
        const locs = await api.get('/locations/latest').catch(() => []);
        setIncidents(incs);
        setResponders(locs);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000); // 5s refresh
    return () => clearInterval(interval);
  }, []);

  // Render Markers on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => marker.remove());
    markersRef.current = {};

    // 1. Render Incidents
    incidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        const color = inc.priority === 'Critical' ? '#EF4444' : inc.priority === 'High' ? '#F59E0B' : '#2563EB';
        const iconHtml = `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 10px ${color};">
            🔥
          </div>
        `;
        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28] });
        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon }).addTo(map);
        
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <strong style="color: ${color};">${inc.title}</strong><br/>
            <span>Priority: <b>${inc.priority}</b> | Category: ${inc.category}</span><br/>
            <span>Status: <b>${inc.status}</b></span><br/>
            <small style="color: #64748b;">${inc.address || ''}</small>
          </div>
        `);

        markersRef.current[`inc_${inc.id}`] = marker;
      }
    });

    // 2. Render Responders
    responders.forEach((resp) => {
      if (resp.latitude && resp.longitude) {
        const iconHtml = `
          <div style="background-color: #2563EB; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px; box-shadow: 0 0 10px #2563EB;">
            EMS
          </div>
        `;
        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28] });
        const marker = L.marker([resp.latitude, resp.longitude], { icon: customIcon }).addTo(map);
        
        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b;">
            <strong style="color: #2563EB;">Unit ${resp.user_name || 'Responder'}</strong><br/>
            <span>Speed: <b>${resp.speed || 0} km/h</b> | Battery: <b>${resp.battery_level || 95}%</b></span><br/>
            <small style="color: #64748b;">${resp.formatted_address || ''}</small>
          </div>
        `);

        markersRef.current[`resp_${resp.user_id}`] = marker;
      }
    });
  }, [incidents, responders]);

  // Autocomplete Address Search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/geocoding/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.results || []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (res: any) => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAddress(res.formatted_address);

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([res.latitude, res.longitude], 16);
    }
    if (onLocationSelect) {
      onLocationSelect({ lat: res.latitude, lng: res.longitude, address: res.formatted_address });
    }
  };

  // Route calculation polyline between responder & incident
  const calculateRoute = async (startLat: number, startLng: number, endLat: number, endLng: number) => {
    try {
      const route = await api.get(`/geocoding/route?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endLat}&end_lng=${endLng}`);
      setRouteInfo({ distance_km: route.distance_km, duration_minutes: route.duration_minutes });

      const map = mapInstanceRef.current;
      const L = LRef.current;
      if (map && L && route.polyline) {
        if (routePolylineRef.current) {
          routePolylineRef.current.remove();
        }
        const poly = L.polyline(route.polyline, { color: '#EF4444', weight: 4, opacity: 0.8, dashArray: '6, 6' }).addTo(map);
        map.fitBounds(poly.getBounds(), { padding: [50, 50] });
        routePolylineRef.current = poly;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left Controls: Address Autocomplete Search */}
      <div className="absolute top-3 left-3 z-10 w-80 space-y-1">
        <div className="relative flex items-center bg-[#18181B] border border-[#27272A] rounded-xl shadow-xl">
          <Search className="w-4 h-4 text-[#64748B] ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Search address or landmark worldwide..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent px-3 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none"
          />
        </div>

        {/* Autocomplete Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSearchResult(item)}
                className="px-3 py-2 text-xs hover:bg-[#2563EB]/20 cursor-pointer space-y-0.5"
              >
                <p className="font-bold text-white line-clamp-1">{item.formatted_address}</p>
                <p className="text-[10px] text-[#94A3B8]">{item.city || item.country}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Right: Layer Switcher */}
      <div className="absolute top-3 right-12 z-10 flex bg-[#18181B] border border-[#27272A] rounded-lg p-1 shadow-xl text-xs gap-1">
        {[
          { id: 'dark', label: 'Dark' },
          { id: 'osm', label: 'Street' },
          { id: 'satellite', label: 'Satellite' }
        ].map((layer) => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id as any)}
            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${activeLayer === layer.id ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:text-white'}`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Selected Location / Route Info Badge */}
      {(selectedAddress || routeInfo) && (
        <div className="absolute bottom-4 left-4 z-10 bg-[#18181B] border border-[#27272A] rounded-xl p-3 shadow-2xl space-y-1 max-w-sm">
          {selectedAddress && (
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase">Selected Location</p>
                <p className="font-semibold text-white">{selectedAddress}</p>
              </div>
            </div>
          )}
          {routeInfo && (
            <div className="pt-2 border-t border-[#27272A] flex items-center justify-between text-xs">
              <span className="font-bold text-[#22C55E]">Driving Route: {routeInfo.distance_km} km</span>
              <span className="font-bold text-[#2563EB]">ETA: {routeInfo.duration_minutes} min</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
