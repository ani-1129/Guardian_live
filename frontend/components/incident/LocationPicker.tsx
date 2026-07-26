'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Search, CheckCircle2, Navigation } from 'lucide-react';
import { LocationData } from '../../types/incident';
import { reverseGeocode } from '../../lib/reverseGeocode';

// Dynamically import Leaflet Map to avoid SSR errors
const DynamicLeafletMap = dynamic(
  () => import('../Map/LocationPickerMap').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
        <MapPin className="w-8 h-8 text-red-500/60 animate-bounce" />
        Initializing Interactive Incident Map...
      </div>
    ),
  }
);

interface LocationPickerProps {
  locationData: LocationData;
  onChange: (data: LocationData) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  locationData,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleDetectGps = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await handleCoordinateChange(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Geolocation permission denied.';
        }
        setGpsError(msg);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Auto reverse geocode whenever lat/lng changes if formatted address is empty
  useEffect(() => {
    if (locationData.latitude !== null && locationData.longitude !== null) {
      if (!locationData.street && !locationData.city) {
        reverseGeocode(locationData.latitude, locationData.longitude).then((res) => {
          onChange({
            ...locationData,
            street: res.street,
            city: res.city,
            state: res.state,
            country: res.country,
            pincode: res.pincode,
            rawAddress: res.formattedAddress,
          });
        });
      }
    }
  }, [locationData.latitude, locationData.longitude]);

  const handleCoordinateChange = async (lat: number, lng: number) => {
    const res = await reverseGeocode(lat, lng);
    onChange({
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      street: res.street,
      city: res.city,
      state: res.state,
      country: res.country,
      pincode: res.pincode,
      rawAddress: res.formattedAddress,
    });
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'GuardianLiveEnterprise/1.0',
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          await handleCoordinateChange(lat, lon);
        }
      }
    } catch (err) {
      console.warn('Search geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-red-500" />
          Step 2 — Incident Location
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Search for a location or click/tap on the map to place the marker. Drag the pin to adjust the exact position of the incident.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search landmark, street, city or address..."
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl pl-10 pr-24 py-3 text-slate-200 text-sm focus:outline-none focus:border-red-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-medium transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        <button
          type="button"
          onClick={handleDetectGps}
          disabled={gpsLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/30 text-sm font-semibold transition-all shrink-0"
        >
          <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
          {gpsLoading ? 'Locating...' : 'Use My GPS'}
        </button>
      </div>

      {gpsError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
          <div className="shrink-0 mt-0.5 font-bold">⚠️</div>
          <div>
            <span className="font-semibold block text-amber-200">GPS Notice</span>
            {gpsError}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-xl bg-zinc-900 relative">
        <div className="h-80 w-full relative">
          <DynamicLeafletMap
            onLocationSelect={(loc) => handleCoordinateChange(loc.lat, loc.lng)}
            initialLat={locationData.latitude}
            initialLng={locationData.longitude}
          />
        </div>
      </div>

      {/* Coordinates KPI Badge */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Latitude</span>
          <span className="text-sm font-mono text-slate-200 font-semibold">
            {locationData.latitude !== null ? locationData.latitude.toFixed(6) : 'Not Set'}
          </span>
        </div>
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Longitude</span>
          <span className="text-sm font-mono text-slate-200 font-semibold">
            {locationData.longitude !== null ? locationData.longitude.toFixed(6) : 'Not Set'}
          </span>
        </div>
        <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Selection Mode</span>
          <span className="text-sm font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {locationData.latitude !== null ? 'Map Pin Position' : 'Pending Selection'}
          </span>
        </div>
      </div>

      {/* Address Fields with Manual Editing */}
      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Verified Address Details
          </h4>
          <button
            type="button"
            onClick={() => setManualOverride(!manualOverride)}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium"
          >
            {manualOverride ? 'Lock Fields' : 'Edit Manually'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Street / Landmark</label>
            <input
              type="text"
              value={locationData.street || ''}
              disabled={!manualOverride}
              onChange={(e) => onChange({ ...locationData, street: e.target.value })}
              placeholder="e.g. 5th Avenue, near Metro Station"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">City / Town</label>
            <input
              type="text"
              value={locationData.city || ''}
              disabled={!manualOverride}
              onChange={(e) => onChange({ ...locationData, city: e.target.value })}
              placeholder="e.g. New York"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">State / Province</label>
            <input
              type="text"
              value={locationData.state || ''}
              disabled={!manualOverride}
              onChange={(e) => onChange({ ...locationData, state: e.target.value })}
              placeholder="e.g. NY"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Pincode / Zipcode</label>
            <input
              type="text"
              value={locationData.pincode || ''}
              disabled={!manualOverride}
              onChange={(e) => onChange({ ...locationData, pincode: e.target.value })}
              placeholder="e.g. 10001"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-red-500 disabled:opacity-60"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
