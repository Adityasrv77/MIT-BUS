'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Info, Phone, User, X } from 'lucide-react';
import { BusData } from '../lib/useBusLocations';
import { supabase } from '../lib/supabase';

type BusCardProps = {
  bus: BusData;
  onClick: () => void;
};

export default function BusCard({ bus, onClick }: BusCardProps) {
  const [driver, setDriver] = useState<{ name: string; phone: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchDriverInfo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
    if (driver) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('name, phone')
        .eq('bus_id', bus.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setDriver(data);
      } else {
        setDriver({ name: 'Not Assigned', phone: 'N/A' });
      }
    } catch (err) {
      console.error('Error fetching driver:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        onClick={onClick}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '16px 20px',
          marginBottom: '12px',
          cursor: 'pointer',
          opacity: bus.active ? 1 : 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
        whileHover={{ 
          scale: 1.02, 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(244, 166, 32, 0.3)'
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            backgroundColor: bus.active ? 'rgba(244, 166, 32, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bus size={20} color={bus.active ? 'var(--primary-accent)' : '#666'} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', margin: 0, fontWeight: '700' }}>{bus.label}</h3>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchDriverInfo}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Info size={16} />
          </button>
          
          <div style={{ 
            background: bus.active ? 'linear-gradient(135deg, rgba(244, 166, 32, 0.2), rgba(244, 166, 32, 0.1))' : 'rgba(255, 255, 255, 0.05)', 
            color: bus.active ? 'var(--primary-accent)' : '#666',
            padding: '6px 14px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            border: bus.active ? '1px solid rgba(244, 166, 32, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
            letterSpacing: '0.5px'
          }}>
            {bus.active ? `${bus.seatsAvailable}/${bus.totalSeats || 25}` : 'OFFLINE'}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '340px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '28px',
                padding: '30px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                zIndex: 1,
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
              }}
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#555' }}
              >
                <X size={20} />
              </button>

              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(246, 148, 35, 0.1)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
              }}>
                <User size={30} color="var(--primary-accent)" />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', color: '#fff' }}>Bus Driver</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px', fontWeight: '500' }}>Contact information for {bus.label}</p>

              {loading ? (
                <div style={{ padding: '20px 0' }}>
                  <div className="pulse-loader" style={{ width: '30px', height: '30px', backgroundColor: 'var(--primary-accent)', borderRadius: '50%', margin: '0 auto' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ 
                    padding: '16px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', 
                    display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(255,255,255,0.05)' 
                  }}>
                    <User size={18} color="#888" />
                    <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>{driver?.name}</span>
                  </div>
                  
                  {driver?.phone !== 'N/A' && (
                    <a 
                      href={`tel:${driver?.phone}`}
                      style={{ 
                        padding: '16px', backgroundColor: 'rgba(246, 148, 35, 0.1)', borderRadius: '16px', 
                        display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid rgba(246, 148, 35, 0.2)',
                        textDecoration: 'none', color: 'var(--primary-accent)'
                      }}
                    >
                      <Phone size={18} />
                      <span style={{ fontSize: '15px', fontWeight: '700' }}>{driver?.phone}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: '800', backgroundColor: 'var(--primary-accent)', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>CALL</span>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
