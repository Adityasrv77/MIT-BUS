import { useState, useEffect, useMemo, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { supabase, type BusRecord } from './supabase';

export type BusData = {
  id: string;
  active: boolean;
  lat: number;
  lng: number;
  heading: number;
  lastUpdated: number;
  seatsAvailable: number;
  totalSeats: number;
  occupiedSeats: number;
  label: string;
};

export function useBusLocations() {
  const [fbBuses, setFbBuses] = useState<Record<string, any>>({});
  const [supabaseBuses, setSupabaseBuses] = useState<BusRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, { reserved: number, boarded: number }>>({});

  // Prevent stale fetches — abort any in-flight request when a new one starts
  const abortRef = useRef<AbortController | null>(null);

  // 1. Fetch data from Supabase (Polling every 10 seconds + Realtime)
  useEffect(() => {
    const fetchData = async () => {
      // Cancel any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // Run both queries in PARALLEL for speed (was sequential before)
      const [busResult, resResult] = await Promise.all([
        supabase
          .from('buses')
          // Only fetch the columns we actually use — not SELECT *
          .select('id, label, total_seats, is_active'),
        supabase
          .from('reservations')
          .select('bus_id, stop_name')
          .eq('status', 'active')
      ]);

      if (busResult.data) setSupabaseBuses(busResult.data as BusRecord[]);

      if (resResult.data) {
        const newCounts: Record<string, { reserved: number, boarded: number }> = {};
        resResult.data.forEach(r => { 
          if (!newCounts[r.bus_id]) newCounts[r.bus_id] = { reserved: 0, boarded: 0 };
          if (r.stop_name === 'boarded') {
            newCounts[r.bus_id].boarded++;
          } else {
            newCounts[r.bus_id].reserved++;
          }
        });
        setCounts(newCounts);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    // Realtime listener for instant push updates
    const channel = supabase
      .channel('db-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, fetchData)
      .subscribe();

    return () => {
      clearInterval(interval);
      if (abortRef.current) abortRef.current.abort();
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Listen to Firebase for real-time GPS ONLY
  useEffect(() => {
    const busesRef = ref(db, 'buses');
    const unsubscribe = onValue(busesRef, (snapshot) => {
      const val = snapshot.val();
      if (val) setFbBuses(val);
    });
    return () => unsubscribe();
  }, []);

  // 3. Merge the data: Supabase = source of truth, Firebase = live GPS
  const buses = useMemo(() => {
    return supabaseBuses.map(sb => {
      const id = sb.id;
      const fb = fbBuses[id] || {};
      const busCounts = counts[id] || { reserved: 0, boarded: 0 };
      
      const capacity = sb.total_seats || 25;
      const boarded = busCounts.boarded;
      const reserved = busCounts.reserved;

      const physicalTotal = Math.max(0, capacity - boarded);
      const available = Math.max(0, physicalTotal - reserved);

      return {
        id,
        active: fb.active ?? sb.is_active,
        lat: fb.lat || 25.560124,
        lng: fb.lng || 91.903749,
        heading: fb.heading || 0,
        lastUpdated: fb.lastUpdated || Date.now(),
        label: sb.label || fb.label || id.replace('bus', 'Bus '),
        occupiedSeats: boarded,
        reservedSeats: reserved,
        totalSeats: capacity,
        seatsAvailable: available,
      } as BusData;
    });
  }, [fbBuses, supabaseBuses, counts]);

  return buses;
}
