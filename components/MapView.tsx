'use client';

import { useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BusData } from '../lib/useBusLocations';

// ── Stable icon instances ─────────────────────────────────────────────────────
// Created once at module level — never re-created on re-render
const uniIcon = L.divIcon({
  className: 'uni-pin-icon',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Icon cache: reuse the same L.Icon object for identical headings (rounded to 5°)
const iconCache = new Map<number, L.DivIcon>();

function getBusIcon(heading: number): L.DivIcon {
  // Snap to nearest 5° to maximise cache hits while keeping arrows accurate
  const snapped = Math.round(heading / 5) * 5;
  if (iconCache.has(snapped)) return iconCache.get(snapped)!;

  const icon = L.divIcon({
    className: 'bus-marker',
    html: `<svg width="36" height="36" viewBox="0 0 36 36"
              style="transform:rotate(${snapped}deg);filter:drop-shadow(0 2px 6px rgba(246,148,35,.5))">
             <circle cx="18" cy="18" r="17" fill="white" stroke="#F69423" stroke-width="2"/>
             <path d="M18 6L30 30L18 24L6 30L18 6Z" fill="#F69423"/>
           </svg>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  iconCache.set(snapped, icon);
  return icon;
}

// ── Canvas renderer (much faster with many markers) ───────────────────────────
const canvasRenderer = typeof window !== 'undefined' ? L.canvas() : undefined;

// ── MapUpdater — fly to selected bus ─────────────────────────────────────────
const MapUpdater = memo(function MapUpdater({
  selectedBusId,
  buses,
}: {
  selectedBusId?: string | null;
  buses: BusData[];
}) {
  const map = useMap();
  useEffect(() => {
    if (!selectedBusId) return;
    const bus = buses.find(b => b.id === selectedBusId);
    if (bus?.active) {
      map.flyTo([bus.lat, bus.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [selectedBusId]); // intentionally omit buses/map — only re-fly when selection changes
  return null;
});

// ── Individual bus marker — memoized so it only re-renders when its data changes
const BusMarker = memo(function BusMarker({ bus }: { bus: BusData }) {
  const icon = useMemo(() => getBusIcon(bus.heading), [bus.heading]);
  return (
    <Marker position={[bus.lat, bus.lng]} icon={icon}>
      <Tooltip
        permanent
        direction="top"
        offset={[0, -15]}
      >
        {bus.label} · {bus.seatsAvailable}/{bus.totalSeats || 25}
      </Tooltip>
    </Marker>
  );
});

// ── Types ─────────────────────────────────────────────────────────────────────
type MapViewProps = {
  buses: BusData[];
  selectedBusId?: string | null;
};

// ── Main component ────────────────────────────────────────────────────────────
const CENTER: [number, number] = [25.615765, 91.990026];

export default memo(function MapView({ buses, selectedBusId }: MapViewProps) {
  const activeBuses = useMemo(() => buses.filter(b => b.active), [buses]);

  return (
    <MapContainer
      center={CENTER}
      zoom={16}
      zoomControl={false}
      preferCanvas           // faster rendering for many markers
      style={{ height: '100%', width: '100%' }}
    >
      {/* Light CARTO voyager tiles — fast CDN, subdomains for parallel loads */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
        tileSize={256}
        keepBuffer={4}          // pre-load extra tiles around viewport
        updateWhenIdle={false}  // update tiles during pan for smoother feel
        updateWhenZooming={false} // skip tile fetches mid-zoom
      />

      {/* University pin — stable, never re-renders */}
      <Marker position={CENTER} icon={uniIcon}>
        <Tooltip permanent direction="top" offset={[0, -10]}>
          MIT University Shillong
        </Tooltip>
      </Marker>

      {/* Bus markers — each only re-renders when its own data changes */}
      {activeBuses.map(bus => (
        <BusMarker
          key={bus.id}   // stable key = no unmount/remount on seat updates
          bus={bus}
        />
      ))}

      <MapUpdater selectedBusId={selectedBusId} buses={buses} />
    </MapContainer>
  );
});
