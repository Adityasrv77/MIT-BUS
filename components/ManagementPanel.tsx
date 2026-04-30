'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, BusRecord, RouteStop, Driver, AdminPassword } from '../lib/supabase';
import { Bus, Map, Users, Lock, Plus, Trash2, Edit3, Save, X, ChevronLeft } from 'lucide-react';

type ManagementTab = 'buses' | 'routes' | 'drivers' | 'passwords';

type ManagementPanelProps = {
  onBack: () => void;
};

// ─── Reusable styles ───────────────────────────────────────
const card = {
  backgroundColor: 'var(--card-bg)',
  border: '1px solid #2a2a2a',
  borderRadius: '14px',
  padding: '16px 18px',
  marginBottom: '10px',
};

const input = {
  backgroundColor: '#111',
  border: '1px solid #333',
  borderRadius: '10px',
  padding: '10px 14px',
  color: '#fff',
  fontSize: '14px',
  width: '100%',
  outline: 'none',
};

const btn = (accent = false) => ({
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: accent ? 'var(--primary-accent)' : '#1e1e1e',
  color: accent ? '#000' : '#aaa',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

// ─── Password Gate ──────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const checkPin = async (val: string) => {
    if (val.length !== 4) return;
    const { data } = await supabase
      .from('admin_passwords')
      .select('password')
      .eq('role', 'management')
      .single();
    if (data?.password === val) {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setPin(''); setError(false); }, 600);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length <= 4) {
      setPin(val);
      checkPin(val);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px' }}>
      <Lock size={36} color="var(--primary-accent)" style={{ marginBottom: '20px' }} />
      <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Management Access</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>Enter your management PIN</p>

      {/* Dots */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: '18px', height: '18px', borderRadius: '50%',
            backgroundColor: pin.length > i ? (error ? '#FF3B30' : 'var(--primary-accent)') : 'transparent',
            border: `2px solid ${error ? '#FF3B30' : 'var(--primary-accent)'}`,
            transition: 'background 0.15s'
          }} />
        ))}
      </div>

      {error && <p style={{ color: '#FF3B30', fontSize: '13px', marginBottom: '10px' }}>Wrong PIN</p>}

      <input
        type="number"
        value={pin}
        onChange={handleInput}
        style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        autoFocus
      />
    </div>
  );
}

// ─── Buses Tab ─────────────────────────────────────────────
function BusesTab() {
  const [buses, setBuses] = useState<BusRecord[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editSeats, setEditSeats] = useState('');

  const load = async () => {
    const { data } = await supabase.from('buses').select('*').order('id');
    setBuses(data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    await supabase.from('buses').update({ label: editLabel, total_seats: parseInt(editSeats) }).eq('id', id);
    setEditing(null);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('buses').update({ is_active: !current }).eq('id', id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Manage Buses</h3>
        <button 
          onClick={async () => {
            if(confirm('Clear all current reservations?')) {
              await supabase.from('reservations').update({ status: 'cancelled' }).eq('status', 'active');
              alert('All seats reset to 0');
              load();
            }
          }}
          style={{ ...btn(), color: '#FF3B30', backgroundColor: 'rgba(255,59,48,0.1)' }}
        >
          <Trash2 size={14} /> Reset All Seats
        </button>
      </div>
      {buses.map(bus => (
        <div key={bus.id} style={card}>
          {editing === bus.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input style={input} value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="Bus label" />
              <input style={input} type="number" value={editSeats} onChange={e => setEditSeats(e.target.value)} placeholder="Total seats" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btn(true)} onClick={() => save(bus.id)}><Save size={14} /> Save</button>
                <button style={btn()} onClick={() => setEditing(null)}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '700', margin: 0 }}>{bus.label}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0' }}>
                  {bus.total_seats} seats · {bus.is_active ? '🟢 Active' : '⚫ Inactive'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btn()} onClick={() => { setEditing(bus.id); setEditLabel(bus.label); setEditSeats(String(bus.total_seats)); }}>
                  <Edit3 size={14} />
                </button>
                <button style={btn(bus.is_active)} onClick={() => toggleActive(bus.id, bus.is_active)}>
                  {bus.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Routes Tab ───────────────────────────────────────────
function RoutesTab() {
  const [selectedBus, setSelectedBus] = useState('bus1');
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ stop_name: '', stop_time: '', stop_type: 'stop' });
  const busIds = ['bus1', 'bus2', 'bus3', 'bus4', 'bus5'];

  const load = async () => {
    const { data } = await supabase.from('routes').select('*').eq('bus_id', selectedBus).order('stop_order');
    setStops(data || []);
  };

  useEffect(() => { load(); }, [selectedBus]);

  const addStop = async () => {
    const maxOrder = stops.length ? Math.max(...stops.map(s => s.stop_order)) + 1 : 1;
    await supabase.from('routes').insert({ bus_id: selectedBus, stop_order: maxOrder, ...form });
    setAdding(false);
    setForm({ stop_name: '', stop_time: '', stop_type: 'stop' });
    load();
  };

  const deleteStop = async (id: string) => {
    await supabase.from('routes').delete().eq('id', id);
    load();
  };

  return (
    <div>
      <h3 style={{ marginBottom: '14px', fontSize: '18px', fontWeight: '700' }}>Manage Routes</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }} className="hide-scrollbar">
        {busIds.map((id, i) => (
          <button key={id} onClick={() => setSelectedBus(id)} style={btn(selectedBus === id)}>
            Bus {i + 1}
          </button>
        ))}
      </div>

      {stops.map(stop => (
        <div key={stop.id} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: '700', margin: 0 }}>{stop.stop_name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: '3px 0 0' }}>
              {stop.stop_time} · <span style={{ textTransform: 'capitalize' }}>{stop.stop_type}</span>
            </p>
          </div>
          <button style={btn()} onClick={() => deleteStop(stop.id)}><Trash2 size={14} color="#FF3B30" /></button>
        </div>
      ))}

      {adding ? (
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input style={input} placeholder="Stop name" value={form.stop_name} onChange={e => setForm({ ...form, stop_name: e.target.value })} />
          <input style={input} placeholder="Time (e.g. 08:30 AM)" value={form.stop_time} onChange={e => setForm({ ...form, stop_time: e.target.value })} />
          <select style={{ ...input }} value={form.stop_type} onChange={e => setForm({ ...form, stop_type: e.target.value })}>
            <option value="start">Start</option>
            <option value="stop">Stop</option>
            <option value="end">End</option>
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={btn(true)} onClick={addStop}><Save size={14} /> Add</button>
            <button style={btn()} onClick={() => setAdding(false)}><X size={14} /> Cancel</button>
          </div>
        </div>
      ) : (
        <button style={{ ...btn(true), marginTop: '8px', width: '100%', justifyContent: 'center' }} onClick={() => setAdding(true)}>
          <Plus size={16} /> Add Stop
        </button>
      )}
    </div>
  );
}

// ─── Drivers Tab ──────────────────────────────────────────
function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', bus_id: '' });

  const load = async () => {
    const { data } = await supabase.from('drivers').select('*').order('name');
    setDrivers(data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    await supabase.from('drivers').update(form).eq('id', id);
    setEditing(null);
    load();
  };

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Manage Drivers</h3>
      {drivers.map(driver => (
        <div key={driver.id} style={card}>
          {editing === driver.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" />
              <input style={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
              <select style={{ ...input }} value={form.bus_id} onChange={e => setForm({ ...form, bus_id: e.target.value })}>
                <option value="">Unassigned</option>
                {['bus1','bus2','bus3','bus4','bus5'].map((b, i) => (
                  <option key={b} value={b}>Bus {i+1}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btn(true)} onClick={() => save(driver.id)}><Save size={14} /> Save</button>
                <button style={btn()} onClick={() => setEditing(null)}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '700', margin: 0 }}>{driver.name}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0' }}>
                  {driver.phone} · {driver.bus_id ? `Bus ${driver.bus_id.replace('bus','')}` : 'Unassigned'}
                </p>
              </div>
              <button style={btn()} onClick={() => { setEditing(driver.id); setForm({ name: driver.name, phone: driver.phone || '', bus_id: driver.bus_id || '' }); }}>
                <Edit3 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Passwords Tab ────────────────────────────────────────
function PasswordsTab() {
  const [passwords, setPasswords] = useState<AdminPassword[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [newPass, setNewPass] = useState('');

  const load = async () => {
    const { data } = await supabase.from('admin_passwords').select('*').order('role');
    setPasswords(data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async (id: string) => {
    await supabase.from('admin_passwords').update({ password: newPass, updated_at: new Date().toISOString() }).eq('id', id);
    setEditing(null);
    load();
  };

  return (
    <div>
      <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>Access Passwords</h3>
      {passwords.map(p => (
        <div key={p.id} style={card}>
          {editing === p.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>{p.role}</p>
              <input style={input} type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btn(true)} onClick={() => save(p.id)}><Save size={14} /> Save</button>
                <button style={btn()} onClick={() => setEditing(null)}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '700', margin: 0, textTransform: 'capitalize' }}>{p.role}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '3px 0 0' }}>{p.description}</p>
              </div>
              <button style={btn()} onClick={() => { setEditing(p.id); setNewPass(''); }}>
                <Edit3 size={14} /> Change
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Management Panel ────────────────────────────────
export default function ManagementPanel({ onBack }: ManagementPanelProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<ManagementTab>('buses');

  const tabs: { id: ManagementTab; label: string; icon: React.ReactNode }[] = [
    { id: 'buses',     label: 'Buses',     icon: <Bus size={16} /> },
    { id: 'routes',    label: 'Routes',    icon: <Map size={16} /> },
    { id: 'drivers',   label: 'Drivers',   icon: <Users size={16} /> },
    { id: 'passwords', label: 'Passwords', icon: <Lock size={16} /> },
  ];

  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)', zIndex: 2000 }}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.35 }}
    >
      {/* Header */}
      <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid #1c1c1c' }}>
        <button onClick={onBack} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
          <ChevronLeft size={18} /> Back
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-accent)', margin: 0 }}>Management</h1>
      </div>

      {!unlocked ? (
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      ) : (
        <>
          {/* Tab Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #1c1c1c', padding: '0 10px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  color: activeTab === tab.id ? 'var(--primary-accent)' : '#555',
                  fontSize: '11px',
                  fontWeight: '700',
                  borderBottom: activeTab === tab.id ? '2px solid var(--primary-accent)' : '2px solid transparent',
                  transition: 'color 0.2s',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="hide-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'buses'     && <BusesTab />}
                {activeTab === 'routes'    && <RoutesTab />}
                {activeTab === 'drivers'   && <DriversTab />}
                {activeTab === 'passwords' && <PasswordsTab />}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}
