import { useState, useEffect, useMemo, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from './firebase';
import { supabase, type BusRecord } from './supabase';

export type BusData = {
  id: string;
  active: boolean;
  sharing_by?: string;
  lat: number;
  lng: number;
  heading: number;
  lastUpdated: number;
  seatsAvailable: number;
  totalSeats: number;
  occupiedSeats: number;
  label: string;
  nearestLocation?: string;
};

type GeoPoint = {
  'Location name': string;
  Latitude?: number;
  Longitude?: number;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
};

function getCoords(p: GeoPoint) {
  // Extract values regardless of capitalization or spacing
  let lat = Number(p.latitude ?? p.Latitude ?? p.lat ?? p['latitude'] ?? 0);
  let lng = Number(p.longitude ?? p.Longitude ?? p.lng ?? p['longitude'] ?? 0);

  // Auto-correct swapped coordinates in the DB (India is lat 20-30, lng 70-90)
  // If we see a lat in the 70-90 range, it's definitely the longitude.
  if (Math.abs(lat) > 60 && Math.abs(lng) < 40) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  return { lat, lng };
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useBusLocations() {
  const [fbBuses, setFbBuses] = useState<Record<string, any>>({});
  const [supabaseBuses, setSupabaseBuses] = useState<BusRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, { reserved: number, boarded: number }>>({});
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);

  // Prevent stale fetches — abort any in-flight request when a new one starts
  const abortRef = useRef<AbortController | null>(null);

  // 1. Fetch data from Supabase (Polling every 10 seconds + Realtime)
  useEffect(() => {
    const fetchData = async () => {
      // Cancel any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      // Run all queries in PARALLEL for speed
      const [busResult, resResult, geoResult] = await Promise.all([
        supabase
          .from('buses')
          .select('id, label, total_seats, is_active'),
        supabase
          .from('reservations')
          .select('bus_id, stop_name')
          .eq('status', 'active'),
        supabase
          .from('Geolocation')
          .select('*')
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

      if (geoResult.data) {
        setGeoPoints(geoResult.data as GeoPoint[]);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);

    // Realtime listener for instant push updates
    const channel = supabase
      .channel(`db-sync-locations-${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'buses' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Geolocation' }, fetchData)
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

      const lat = fb.lat || 25.615765;
      const lng = fb.lng || 91.990026;

      let nearestLoc = undefined;
      
      // Removed DEBUG LOG to prevent console flooding

      if (geoPoints.length > 0 && fb.lat && fb.lng) {
        let nearestDist = Infinity;
        geoPoints.forEach(p => {
          const coords = getCoords(p);
          const d = haversineDistance(lat, lng, coords.lat, coords.lng);
          if (d < nearestDist) {
            nearestDist = d;
            nearestLoc = p['Location name'];
          }
        });
        // Only attach if it's within 800 meters
        if (nearestDist > 800) nearestLoc = undefined;
      }

      // Fallback explicitly for MIT University campus if not mapped in DB
      if (!nearestLoc) {
        const dCenter = haversineDistance(lat, lng, 25.615774, 91.990012);
        if (dCenter < 800) {
          nearestLoc = "MIT University Shillong";
        }
      }

      return {
        id,
        active: fb.active ?? sb.is_active,
        sharing_by: fb.sharing_by,
        lat,
        lng,
        heading: fb.heading || 0,
        lastUpdated: fb.lastUpdated || Date.now(),
        label: sb.label || fb.label || id.replace('bus', 'Bus '),
        occupiedSeats: boarded,
        reservedSeats: reserved,
        totalSeats: capacity,
        seatsAvailable: available,
        nearestLocation: nearestLoc,
      } as BusData;
    });
  }, [fbBuses, supabaseBuses, counts, geoPoints]);

  return buses;
}
