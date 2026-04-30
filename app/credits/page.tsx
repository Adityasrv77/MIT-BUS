'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const team = [
  {
    role: 'Concept & Ideation',
    name: 'Bitupan Deka',
    initial: 'B',
  },
  {
    role: 'Design',
    name: 'Onkar Mukherjee',
    initial: 'O',
  },
  {
    role: 'Development',
    name: 'Aditya Srivastava',
    initial: 'A',
  },
];

export default function CreditsPage() {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: '#0A0A0A',
      color: '#fff',
      fontFamily: "'DM Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        borderBottom: '1px solid #1a1a1a',
        position: 'sticky', top: 0,
        backgroundColor: '#0A0A0A',
        zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            width: '34px', height: '34px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #222',
            color: '#888',
            fontSize: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#555', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Credits
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '40px 24px 60px', maxWidth: '420px', margin: '0 auto', width: '100%' }}>

        {/* App identity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: '48px' }}
        >
          <h1 style={{
            fontSize: '36px', fontWeight: '900', margin: '0 0 6px',
            fontFamily: "'Sora', sans-serif", letterSpacing: '-1px',
          }}>
            MIT <span style={{ color: '#F69423' }}>Bus</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#444', margin: 0, fontWeight: '500' }}>
            Shillong Campus Transport System
          </p>
          <div style={{ width: '32px', height: '2px', backgroundColor: '#F69423', marginTop: '16px', borderRadius: '1px' }} />
        </motion.div>

        {/* Team */}
        <p style={{ margin: '0 0 16px', fontSize: '11px', color: '#444', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Developer Team
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {team.map(({ role, name, initial }, i) => (
            <motion.div
              key={role}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 18px',
                backgroundColor: '#111',
                border: '1px solid #1c1c1c',
                borderRadius: '16px',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '42px', height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(246,148,35,0.1)',
                border: '1px solid rgba(246,148,35,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: '800', color: '#F69423',
                fontFamily: "'Sora', sans-serif",
                flexShrink: 0,
              }}>
                {initial}
              </div>

              <div>
                <p style={{ margin: '0 0 2px', fontSize: '10px', color: '#F69423', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  {role}
                </p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  {name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '48px',
            fontSize: '12px',
            color: '#2e2e2e',
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          Made with care at MIT Shillong
        </motion.p>
      </div>
    </div>
  );
}
