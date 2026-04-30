'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useBusLocations } from '../lib/useBusLocations';
import BottomNav from './BottomNav';
import LineView from './LineView';
import BusCard from './BusCard';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, MapPin, Bus } from 'lucide-react';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

type Tab = 'home' | 'map' | 'line';

// Stable session ID per device
function getSessionId() {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem('mit_bus_session');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('mit_bus_session', id); }
  return id;
}

export default function GuestView() {
  const router = useRouter();
  const buses = useBusLocations();
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [activeTab, setActiveTabState] = useState<Tab>('home');

  // Sync tab with URL hash for back/forward support
  const setActiveTab = (tab: Tab) => {
    if (tab === 'home') {
      window.history.pushState(null, '', '#home');
    } else {
      window.history.pushState(null, '', `#${tab}`);
    }
    setActiveTabState(tab);
  };

  useEffect(() => {
    // Read initial hash
    const hash = window.location.hash.replace('#', '') as Tab;
    if (hash === 'map' || hash === 'line') setActiveTabState(hash);

    // Listen for browser back/forward
    const onPop = () => {
      const h = window.location.hash.replace('#', '') as Tab;
      setActiveTabState(h === 'map' || h === 'line' ? h : 'home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [isBoarded, setIsBoarded] = useState(false);
  const [showList, setShowList] = useState(true);
  const reservationIdRef = useRef<string | null>(null);
  const [showBusPicker, setShowBusPicker] = useState(false);

  // Home selection flow
  const [homeStep, setHomeStep] = useState<'initial' | 'bus' | 'place'>('initial');
  const [homeBus, setHomeBus] = useState<string | null>(null);   // e.g. 'bus1'
  const [homeBusLabel, setHomeBusLabel] = useState<string | null>(null); // e.g. 'Bus 1'
  const [homePlace, setHomePlace] = useState<string | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);

  // Load stops when a bus is selected
  useEffect(() => {
    if (!homeBus) return;
    setLoadingStops(true);
    
    const fetchStops = () => {
      supabase
        .from('routes')
        .select('stop_name')
        .eq('bus_id', homeBus)
        .order('stop_order')
        .then(({ data }) => {
          setStops(data?.map(r => r.stop_name) || []);
          setLoadingStops(false);
        });
    };

    fetchStops();
    const interval = setInterval(fetchStops, 5000);
    return () => clearInterval(interval);
  }, [homeBus]);


  // Create or Update reservation in Supabase
  const createReservation = async (busId: string, stopName: string) => {
    const sessionId = getSessionId();
    
    // If we already have a reservation ID, update it
    if (reservationIdRef.current) {
      await supabase
        .from('reservations')
        .update({ bus_id: busId, stop_name: stopName, status: 'active' })
        .eq('id', reservationIdRef.current);
      // Keep localStorage in sync with the new stop
      localStorage.setItem('mit_bus_home_bus', busId);
      localStorage.setItem('mit_bus_home_place', stopName);
      return;
    }

    // Otherwise create new
    const { data } = await supabase
      .from('reservations')
      .insert({ bus_id: busId, stop_name: stopName, session_id: sessionId, status: 'active' })
      .select('id')
      .single();
    
    if (data) {
      reservationIdRef.current = data.id;
      // Persist to localStorage
      localStorage.setItem('mit_bus_res_id', data.id);
      localStorage.setItem('mit_bus_home_bus', busId);
      localStorage.setItem('mit_bus_home_label', busesList.find(b => b.id === busId)?.label || busId);
      localStorage.setItem('mit_bus_home_place', stopName);
    }
  };

  // Cancel reservation
  const cancelReservation = async () => {
    if (!reservationIdRef.current) return;
    
    // Find which bus it was before cancelling
    const { data: res } = await supabase
      .from('reservations')
      .select('bus_id')
      .eq('id', reservationIdRef.current)
      .single();

    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationIdRef.current);
    
    reservationIdRef.current = null;
    // Clear localStorage
    localStorage.removeItem('mit_bus_res_id');
    localStorage.removeItem('mit_bus_home_bus');
    localStorage.removeItem('mit_bus_home_label');
    localStorage.removeItem('mit_bus_home_place');
  };

  // On mount: Restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const savedResId = localStorage.getItem('mit_bus_res_id');
      const savedBus = localStorage.getItem('mit_bus_home_bus');
      const savedLabel = localStorage.getItem('mit_bus_home_label');
      const savedPlace = localStorage.getItem('mit_bus_home_place');

      if (savedResId) {
        // Verify with Supabase if this reservation is still active
        const { data, error } = await supabase
          .from('reservations')
          .select('status, stop_name')
          .eq('id', savedResId)
          .single();

        if (data && data.status === 'active') {
          reservationIdRef.current = savedResId;
          setHomeBus(savedBus);
          setHomeBusLabel(savedLabel);
          setHomePlace(savedPlace);
          setIsBoarded(data.stop_name === 'boarded');
        } else {
          // Stale reservation in local storage, clear it
          localStorage.removeItem('mit_bus_res_id');
          localStorage.removeItem('mit_bus_home_bus');
          localStorage.removeItem('mit_bus_home_label');
          localStorage.removeItem('mit_bus_home_place');
        }
      }
    };
    restoreSession();
  }, []);

  const busesList = [
    { id: 'bus1', label: 'Bus 1' },
    { id: 'bus2', label: 'Bus 2' },
    { id: 'bus3', label: 'Bus 3' },
    { id: 'bus4', label: 'Bus 4' },
    { id: 'bus5', label: 'Bus 5' },
  ];

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
    >
      {/* Header */}
      <div style={{ 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        zIndex: 1000,
        backgroundColor: 'rgba(10, 10, 10, 0.5)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <button 
          onClick={() => router.back()}
          style={{
            background: 'rgba(255, 255, 255, 0.05)', 
            padding: '8px 12px', 
            borderRadius: '12px',
            color: 'var(--text-primary)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>←</span> Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: 'var(--primary-accent)', letterSpacing: '2px', textTransform: 'uppercase' }}>MIT BUS</h1>
          <div style={{ width: '20px', height: '2px', backgroundColor: 'var(--primary-accent)', margin: '2px auto 0', borderRadius: '1px' }} />
        </div>
        <button
          id="credits-info-btn"
          onClick={() => router.push('/credits')}
          style={{
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
            fontFamily: 'serif',
            flexShrink: 0,
          }}
        >
          i
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflowY: activeTab === 'map' ? 'hidden' : 'auto' }} className="hide-scrollbar">
        {activeTab === 'map' && (
          <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: '1', position: 'relative' }}>
              <MapView key="bus-tracker-map" buses={buses} selectedBusId={selectedBusId} />
            </div>
            
            <motion.div 
              animate={{ height: showList ? '360px' : '70px' }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              style={{ 
                position: 'relative',
                backgroundColor: 'rgba(17, 17, 17, 0.8)', 
                backdropFilter: 'blur(20px)',
                padding: '12px 20px 20px', 
                borderTopLeftRadius: '32px',
                borderTopRightRadius: '32px',
                zIndex: 10,
                boxShadow: '0 -20px 40px rgba(0,0,0,0.4)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '80px', // Space for bottom nav
                overflow: 'hidden'
              }}
            >
              <div 
                onClick={() => setShowList(!showList)}
                style={{ 
                  width: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '8px 0 16px'
                }}
              >
                <div style={{ width: '36px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', boxShadow: '0 0 10px #10B981' }} />
                    <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>Live Fleet</h2>
                  </div>
                  <div style={{ 
                    backgroundColor: 'rgba(255,255,255,0.05)', 
                    padding: '4px', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {showList ? <ChevronDown size={18} color="#888" /> : <ChevronUp size={18} color="#888" />}
                  </div>
                </div>
              </div>
              
              <div style={{ height: 'calc(100% - 50px)', overflowY: 'auto', display: showList ? 'block' : 'none' }} className="hide-scrollbar">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                  {buses.filter(b => b.active).map(bus => (
                    <BusCard 
                      key={bus.id} 
                      bus={bus} 
                      onClick={() => setSelectedBusId(bus.id)} 
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '100px' }} className="hide-scrollbar">
            
            {/* Hero / Greeting */}
            <div style={{
              padding: '30px 20px',
              background: 'linear-gradient(180deg, rgba(246, 148, 35, 0.05) 0%, rgba(10, 10, 10, 0) 100%)',
              position: 'relative'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '20px',
                  width: '100px',
                  height: '100px',
                  background: 'radial-gradient(circle, rgba(246, 148, 35, 0.1) 0%, rgba(246, 148, 35, 0) 70%)',
                  filter: 'blur(20px)',
                  zIndex: -1
                }}
              />
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ fontSize: '14px', color: 'var(--primary-accent)', marginBottom: '8px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}
              >
                Welcome back 👋
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontSize: '32px', fontWeight: '800', margin: 0, lineHeight: 1.1, letterSpacing: '-0.5px' }}
              >
                MIT University
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: '500' }}
              >
                Shillong Campus Transport System
              </motion.p>

              {/* Live Stats Row */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ display: 'flex', gap: '12px', marginTop: '20px' }}
              >
                {[
                  { label: 'Active Buses', value: buses.filter(b => b.active).length, color: '#10B981' },
                  { label: 'System Status', value: 'Live', color: '#3B82F6' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '16px 12px',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                  }}>
                    <p style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Action Cards */}
            <div style={{ padding: '20px' }}>

              {/* Selection Flow */}
              {homeStep === 'initial' && !isBoarded && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(246, 148, 35, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setHomeStep('bus')}
                    style={{
                      width: '100%',
                      padding: '20px',
                      background: 'linear-gradient(135deg, var(--primary-accent), var(--secondary-accent))',
                      color: '#000',
                      border: 'none',
                      borderRadius: '24px',
                      fontSize: '17px',
                      fontWeight: '900',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 8px 30px rgba(246, 148, 35, 0.2)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      marginBottom: '16px'
                    }}
                  >
                    <Bus size={22} />
                    Reserve Seat
                  </motion.button>
                </motion.div>
              )}

              {homeStep === 'bus' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Select Bus</h3>
                    <button onClick={() => setHomeStep('initial')} style={{ color: '#666', fontSize: '13px', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {buses.filter(b => b.active).length === 0 && (
                      <div style={{ padding: '32px 20px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed #222', borderRadius: '16px' }}>
                        <p style={{ margin: 0, color: '#444', fontSize: '14px', fontWeight: '600' }}>No buses are online right now</p>
                        <p style={{ margin: '6px 0 0', color: '#333', fontSize: '12px' }}>Please check back shortly</p>
                      </div>
                    )}
                    {buses.filter(b => b.active).map(bus => (
                      <motion.button
                        key={bus.id}
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setHomeBus(bus.id); setHomeBusLabel(bus.label); setHomeStep('place'); }}
                        style={{
                          padding: '18px 20px',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '16px',
                          color: '#fff',
                          textAlign: 'left',
                          fontSize: '16px',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '14px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(246,148,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bus size={18} color="var(--primary-accent)" />
                          </div>
                          {bus.label}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: bus.seatsAvailable === 0 ? '#EF4444' : bus.seatsAvailable <= 5 ? '#F59E0B' : '#10B981', backgroundColor: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '8px' }}>
                          {bus.seatsAvailable}/{bus.totalSeats || 25}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {homeStep === 'place' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>{homeBusLabel}</h3>
                    <button onClick={() => setHomeStep('bus')} style={{ color: '#666', fontSize: '13px', fontWeight: '700' }}>Change Bus</button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }}>Select your boarding point</p>
                  {loadingStops ? (
                    <div style={{ padding: '40px 0', textAlign: 'center' }}>
                      <div className="pulse-loader" style={{ width: '30px', height: '30px', backgroundColor: 'var(--primary-accent)', borderRadius: '50%', margin: '0 auto' }} />
                      <p style={{ color: '#444', fontSize: '13px', marginTop: '12px', fontWeight: '600' }}>Finding stops...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {stops.map(place => (
                        <motion.button
                          key={place}
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={async () => {
                            setHomePlace(place);
                            setHomeStep('initial');
                            setIsBoarded(true);
                            if (homeBus) await createReservation(homeBus, place);
                          }}
                          style={{
                            padding: '18px 20px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '16px',
                            color: '#fff',
                            textAlign: 'left',
                            fontSize: '16px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(246,148,35,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={18} color="var(--primary-accent)" />
                          </div>
                          {place}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Selection confirmation */}
              {homeStep === 'initial' && homeBus && homePlace && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    marginBottom: '24px',
                    padding: '20px',
                    backgroundColor: 'rgba(246, 148, 35, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(246, 148, 35, 0.2)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    boxShadow: '0 10px 30px rgba(246, 148, 35, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'rgba(246, 148, 35, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle2 size={20} color="var(--primary-accent)" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--primary-accent)', letterSpacing: '0.3px' }}>
                        {homeBusLabel} · {homePlace}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(246, 148, 35, 0.7)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        1 seat reserved
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await cancelReservation();
                      setIsBoarded(false);
                      setHomeBus(null);
                      setHomeBusLabel(null);
                      setHomePlace(null);
                    }}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: '10px', 
                      padding: '8px 14px', 
                      color: '#EF4444', 
                      fontSize: '13px', 
                      fontWeight: '700' 
                    }}
                  >
                    Cancel
                  </button>
                </motion.div>
              )}

              {/* Boarding Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{
                  backgroundColor: isBoarded ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isBoarded ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '24px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              >
                {/* Header row */}
                <div
                  style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: isBoarded ? 'default' : 'pointer' }}
                  onClick={() => { if (!isBoarded) setShowBusPicker(v => !v); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '16px',
                      backgroundColor: isBoarded ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {isBoarded ? <CheckCircle2 color="#10B981" size={24} /> : <Circle color="#666" size={24} />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', margin: 0, fontWeight: '700', color: isBoarded ? '#10B981' : 'var(--text-primary)' }}>
                        {isBoarded ? `On board · ${homeBusLabel}` : 'Have you boarded the bus?'}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: '500' }}>
                        {isBoarded ? `Active reservation` : 'boarding status'}
                      </p>
                    </div>
                  </div>
                  {isBoarded ? (
                    <button
                      onClick={async (e) => { e.stopPropagation(); await cancelReservation(); setIsBoarded(false); setHomeBus(null); setHomeBusLabel(null); setHomePlace(null); }}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.2)', 
                        borderRadius: '10px', 
                        padding: '8px 14px', 
                        color: '#EF4444', 
                        fontSize: '13px', 
                        fontWeight: '700' 
                      }}
                    >
                      Leave
                    </button>
                  ) : (
                    <motion.div 
                      animate={{ rotate: showBusPicker ? 180 : 0 }}
                      style={{ color: '#555' }}
                    >
                      <ChevronDown size={22} />
                    </motion.div>
                  )}
                </div>

                {/* Inline bus picker — only when not boarded */}
                {!isBoarded && showBusPicker && (
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {buses.filter(b => b.active).length === 0 && (
                      <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>No active buses right now</p>
                    )}
                    {buses.filter(b => b.active).map(bus => (
                      <button
                        key={bus.id}
                        onClick={async () => {
                          await createReservation(bus.id, 'boarded');
                          setHomeBus(bus.id);
                          setHomeBusLabel(bus.label);
                          setIsBoarded(true);
                          setShowBusPicker(false);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '16px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '16px',
                          color: '#fff',
                          width: '100%',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Bus size={18} color="var(--primary-accent)" />
                          <span style={{ fontWeight: '700', fontSize: '15px' }}>{bus.label}</span>
                        </div>
                        <span style={{
                          fontSize: '13px', fontWeight: '800',
                          color: bus.seatsAvailable === 0 ? '#EF4444' : bus.seatsAvailable <= 5 ? '#F59E0B' : '#10B981',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {bus.seatsAvailable}/{bus.totalSeats || 25}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

            </div>
          </div>
        )}

        {activeTab === 'line' && (
          <div style={{ paddingBottom: '100px' }}>
            <LineView />
          </div>
        )}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </motion.div>
  );
}

