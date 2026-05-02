import { useState, useEffect, useRef } from 'react';
import { ref, update, runTransaction } from 'firebase/database';
import { db } from './firebase';
import { supabase } from './supabase';
import { logger } from './logger';

// ── Haversine distance between two GPS points (returns meters) ──────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Config ──────────────────────────────────────────────────────────────────
const MIN_DISTANCE_M = 5;       // Ignore updates if bus moved less than 5 metres
const MAX_ACCURACY_M = 80;      // Discard readings worse than 80m (IP/WiFi guesses)
const ALPHA = 0.4;              // Smoothing factor: 0 = very smooth, 1 = raw

export function useGeolocation(busId: string | null, active: boolean, sessionId: string) {
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number, lng: number, accuracy: number} | null>(null);
  const [occupiedSeats, setOccupiedSeats] = useState(0);
  const [totalSeats, setTotalSeats] = useState(25);
  const [busLabel, setBusLabel] = useState<string>('');

  // Keep occupiedSeats fresh inside GPS callback without restarting the watcher
  const occupiedSeatsRef = useRef(occupiedSeats);
  useEffect(() => { occupiedSeatsRef.current = occupiedSeats; }, [occupiedSeats]);

  // Track the last pushed position to apply distance threshold
  const lastPushedRef = useRef<{lat: number, lng: number} | null>(null);
  // Smoothed lat/lng (exponential moving average)
  const smoothedRef = useRef<{lat: number, lng: number} | null>(null);

  // 1. Supabase — poll bus info and reservation counts every 10s
  useEffect(() => {
    if (!busId) return;

    const loadBusInfo = async () => {
      // Run both queries in parallel
      const [busResult, resResult] = await Promise.all([
        supabase
          .from('buses')
          .select('total_seats, label')
          .eq('id', busId)
          .single(),
        supabase
          .from('reservations')
          .select('stop_name')
          .eq('bus_id', busId)
          .eq('status', 'active'),
      ]);

      if (busResult.data) {
        setTotalSeats(busResult.data.total_seats);
        setBusLabel(busResult.data.label);
      }
      if (resResult.data) {
        const boardedCount = resResult.data.filter(r => r.stop_name === 'boarded').length;
        setOccupiedSeats(boardedCount);
      }
    };

    loadBusInfo();
    const interval = setInterval(loadBusInfo, 10000);

    const channel = supabase
      .channel(`bus-seats-${busId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `bus_id=eq.${busId}` }, loadBusInfo)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses', filter: `id=eq.${busId}` }, loadBusInfo)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [busId, active]);

  // 2. GPS Watch — with smoothing, accuracy filter, and distance threshold
  useEffect(() => {
    if (!busId) return;

    if (!active) {
      setCoords(null);
      // Reset smoothing on stop
      lastPushedRef.current = null;
      smoothedRef.current = null;
      return;
    }

    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, accuracy } = position.coords;

        // ── Accuracy filter: discard imprecise readings (e.g. IP-based) ──
        if (accuracy > MAX_ACCURACY_M) {
          // Still show the coord locally so the driver can see the bad signal
          setCoords({ lat: latitude, lng: longitude, accuracy });
          return; // But do NOT push to Firebase
        }

        // ── Exponential moving average (smooth out GPS jitter) ──
        const prev = smoothedRef.current;
        const smoothLat = prev ? prev.lat + ALPHA * (latitude - prev.lat) : latitude;
        const smoothLng = prev ? prev.lng + ALPHA * (longitude - prev.lng) : longitude;
        smoothedRef.current = { lat: smoothLat, lng: smoothLng };

        // ── Distance threshold: skip update if we barely moved ──
        const last = lastPushedRef.current;
        const dist = last ? haversineDistance(last.lat, last.lng, smoothLat, smoothLng) : Infinity;

        setCoords({ lat: smoothLat, lng: smoothLng, accuracy });

        if (dist < MIN_DISTANCE_M) return; // Not worth pushing

        lastPushedRef.current = { lat: smoothLat, lng: smoothLng };

        if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
          update(ref(db, `buses/${busId}`), {
            active: true,
            sharing_by: sessionId,
            lat: smoothLat,
            lng: smoothLng,
            heading: heading || 0,
            accuracy,
            lastUpdated: Date.now(),
          });
        }
      },
      (err) => {
        setError(err.message);
        logger.error('Geolocation Error', err, { busId });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [busId, active, sessionId]);

  // 3. Dedicated effect for active status (prevents flickering)
  useEffect(() => {
    if (!busId || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;

    if (active) {
      // First, do an immediate update to set active status
      update(ref(db, `buses/${busId}`), { 
        active: true,
        sharing_by: sessionId,
        lastUpdated: Date.now()
      });

      // Then, try to get a one-time quick position to update the map immediately
      navigator.geolocation.getCurrentPosition((pos) => {
        update(ref(db, `buses/${busId}`), {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          lastUpdated: Date.now(),
        });
      }, null, { enableHighAccuracy: true });
    }

    const stopSharing = () => {
      const busRef = ref(db, `buses/${busId}`);
      runTransaction(busRef, (currentData) => {
        if (currentData && currentData.sharing_by === sessionId) {
          return { ...currentData, active: false };
        }
        return; // Abort transaction if we aren't the owner
      }).catch(() => {});
    };

    if (!active) {
      stopSharing();
    }

    return () => {
      if (active) {
        stopSharing();
      }
    };
  }, [busId, active, sessionId]);

  return { coords, error, occupiedSeats, totalSeats, busLabel };
}
