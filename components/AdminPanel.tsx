'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeolocation } from '../lib/useGeolocation';
import { useBusLocations } from '../lib/useBusLocations';
import ManagementPanel from './ManagementPanel';
import LineView from './LineView';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Map, List, Radio, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import ProximityFeed from './ProximityFeed';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

// Stable session ID per device
function getSessionId() {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('mit_bus_session');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('mit_bus_session', id); }
  return id;
}

export default function AdminPanel() {
  const router = useRouter();
  const [selectedBus, setSelectedBus] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [showManagement, setShowManagement] = useState(false);
  const [activeTab, setActiveTab] = useState<'control' | 'map' | 'schedule'>('control');
  const [routeSummary, setRouteSummary] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState<{show: boolean, type: 'takeover' | 'none'}>({show: false, type: 'none'});
  const [pendingBus, setPendingBus] = useState<string | null>(null);
  const wakeLockRef = useRef<any>(null);
  const sessionId = getSessionId();

  const { coords, error, occupiedSeats, totalSeats, busLabel } = useGeolocation(selectedBus, sharing, sessionId);
  const allBuses = useBusLocations();

  // Recovery: check if this device was sharing this bus
  useEffect(() => {
    if (selectedBus && !sharing) {
      const stored = localStorage.getItem('mit_bus_active_sharing');
      if (stored === selectedBus) {
        setSharing(true);
      }
    }
  }, [selectedBus]);

  // Sync sharing state to local storage
  useEffect(() => {
    if (sharing && selectedBus) {
      localStorage.setItem('mit_bus_active_sharing', selectedBus);
    } else if (!sharing && selectedBus) {
      localStorage.removeItem('mit_bus_active_sharing');
    }
  }, [sharing, selectedBus]);

  // Handle external takeover: if someone else starts sharing this bus, we stop.
  useEffect(() => {
    if (sharing && selectedBus) {
      const currentBus = allBuses.find(b => b.id === selectedBus);
      // Only stop if the remote state clearly shows a DIFFERENT active session
      // We give it a small grace period (check lastUpdated) or just trust the ID
      if (currentBus && currentBus.active && currentBus.sharing_by && currentBus.sharing_by !== sessionId) {
        setSharing(false);
        localStorage.removeItem('mit_bus_active_sharing');
        // Optional: show a toast or alert
      }
    }
  }, [allBuses, sharing, selectedBus, sessionId]);

  useEffect(() => {
    if (!selectedBus) return;
    supabase
      .from('routes')
      .select('stop_name, stop_type')
      .eq('bus_id', selectedBus)
      .order('stop_order')
      .then(({ data }) => {
        if (data && data.length >= 2) {
          const start = data[0].stop_name;
          const end = data[data.length-1].stop_name;
          setRouteSummary(`${start} → ${end}`);
        }
      });
  }, [selectedBus]);

  // Wake lock — keep screen on while broadcasting
  useEffect(() => {
    const acquire = async () => {
      if (!sharing) {
        if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
        return;
      }
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        logger.error('WakeLock Error', err);
      }
    };
    acquire();
    return () => { if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; } };
  }, [sharing]);
  



  const handleBusSelect = (bus: string) => {
    // Check if someone else is already sharing this specific bus
    const currentBus = allBuses.find(b => b.id === bus);
    if (currentBus?.active && currentBus.sharing_by && currentBus.sharing_by !== sessionId) {
      setPendingBus(bus);
      setShowConfirm({ show: true, type: 'takeover' });
      return;
    }
    setSelectedBus(bus);
  };

  const handleToggleSharing = () => {
    if (!sharing) {
      // Check if someone else is already sharing
      const currentBus = allBuses.find(b => b.id === selectedBus);
      if (currentBus?.active && currentBus.sharing_by && currentBus.sharing_by !== sessionId) {
        setShowConfirm({ show: true, type: 'takeover' });
        return;
      }
      setSharing(true);
    } else {
      setSharing(false);
    }
  };

  const renderConfirmModal = () => (
    <ConfirmModal
      show={showConfirm.show}
      onConfirm={() => {
        const busToSelect = pendingBus || selectedBus;
        if (busToSelect) {
          setSelectedBus(busToSelect);
          setSharing(true);
          setPendingBus(null);
        }
        setShowConfirm({ show: false, type: 'none' });
      }}
      onCancel={() => {
        setPendingBus(null);
        setShowConfirm({ show: false, type: 'none' });
      }}
    />
  );

  if (!selectedBus) {
    return (
      <>
        <AnimatePresence>
          {showManagement && <ManagementPanel onBack={() => setShowManagement(false)} />}
        </AnimatePresence>
        <motion.div
          style={{ position: 'fixed', inset: 0, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div style={{ width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => router.push('/')}
                style={{ background: 'var(--surface)', padding: '8px 14px', borderRadius: '8px', color: 'var(--text-primary)', border: '1px solid #333', fontSize: '14px' }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Select Your Bus</h2>
            </div>
            <button
              onClick={() => router.push('/credits')}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid #444',
                color: '#666',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                flexShrink: 0,
              }}
            >
              i
            </button>
          </div>
        
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '400px' }}>
          {allBuses.map((bus, idx) => (
            <motion.div
              key={bus.id}
              style={{
                backgroundColor: 'var(--card-bg)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '16px',
                padding: '30px 10px',
                textAlign: 'center',
                gridColumn: idx === allBuses.length - 1 && allBuses.length % 2 !== 0 ? '1 / span 2' : 'auto',
                cursor: 'pointer'
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleBusSelect(bus.id)}
            >
              <h3 style={{ fontSize: '24px', margin: 0, color: 'var(--text-primary)' }}>{bus.label}</h3>
            </motion.div>
          ))}
          </div>

          <div style={{ marginTop: 'auto', width: '100%', maxWidth: '400px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => setShowManagement(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: 'rgba(246,148,35,0.1)',
                border: '1px solid rgba(246,148,35,0.4)',
                borderRadius: '12px',
                color: 'var(--primary-accent)',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(246,148,35,0.1)'
              }}
            >
              ⚙ Management
            </button>
          </div>
        </motion.div>
        {renderConfirmModal()}
      </>
    );
  }

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1c1c1c', zIndex: 1001, backgroundColor: 'var(--bg-dark)' }}>
        <button
          onClick={() => { 
            if (sharing) {
              if (confirm('Stop sharing location before changing bus?')) {
                setSharing(false);
                setSelectedBus(null);
              }
            } else {
              setSelectedBus(null); 
            }
          }}
          style={{
            background: 'var(--surface)', padding: '8px 14px', borderRadius: '8px',
            color: 'var(--text-primary)', border: '1px solid #333', fontSize: '14px'
          }}
        >
          ← Change Bus
        </button>

        <button
          onClick={() => router.push('/credits')}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'transparent',
            border: '1px solid #444',
            color: '#666',
            fontSize: '11px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif',
            flexShrink: 0,
            marginRight: 'auto',
            marginLeft: '12px'
          }}
        >
          i
        </button>

        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--primary-accent)' }}>
            {busLabel || `Bus ${selectedBus.replace('bus', '')}`}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {routeSummary}
          </p>
          {sharing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
              <div style={{ width: '6px', height: '6px', backgroundColor: '#00E676', borderRadius: '50%' }} />
              <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 700 }}>LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'control' && (
            <motion.div
              key="control"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
            >
              <div style={{ position: 'relative' }}>
                <AnimatePresence>
                  {sharing && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 0.15, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      style={{
                        position: 'absolute', top: '50%', left: '50%', width: '300px', height: '300px',
                        borderRadius: '50%', background: 'radial-gradient(circle, var(--primary-accent) 0%, transparent 70%)',
                        transform: 'translate(-50%, -50%)', pointerEvents: 'none'
                      }}
                    />
                  )}
                </AnimatePresence>

                <motion.button
                  style={{
                    width: '200px', height: '200px', borderRadius: '50%',
                    backgroundColor: 'var(--card-bg)',
                    border: sharing ? `2px solid var(--primary-accent)` : '2px solid #333',
                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                    boxShadow: sharing ? '0 0 40px rgba(246, 148, 35, 0.3)' : '0 10px 30px rgba(0,0,0,0.5)',
                    position: 'relative', zIndex: 1, outline: 'none'
                  }}
                  onClick={handleToggleSharing}
                  whileTap={{ scale: 0.95 }}
                >
                  <span style={{ fontSize: '18px', fontWeight: 800, color: sharing ? 'var(--primary-accent)' : '#fff' }}>
                    {sharing ? 'STOP' : 'START'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                    {sharing ? 'Broadcasting' : 'Broadcast Location'}
                  </span>
                </motion.button>
              </div>

              {/* Proximity Feed */}
              <div style={{ width: '100%', maxWidth: '400px', marginTop: '20px' }}>
                <ProximityFeed />
              </div>

              {/* Passenger Count */}
              <div style={{ marginTop: '30px', display: 'flex', gap: '12px', width: '100%', maxWidth: '400px' }}>
                <div style={{ flex: 1, background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid #222', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>BOARDED</p>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--primary-accent)' }}>{occupiedSeats}/{totalSeats}</h3>
                </div>
                {/* We'll add a 'Next Pickup' or similar here if needed */}
              </div>

              {/* Pickup Overview Section */}
              <div style={{ width: '100%', maxWidth: '400px', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '4px' }}>
                  <Users size={16} color="var(--primary-accent)" />
                  <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>PICKUP OVERVIEW</h3>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px', 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  padding: '4px'
                }} className="hide-scrollbar">
                  <PickupSummary busId={selectedBus} />
                </div>
              </div>

              {/* Lat/Lng display if needed */}
              {sharing && coords && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#555' }}>
                    LAT: {coords.lat.toFixed(5)} | LNG: {coords.lng.toFixed(5)}
                  </div>
                  <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: '700', color: coords.accuracy < 20 ? '#10B981' : coords.accuracy < 100 ? '#F59E0B' : '#EF4444' }}>
                    Accuracy: ±{Math.round(coords.accuracy)} meters
                    {coords.accuracy > 100 && " (Weak GPS Signal)"}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11px', color: '#F69423', fontWeight: '600', letterSpacing: '0.3px' }}>
                    🔆 Keep your device always on
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%' }}>
              <MapView buses={allBuses} selectedBusId={selectedBus} />
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div key="schedule" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ height: '100%', overflowY: 'auto' }}>
              <LineView initialBusId={selectedBus} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Tabs */}
      <div style={{ 
        height: '70px', 
        backgroundColor: 'var(--surface)', 
        borderTop: '1px solid #1c1c1c', 
        display: 'flex', 
        justifyContent: 'space-around', 
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {[
          { id: 'control', icon: <Radio size={20} />, label: 'Control' },
          { id: 'map', icon: <Map size={20} />, label: 'Map' },
          { id: 'schedule', icon: <List size={20} />, label: 'Schedule' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', color: activeTab === tab.id ? 'var(--primary-accent)' : '#666',
              cursor: 'pointer', transition: 'color 0.2s'
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '11px', fontWeight: activeTab === tab.id ? 700 : 500 }}>{tab.label}</span>
          </button>
        ))}
      </div>
      {renderConfirmModal()}
    </motion.div>
  );
}

// ── Confirm Modal Helper ────────────────────────────────────
function ConfirmModal({ show, onConfirm, onCancel }: { show: boolean, onConfirm: () => void, onCancel: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onCancel}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }} 
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            style={{
              width: '100%', maxWidth: '340px', backgroundColor: 'var(--card-bg)', 
              borderRadius: '24px', padding: '30px', border: '1px solid #333',
              position: 'relative', zIndex: 1, textAlign: 'center'
            }}
          >
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(246,148,35,0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
            }}>
              <Radio size={30} color="var(--primary-accent)" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 12px', color: '#fff' }}>Bus Already Active</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 24px' }}>
              Another driver is already sharing the live location for this bus. Do you want to take over?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onCancel}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #333',
                  backgroundColor: 'transparent', color: '#fff', fontWeight: 700, fontSize: '14px'
                }}
              >
                No, cancel
              </button>
              <button
                onClick={onConfirm}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                  backgroundColor: 'var(--primary-accent)', color: '#000', fontWeight: 800, fontSize: '14px'
                }}
              >
                Yes, take over
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}



// ─── Pickup Summary Helper ───────────────────────────────────
function PickupSummary({ busId }: { busId: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    const { data } = await supabase
      .from('reservations')
      .select('stop_name')
      .eq('bus_id', busId)
      .eq('status', 'active');
    
    if (data) {
      const c: Record<string, number> = {};
      data.forEach(r => {
        if (r.stop_name !== 'boarded') {
          const name = r.stop_name.trim();
          c[name] = (c[name] || 0) + 1;
        }
      });
      setCounts(c);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchCounts();

    // Poll every 5s as a fallback (Realtime may miss events)
    const interval = setInterval(fetchCounts, 5000);

    const channel = supabase
      .channel(`admin-pickup-sync-${busId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `bus_id=eq.${busId}` }, () => fetchCounts())
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [busId]);

  const waitingStops = Object.entries(counts).filter(([_, count]) => count > 0);

  if (loading) return <p style={{ fontSize: '12px', color: '#444', textAlign: 'center' }}>Loading pickups...</p>;
  if (waitingStops.length === 0) return (
    <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed #222' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#444', fontWeight: 500 }}>No students waiting at the moment</p>
    </div>
  );

  return (
    <>
      {waitingStops.map(([stop, count]) => (
        <motion.div
          key={stop}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '14px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{stop}</span>
          <div style={{ 
            backgroundColor: 'rgba(246, 148, 35, 0.15)', 
            color: 'var(--primary-accent)', 
            padding: '4px 10px', 
            borderRadius: '8px', 
            fontSize: '12px', 
            fontWeight: '900',
            border: '1px solid rgba(246, 148, 35, 0.3)'
          }}>
            {count} {count === 1 ? 'student' : 'students'}
          </div>
        </motion.div>
      ))}
    </>
  );
}
