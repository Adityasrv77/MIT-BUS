'use client';

import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div 
      style={{
        position: 'fixed', inset: 0, 
        display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg-dark)', zIndex: 100
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center' }}
      >
        <h1 style={{ 
          fontSize: '64px', margin: 0, 
          letterSpacing: '-2px', fontWeight: 700 
        }}>mit</h1>
        <h2 style={{ 
          fontSize: '14px', letterSpacing: '4px', 
          margin: '10px 0', fontWeight: 400 
        }}>UNIVERSITY / SHILLONG</h2>
        <h3 className="glow-text" style={{ 
          color: 'var(--primary-accent)', 
          fontSize: '12px', letterSpacing: '0.3em', 
          marginTop: '5px' 
        }}>TRANSPORTATION</h3>
      </motion.div>
    </motion.div>
  );
}
