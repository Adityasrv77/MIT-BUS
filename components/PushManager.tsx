'use client';

import { useState, useEffect } from 'react';
import { subscribeToPush } from '../lib/pwa';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X } from 'lucide-react';
import { ref, set } from 'firebase/database';
import { db } from '../lib/firebase';

export default function PushManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        // Show prompt after 5 seconds
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleSubscribe = async () => {
    const sub = await subscribeToPush();
    if (sub) {
      setPermission('granted');
      setShowPrompt(false);
      
      let uid = localStorage.getItem('mit_chat_uid');
      if (!uid) {
        uid = crypto.randomUUID();
        localStorage.setItem('mit_chat_uid', uid);
      }

      const subRef = ref(db, `push_subscriptions/${uid}`);
      await set(subRef, sub);
      console.log('FCM Token saved to Firebase');
    }
  };

  if (permission === 'granted') return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '20px',
            right: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid #333',
            borderRadius: '20px',
            padding: '20px',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: 'rgba(246,148,35,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bell size={24} color="var(--primary-accent)" />
          </div>
          
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px' }}>Notifications</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Get live updates on bus arrivals and seat availability.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowPrompt(false)}
              style={{ padding: '8px', color: '#666' }}
            >
              <X size={20} />
            </button>
            <button
              onClick={handleSubscribe}
              style={{
                backgroundColor: 'var(--primary-accent)',
                color: '#000',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800
              }}
            >
              Enable
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
