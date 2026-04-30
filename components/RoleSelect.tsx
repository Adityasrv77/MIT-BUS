'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const containerVars = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

function isPWA() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function RoleSelect() {
  const router = useRouter();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isPWA());
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstallPrompt(null); setIsStandalone(true); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') { setInstallPrompt(null); setIsStandalone(true); }
    } else {
      setShowIOSHint(v => !v);
    }
  };

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
    >
      <div style={{ position: 'absolute', top: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary-accent)', letterSpacing: '2px' }}>MIT BUS</h1>
      </div>

      <motion.div variants={containerVars} initial="hidden" animate="visible" style={{ width: '100%', maxWidth: '350px', textAlign: 'center' }}>
        {isStandalone ? (
          /* ── PWA / installed: show role selection ── */
          <>
            <motion.h2 variants={itemVars} style={{ fontSize: '22px', marginBottom: '40px', fontWeight: 500 }}>
              How are you using this?
            </motion.h2>

            <motion.button variants={itemVars} onClick={() => router.push('/guest')}
              style={{ width: '80%', padding: '18px 0', margin: '0 auto 20px', display: 'block', border: '2px solid var(--primary-accent)', borderRadius: '16px', color: 'var(--primary-accent)', fontSize: '18px', fontWeight: 600, transition: 'all 0.2s' }}
              whileHover={{ backgroundColor: 'var(--primary-accent)', color: '#000' }} whileTap={{ scale: 0.95 }}
            >Guest</motion.button>

            <motion.button variants={itemVars} onClick={() => router.push('/admin-login')}
              style={{ width: '80%', padding: '18px 0', margin: '0 auto', display: 'block', background: 'var(--primary-accent)', border: 'none', borderRadius: '16px', color: '#000', fontSize: '18px', fontWeight: 600, transition: 'all 0.2s' }}
              whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.95 }}
            >Admin</motion.button>
          </>
        ) : (
          /* ── Browser: prompt to install ── */
          <>
            <motion.p variants={itemVars} style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
              Install the MIT Bus app for the best experience.
            </motion.p>

            <motion.button variants={itemVars} onClick={handleInstall}
              style={{ width: '80%', padding: '18px 0', background: 'var(--primary-accent)', border: 'none', borderRadius: '16px', color: '#000', fontSize: '17px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginLeft: 'auto', marginRight: 'auto' }}
              whileHover={{ filter: 'brightness(1.1)' }} whileTap={{ scale: 0.95 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              Install App
            </motion.button>

            {showIOSHint && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginTop: '16px', fontSize: '13px', color: '#555', lineHeight: 1.6 }}
              >
                Tap <strong style={{ color: '#888' }}>Share</strong> → <strong style={{ color: '#888' }}>Add to Home Screen</strong>
              </motion.p>
            )}

            <p style={{ marginTop: '12px', fontSize: '11px', color: '#333', textAlign: 'center' }}>
              Use <span style={{ color: '#555', fontWeight: '700' }}>Chrome</span> for a smoother install experience
            </p>

            <motion.button variants={itemVars} onClick={() => router.push('/guest')}
              style={{ marginTop: '16px', fontSize: '13px', color: '#444', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#333' }}
            >
              Continue in browser
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
