'use client';

import { motion } from 'framer-motion';
import { Bus } from 'lucide-react';
import { BusData } from '../lib/useBusLocations';

type BusCardProps = {
  bus: BusData;
  onClick: () => void;
};


export default function BusCard({ bus, onClick }: BusCardProps) {
  return (
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
    </motion.div>
  );
}
