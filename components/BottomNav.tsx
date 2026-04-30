'use client';

import { motion } from 'framer-motion';
import { Home, Map as MapIcon, Route } from 'lucide-react';

type Tab = 'home' | 'map' | 'line';

type BottomNavProps = {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'line', icon: Route, label: 'Timeline' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80px',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid #333',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: '20px',
      zIndex: 1000
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: isActive ? 'var(--primary-accent)' : '#888',
              position: 'relative',
              background: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <motion.div
              animate={{ scale: isActive ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon size={24} />
            </motion.div>
            <span style={{ fontSize: '12px', fontWeight: isActive ? '600' : '400' }}>{tab.label}</span>
            
            {isActive && (
              <motion.div
                layoutId="nav-glow"
                style={{
                  position: 'absolute',
                  top: '-10px',
                  width: '40px',
                  height: '40px',
                  background: 'radial-gradient(circle, rgba(244, 166, 32, 0.15) 0%, transparent 70%)',
                  zIndex: -1
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
