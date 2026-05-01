'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 4 && !checking) {
      setPin(val);
      if (val.length === 4) {
        setChecking(true);
        // Check PIN against Supabase — NOT a hardcoded value
        const { data } = await supabase
          .from('admin_passwords')
          .select('password')
          .eq('role', 'driver')
          .single();

        if (data?.password === val) {
          setTimeout(() => router.push('/admin-panel'), 300);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
            setChecking(false);
          }, 500);
        }
      }
    }
  };

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
    >
      <button 
        onClick={() => router.push('/')}
        style={{ position: 'absolute', top: 30, left: 20, color: 'var(--text-muted)', fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', zIndex: 100 }}
      >
        ←
      </button>
      <button
        onClick={() => router.push('/credits')}
        style={{
          position: 'absolute',
          top: '30px',
          right: '20px',
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
          zIndex: 100,
        }}
      >
        i
      </button>

      <motion.div 
        className={error ? 'shake-anim' : ''}
        style={{
          backgroundColor: 'var(--card-bg)',
          border: `1.5px solid ${error ? '#FF3B30' : 'var(--card-border)'}`,
          borderRadius: '24px',
          padding: '40px 30px',
          width: '100%',
          maxWidth: '350px',
          textAlign: 'center'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '5px', color: 'var(--primary-accent)', letterSpacing: '1px' }}>Mit Bus</h2>
        <h3 style={{ color: 'var(--primary-accent)', fontSize: '22px', marginBottom: '10px' }}>Driver Access</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>Enter your driver PIN</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: pin.length > i ? (error ? '#FF3B30' : 'var(--primary-accent)') : 'transparent',
              border: `2px solid ${error ? '#FF3B30' : 'var(--primary-accent)'}`,
              transition: 'background 0.2s'
            }} />
          ))}
        </div>
        
        {error && <p style={{ color: '#FF3B30', fontSize: '14px', margin: 0 }}>Incorrect PIN</p>}
        {checking && !error && <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Checking...</p>}

        <input 
          type="number" 
          value={pin}
          onChange={handleInput}
          style={{ 
            opacity: 0, position: 'absolute', top: 0, left: 0, 
            width: '100%', height: '100%', cursor: 'pointer' 
          }}
          autoFocus
        />
      </motion.div>
    </motion.div>
  );
}
