'use client';

import { useProximity } from '../lib/useProximity';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bell } from 'lucide-react';

export default function ProximityFeed() {
  const events = useProximity();

  if (events.length === 0) return null;

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Bell size={16} color="var(--primary-accent)" />
        <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Live Activity</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={`${event.busId}-${event.timestamp}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '10px', 
                backgroundColor: 'rgba(246, 148, 35, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={16} color="var(--primary-accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                  <span style={{ color: 'var(--primary-accent)' }}>{event.busLabel}</span> reached <span style={{ color: '#fff' }}>{event.locationName}</span>
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' }}>
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
