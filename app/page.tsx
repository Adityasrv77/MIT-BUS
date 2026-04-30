'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import SplashScreen from '../components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShowSplash(false);
      router.push('/role-select');
    }, 2500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>
    </main>
  );
}
