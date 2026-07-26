'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface LocationPickerMapProps {
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

export default function LocationPickerMap({
  onLocationSelect,
  initialLat,
  initialLng,
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [activeLayer, setActiveLayer] = useState<'osm' | 'dark' | 'satellite'>('osm');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load Leaflet on client-side
  useEffect(() => {
    if (typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      LRef.current = L;

      // Fix Leaflet marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      const startLat = initialLat || 40.7560;
      const startLng = initialLng || -73.9868;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [startLat, startLng],
          zoom: 14,
          zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstanceRef.current = map;

        // Custom Red Pin Icon
        const iconHtml = `
          <div style="background-color: #EF4444; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 10px #EF4444;">
            📍
          </div>
        `;
        const redIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28] });

        // Add a draggable marker
        const marker = L.marker([startLat, startLng], {
          draggable: true,
          icon: redIcon,
        }).addTo(map);
        markerRef.current = marker;

        // Trigger selection on load if not set
        if (onLocationSelect && !initialLat) {
          onLocationSelect({ lat: startLat, lng: startLng, address: 'Default Midtown Location' });
        }

        // Handle dragend
        marker.on('dragend', async () => {
          const latlng = marker.getLatLng();
          if (onLocationSelect) {
            onLocationSelect({
              lat: latlng.lat,
              lng: latlng.lng,
              address: `${latlng.lat.toFixed(4)}°, ${latlng.lng.toFixed(4)}°`,
            });
          }
        });

        // Click on map to place/move marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          if (onLocationSelect) {
            onLocationSelect({
              lat,
              lng,
              address: `${lat.toFixed(4)}°, ${lat.lng.toFixed(4)}°`,
            });
          }
        });

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

  // Update Base Tile Layer based on activeLayer state
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

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; OpenStreetMap contributors';

    if (activeLayer === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap &copy; CARTO';
    } else if (activeLayer === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Esri World Imagery';
    }

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
  }, [activeLayer]);

  // Sync marker position when external coordinates update (e.g. from search)
  useEffect(() => {
    const marker = markerRef.current;
    const map = mapInstanceRef.current;
    if (marker && map && initialLat && initialLng) {
      const latlng = marker.getLatLng();
      if (latlng.lat !== initialLat || latlng.lng !== initialLng) {
        marker.setLatLng([initialLat, initialLng]);
        map.setView([initialLat, initialLng], map.getZoom());
      }
    }
  }, [initialLat, initialLng]);

  // Invalidate size on fullscreen change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, [isFullscreen]);

  return (
    <div className={isFullscreen ? "fixed inset-0 z-50 p-6 bg-zinc-950 flex flex-col" : "relative w-full h-full"}>
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0 rounded-2xl overflow-hidden" />

      {/* Layer Switcher and Fullscreen Controls */}
      <div className="absolute top-8 left-8 z-[1000] flex items-center gap-2">
        <div className="flex bg-zinc-950/90 border border-zinc-800 rounded-xl p-1.5 shadow-xl text-xs gap-1 backdrop-blur-sm">
          {[
            { id: 'osm', label: 'Street Map' },
            { id: 'dark', label: 'Dark mode' },
            { id: 'satellite', label: 'Satellite' }
          ].map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => setActiveLayer(layer.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                activeLayer === layer.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl shadow-xl hover:bg-zinc-900 text-slate-300 hover:text-white transition-colors backdrop-blur-sm flex items-center justify-center min-w-[36px] min-h-[36px]"
          title={isFullscreen ? 'Exit Full Screen' : 'View Full Screen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
