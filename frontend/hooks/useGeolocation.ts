import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const getCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (err) => {
        let msg = 'Failed to retrieve location.';
        let denied = false;
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Geolocation permission denied. Please select your location on the map manually.';
          denied = true;
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out.';
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: msg,
          permissionDenied: denied,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  const setManualLocation = useCallback((lat: number, lng: number, acc: number = 10) => {
    setState({
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      loading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  useEffect(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    ...state,
    getCurrentLocation,
    setManualLocation,
  };
}
