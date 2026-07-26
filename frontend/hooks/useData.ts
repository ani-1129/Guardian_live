'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useIncidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/incidents');
      setIncidents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  const createIncident = async (newIncident: any) => {
    const created = await api.post('/incidents', newIncident);
    setIncidents(prev => [created, ...prev]);
    return created;
  };

  const updateIncidentStatus = async (id: string, status: string) => {
    const updated = await api.patch(`/incidents/${id}?status=${status}`);
    setIncidents(prev => prev.map(item => item.id === id ? updated : item));
    return updated;
  };

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return { incidents, loading, error, refresh: fetchIncidents, createIncident, updateIncidentStatus };
}

export function useResponders() {
  const [responders, setResponders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchResponders = useCallback(async () => {
    try {
      setLoading(true);
      const users = await api.get('/users');
      const latestLocs = await api.get('/locations/latest').catch(() => []);
      
      const locMap: Record<string, any> = {};
      latestLocs.forEach((l: any) => {
        locMap[l.user_id] = l;
      });

      const merged = users.map((u: any) => {
        const loc = locMap[u.id];
        return {
          id: u.id,
          name: u.full_name,
          email: u.email,
          callSign: u.full_name.split(' ')[0] || 'Unit',
          role: u.roles[0] || 'Responder',
          status: u.is_active ? 'Available' : 'Off Duty',
          battery: loc ? loc.battery_level : 95,
          speed: loc ? loc.speed : 0,
          lat: loc ? loc.latitude : 40.7128,
          lng: loc ? loc.longitude : -74.0060,
          location: loc ? `${loc.latitude.toFixed(4)}°, ${loc.longitude.toFixed(4)}°` : 'HQ Station'
        };
      });

      setResponders(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResponders();
  }, [fetchResponders]);

  return { responders, loading, refresh: fetchResponders };
}

export function useGeofences() {
  const [geofences, setGeofences] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGeofences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/geofences');
      setGeofences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGeofence = async (data: any) => {
    const created = await api.post('/geofences', data);
    setGeofences(prev => [...prev, created]);
    return created;
  };

  const deleteGeofence = async (id: string) => {
    await api.delete(`/geofences/${id}`);
    setGeofences(prev => prev.filter(g => g.id !== id));
  };

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  return { geofences, loading, refresh: fetchGeofences, createGeofence, deleteGeofence };
}

export function useAnalytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get('/analytics/stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { stats, loading, refresh: fetchAnalytics };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  return { notifications, refresh: fetchNotifs, markAllRead };
}
