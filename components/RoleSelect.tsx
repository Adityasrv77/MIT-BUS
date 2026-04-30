'use client';

import { motion } from 'framer-motion';

import { useRouter } from 'next/navigation';

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
      </motion.div>
    </motion.div>
  );
}
