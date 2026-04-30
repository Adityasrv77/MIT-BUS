'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, RouteStop } from '../lib/supabase';

const BUS_IDS = ['bus1', 'bus2', 'bus3', 'bus4', 'bus5'];
const BUS_LABELS = ['Bus 1', 'Bus 2', 'Bus 3', 'Bus 4', 'Bus 5'];

export default function LineView({ initialBusId }: { initialBusId?: string }) {
  const [selectedBus, setSelectedBus] = useState(initialBusId || 'bus1');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [waitingCounts, setWaitingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedBus(initialBusId || 'bus1');
  }, [initialBusId]);

  useEffect(() => {
    let cancelled = false;

    const fetchStops = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('routes')
        .select('*')
        .eq('bus_id', selectedBus)
        .order('stop_order');
      if (!cancelled) {
        setStops(data || []);
        setLoading(false);
      }
    };

    const fetchWaitingCounts = async () => {
      const { data } = await supabase
        .from('reservations')
        .select('stop_name')
        .eq('bus_id', selectedBus)
        .eq('status', 'active');
      
      if (!cancelled && data) {
        const counts: Record<string, number> = {};
        data.forEach(r => {
          if (r.stop_name !== 'boarded') {
            const name = r.stop_name.trim();
            counts[name] = (counts[name] || 0) + 1;
          }
        });
        setWaitingCounts(counts);
      } else if (!cancelled) {
        setWaitingCounts({});
      }
    };

    fetchStops();
    fetchWaitingCounts();

    const channel = supabase
      .channel(`waiting-sync-${selectedBus}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        fetchWaitingCounts();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [selectedBus]);

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', fontWeight: '700' }}>Timeline</h2>

      {/* Horizontal Bus Selector */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '16px',
        marginBottom: '24px',
        borderBottom: '1px solid #1e1e1e'
      }} className="hide-scrollbar">
        {BUS_IDS.map((busId, i) => (
          <button
            key={busId}
            onClick={() => setSelectedBus(busId)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              backgroundColor: selectedBus === busId ? 'var(--primary-accent)' : 'var(--card-bg)',
              color: selectedBus === busId ? '#000' : '#fff',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              border: selectedBus === busId ? 'none' : '1px solid #2a2a2a',
              fontSize: '14px',
            }}
          >
            {BUS_LABELS[i]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative', marginLeft: '20px' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: '7px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          background: 'linear-gradient(to bottom, var(--primary-accent), #222)',
        }} />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ color: 'var(--text-muted)', paddingLeft: '30px' }}
            >
              Loading route...
            </motion.p>
          ) : (
            <motion.div
              key={selectedBus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {stops.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', paddingLeft: '30px' }}>No route defined for this bus.</p>
              ) : (
                stops.map((stop, index) => {
                  // Normalize for matching
                  const stopName = stop.stop_name.trim();
                  const count = waitingCounts[stopName] || 0;
                  return (
                    <motion.div
                      key={stop.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '28px' }}
                    >
                      {/* Dot */}
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: stop.stop_type !== 'stop' ? 'var(--primary-accent)' : '#111',
                        border: '2px solid var(--primary-accent)',
                        zIndex: 1,
                        marginTop: '3px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {stop.stop_type !== 'stop' && (
                          <div style={{ width: '6px', height: '6px', backgroundColor: '#000', borderRadius: '50%' }} />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{stop.stop_name}</h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{stop.stop_time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                            {stop.stop_type === 'start' ? 'Starting Point' : stop.stop_type === 'end' ? 'Destination' : 'Stop'}
                          </p>
                          {count > 0 && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              style={{ 
                                backgroundColor: 'rgba(244, 166, 32, 0.1)', 
                                color: 'var(--primary-accent)', 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: '800',
                                border: '1px solid rgba(244, 166, 32, 0.2)'
                              }}
                            >
                              {count} {count === 1 ? 'student' : 'students'} waiting
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
