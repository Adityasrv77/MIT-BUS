'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Save, X, ChevronLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SaveLocationPage() {
  const router = useRouter();
  const [placeName, setPlaceName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = () => {
    setGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGettingLocation(false);
      },
      (err) => {
        setError('Please allow location access to save this spot.');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!placeName.trim() || !coords) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from('Geolocation')
        .insert([
          {
            'Location name': placeName.trim(),
            latitude: coords.lat,
            longitude: coords.lng,
          },
        ]);

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-dark)', 
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'inherit'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(10,10,10,0.5)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={() => router.back()}
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '8px', 
            borderRadius: '12px', 
            color: '#fff' 
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Save your location</h1>
      </div>

      <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(246,148,35,0.1) 0%, rgba(246,148,35,0.02) 100%)',
            border: '1px solid rgba(246,148,35,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '20px', 
            backgroundColor: 'rgba(246,148,35,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-accent)'
          }}>
            {gettingLocation ? <Loader2 size={32} className="animate-spin" /> : <MapPin size={32} />}
          </div>
          
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px' }}>
              {gettingLocation ? 'Fetching GPS...' : coords ? 'Location Locked' : 'Waiting for GPS'}
            </h3>
            {coords && (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
            {error && (
              <p style={{ fontSize: '13px', color: '#EF4444', margin: '8px 0 0', fontWeight: '600' }}>
                {error}
              </p>
            )}
          </div>

          {!coords && !gettingLocation && (
            <button 
              onClick={getLocation}
              style={{
                background: 'var(--primary-accent)',
                color: '#000',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                fontSize: '13px',
                fontWeight: '800'
              }}
            >
              Retry GPS
            </button>
          )}
        </motion.div>

        {/* Input Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Place Name
          </label>
          <input
            type="text"
            placeholder="e.g. Police Point, Laitumkhrah"
            value={placeName}
            onChange={(e) => setPlaceName(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 24px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: '20px' }}>
          <button
            onClick={handleSave}
            disabled={!placeName.trim() || !coords || loading}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '20px',
              backgroundColor: (!placeName.trim() || !coords || loading) ? 'rgba(255,255,255,0.05)' : 'var(--primary-accent)',
              color: (!placeName.trim() || !coords || loading) ? '#666' : '#000',
              border: 'none',
              fontSize: '16px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: (!placeName.trim() || !coords || loading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {loading ? 'Saving...' : 'Save Location'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                backgroundColor: 'var(--card-bg)',
                padding: '40px 30px',
                borderRadius: '32px',
                textAlign: 'center',
                border: '1px solid var(--primary-accent)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <CheckCircle2 size={64} color="var(--primary-accent)" style={{ marginBottom: '20px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 10px' }}>Saved!</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Location added to Geolocation table.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
