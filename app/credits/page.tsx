'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';

const LinkedinIcon = ({ size = 14, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={color} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const devTeam = [
  { role: 'ASSISTANT PROFESSOR', name: 'Bitupan Deka, Concept & Ideation', initial: 'B', linkedin: 'https://www.linkedin.com/in/bitupan-deka-b5109b255?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' },
  { role: 'STUDENT', name: 'Onkar Mukherjee, Design', initial: 'O', linkedin: 'https://www.linkedin.com/in/onkar-mukherjee-a0a086222?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' },
  { role: 'STUDENT', name: 'Aditya Srivastava, Development', initial: 'A', linkedin: 'https://www.linkedin.com/in/aditya-srivastava-561961378?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app' },
];

const adminTeam = [
  { role: 'ADMIN', name: 'Debojyoti Deb Roy, Administrative Officer', initial: 'D', phone: '9123456789' },
  { role: 'ADMIN', name: 'Niewkoelang Syiemlieh, Administrative Officer', initial: 'N', phone: '9123456780' },
  { role: 'Driver', name: 'Driver 1', initial: '1', phone: '9123456781' },
  { role: 'Driver', name: 'Driver 2', initial: '2', phone: '9123456782' },
  { role: 'Driver', name: 'Driver 3', initial: '3', phone: '9123456783' },
  { role: 'Driver', name: 'Driver 4', initial: '4', phone: '9123456784' },
  { role: 'Driver', name: 'Driver 5', initial: '5', phone: '9123456785' },
];

function Section({
  label,
  members,
  startDelay = 0,
}: {
  label: string;
  members: { role: string; name: string; initial: string; phone?: string; linkedin?: string }[];
  startDelay?: number;
}) {
  return (
    <div style={{ marginBottom: '40px' }}>
      <p style={{ margin: '0 0 14px', fontSize: '11px', color: '#444', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {members.map(({ role, name, initial, phone, linkedin }, i) => (
          <motion.div
            key={`${label}-${name}`}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: startDelay + i * 0.06 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '14px 16px',
              backgroundColor: '#111',
              border: '1px solid #1c1c1c',
              borderRadius: '14px',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '38px', height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(246,148,35,0.08)',
                border: '1px solid rgba(246,148,35,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '800', color: '#F69423',
                flexShrink: 0,
              }}>
                {initial}
              </div>
              <div>
                <p style={{ margin: '0 0 1px', fontSize: '10px', color: '#F69423', fontWeight: '700', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                  {role}
                </p>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                  {name}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {phone && (
                <a 
                  href={`tel:${phone}`}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(246,148,35,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F69423',
                    textDecoration: 'none',
                    border: '1px solid rgba(246,148,35,0.2)'
                  }}
                >
                  <Phone size={14} />
                </a>
              )}
              {linkedin && (
                <a 
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,119,181,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0077B5',
                    textDecoration: 'none',
                    border: '1px solid rgba(0,119,181,0.2)'
                  }}
                >
                  <LinkedinIcon size={14} color="#0077B5" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

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

        <Section label="Admin Team" members={adminTeam} startDelay={0.1} />
        <Section label="Developer Team" members={devTeam} startDelay={0.5} />

        {/* Footer note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            marginTop: '32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: '#F69423', fontWeight: '800', letterSpacing: '0.5px' }}>
            MIT Robotics and Coding Club
          </p>
          <p style={{ margin: 0, fontSize: '11px', color: '#333', fontWeight: '600' }}>
            MIT University Meghalaya, Shillong
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#222', fontWeight: '600', letterSpacing: '1px' }}>
            © 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
