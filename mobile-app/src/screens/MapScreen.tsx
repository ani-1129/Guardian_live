import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

const BACKEND_WS_URL = 'ws://localhost:8000/ws';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection
  useEffect(() => {
    const activeSocket = io(BACKEND_WS_URL, {
      transports: ['websocket'],
      query: { token: 'mock-auth-token-replace-in-production' }
    });
    setSocket(activeSocket);

    return () => {
      activeSocket.disconnect();
    };
  }, []);

  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      Alert.alert('Permission Denied', 'Location access is required for real-time tracking.');
      return;
    }

    let bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== 'granted') {
      console.log('Background location access not granted');
    }

    setIsTracking(true);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  useEffect(() => {
    let subscription: any = null;

    if (isTracking) {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // send update every 5 seconds
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
          if (socket && socket.connected) {
            socket.emit('location_ping', {
              event: 'location_ping',
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              speed: newLocation.coords.speed,
              heading: newLocation.coords.heading,
              battery_level: 95
            });
          }
        }
      ).then((sub) => {
        subscription = sub;
      });
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isTracking, socket]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Guardian Live Responder</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.label}>Tracking Status:</Text>
        <Text style={isTracking ? styles.active : styles.inactive}>
          {isTracking ? 'Active & Streaming' : 'Offline'}
        </Text>
      </View>

      {location && (
        <View style={styles.coordBox}>
          <Text style={styles.text}>Lat: {location.coords.latitude}</Text>
          <Text style={styles.text}>Lng: {location.coords.longitude}</Text>
          <Text style={styles.text}>Speed: {location.coords.speed || 0} m/s</Text>
        </View>
      )}

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      <View style={styles.buttons}>
        {!isTracking ? (
          <Button title="Go Active (Share Location)" color="#e11d48" onPress={startTracking} />
        ) : (
          <Button title="Go Offline (Stop)" color="#475569" onPress={stopTracking} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 20,
  },
  statusBox: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    marginRight: 8,
  },
  active: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  inactive: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  coordBox: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    color: '#f1f5f9',
    fontSize: 14,
    marginVertical: 2,
  },
  error: {
    color: '#f43f5e',
    marginVertical: 10,
  },
  buttons: {
    width: '100%',
  },
});
