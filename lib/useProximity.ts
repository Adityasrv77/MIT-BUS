import { useState, useEffect, useRef } from 'react';
import { useBusLocations, BusData } from './useBusLocations';
import { supabase } from './supabase';

export type ProximityEvent = {
  busId: string;
  busLabel: string;
  locationName: string;
  timestamp: number;
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
  let lat = Number(p.Latitude ?? p.latitude ?? p.lat ?? 0);
  let lng = Number(p.Longitude ?? p.longitude ?? p.lng ?? 0);

  // Auto-correct swapped coordinates in the DB (India is lat 20-30, lng 70-90)
  if (lat > 60 && lng < 40) {
    const temp = lat;
    lat = lng;
    lng = temp;
  }

  return { lat, lng };
}

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

const PROXIMITY_THRESHOLD_M = 500; // 500 meters

export function useProximity() {
  const buses = useBusLocations();
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);
  const [events, setEvents] = useState<ProximityEvent[]>([]);
  const lastAnnouncedRef = useRef<Record<string, string>>({}); // busId -> locationName

  // 1. Fetch GeoPoints once
  useEffect(() => {
    const fetchPoints = async () => {
      const { data, error } = await supabase
        .from('Geolocation')
        .select('*');
      
      if (data) {
        setGeoPoints(data as GeoPoint[]);
      }
    };
    fetchPoints();
  }, []);

  // 2. Check proximity on bus updates
  useEffect(() => {
    if (geoPoints.length === 0 || buses.length === 0) return;

    const activeBuses = buses.filter(b => b.active);
    const newEvents: ProximityEvent[] = [];
    const updatedAnnounced = { ...lastAnnouncedRef.current };
    let changed = false;

    activeBuses.forEach(bus => {
      // Find nearest point
      let nearestDist = Infinity;
      let nearestPoint: GeoPoint | null = null;

      // Optimizing: only check if bus actually moved significantly? 
      // For 600 points it's fast enough to check every time.
      geoPoints.forEach(point => {
        const { lat, lng } = getCoords(point);
        const d = haversineDistance(bus.lat, bus.lng, lat, lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearestPoint = point;
        }
      });

      if (nearestPoint && nearestDist < PROXIMITY_THRESHOLD_M) {
        const locName = nearestPoint['Location name'];
        
        // Only announce if it's a NEW location for this bus
        if (updatedAnnounced[bus.id] !== locName) {
          updatedAnnounced[bus.id] = locName;
          newEvents.push({
            busId: bus.id,
            busLabel: bus.label,
            locationName: locName,
            timestamp: Date.now()
          });
          changed = true;
        }
      } else {
        // If bus moved away from all points, reset last announced
        if (updatedAnnounced[bus.id]) {
          delete updatedAnnounced[bus.id];
          changed = true;
        }
      }
    });

    if (changed) {
      lastAnnouncedRef.current = updatedAnnounced;
      if (newEvents.length > 0) {
        setEvents(prev => [...newEvents, ...prev].slice(0, 10)); // Keep last 10
      }
    }
  }, [buses, geoPoints]);

  return events;
}
