import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types matching DB schema
export type BusRecord = {
  id: string;
  label: string;
  total_seats: number;
  is_active: boolean;
};

export type RouteStop = {
  id: string;
  bus_id: string;
  stop_order: number;
  stop_name: string;
  stop_time: string;
  stop_type: 'start' | 'stop' | 'end';
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  bus_id: string | null;
  is_active: boolean;
};

export type AdminPassword = {
  id: string;
  role: string;
  password: string;
  description: string;
};

export type Reservation = {
  id: string;
  bus_id: string;
  stop_name: string;
  session_id: string;
  reserved_at: string;
  status: 'active' | 'cancelled';
};
