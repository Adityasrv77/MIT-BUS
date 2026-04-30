'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function RoleSelect() {
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstallPrompt(null);
      setInstalled(true);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setInstalled(true);
      }
    } else {
      // iOS / unsupported — show manual hint
      setShowIOSHint(v => !v);
    }
  };

  return (
    <motion.div 
      style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
    >
      <div style={{ position: 'absolute', top: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary-accent)', letterSpacing: '2px' }}>MIT BUS</h1>
      </div>

      <motion.div 
        variants={containerVars} 
        initial="hidden" 
        animate="visible"
        style={{ width: '100%', maxWidth: '350px', textAlign: 'center' }}
      >
        <motion.h2 
          variants={itemVars}
          style={{ fontSize: '22px', marginBottom: '40px', fontWeight: 500 }}
        >
          How are you using this?
        </motion.h2>
        
        <motion.button
          variants={itemVars}
          onClick={() => router.push('/guest')}
          style={{
            width: '80%', padding: '18px 0', margin: '0 auto 20px', display: 'block',
            border: '2px solid var(--primary-accent)', borderRadius: '16px',
            color: 'var(--primary-accent)', fontSize: '18px', fontWeight: 600,
            transition: 'all 0.2s'
          }}
          whileHover={{ backgroundColor: 'var(--primary-accent)', color: '#000' }}
          whileTap={{ scale: 0.95 }}
        >
          Guest
        </motion.button>

        <motion.button
          variants={itemVars}
          onClick={() => router.push('/admin-login')}
          style={{
            width: '80%', padding: '18px 0', margin: '0 auto', display: 'block',
            background: 'var(--primary-accent)', border: 'none', borderRadius: '16px',
            color: '#000', fontSize: '18px', fontWeight: 600,
            transition: 'all 0.2s'
          }}
          whileHover={{ filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.95 }}
        >
          Admin
        </motion.button>

        {/* Install App — always visible, adapts to browser */}
        {!installed && (
          <motion.div variants={itemVars} style={{ marginTop: '20px' }}>
            <motion.button
              onClick={handleInstall}
              style={{
                width: '80%', padding: '14px 0',
                border: '1px solid #2a2a2a', borderRadius: '16px',
                color: '#555', fontSize: '14px', fontWeight: 600,
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginLeft: 'auto', marginRight: 'auto',
              }}
              whileHover={{ borderColor: 'var(--primary-accent)', color: 'var(--primary-accent)' }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              Install App
            </motion.button>
            {showIOSHint && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '10px', fontSize: '12px', color: '#444', textAlign: 'center', lineHeight: 1.5 }}
              >
                Tap <strong style={{ color: '#555' }}>Share</strong> → <strong style={{ color: '#555' }}>Add to Home Screen</strong>
              </motion.p>
            )}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

