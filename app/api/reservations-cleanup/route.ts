import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import admin from 'firebase-admin';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize Firebase Admin (for tracking last cleanup)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  });
}

export async function GET() {
  try {
    const istNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hour = istNow.getHours();
    const minute = istNow.getMinutes();
    const today = istNow.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeInMinutes = hour * 60 + minute;

    const db = admin.database();
    const statusRef = db.ref('cleanup_status/reservations');
    const statusSnap = await statusRef.once('value');
    const status = statusSnap.val() || {};

    let shouldClean = false;
    let type = '';

    // 1. Morning Cleanup: 10:30 AM (630 mins) to 11:30 AM
    if (timeInMinutes >= 630 && timeInMinutes < 690) {
      if (status.last_morning !== today) {
        shouldClean = true;
        type = 'morning';
      }
    } 
    // 2. Night Cleanup: 10:00 PM (1320 mins) to 11:00 PM
    else if (timeInMinutes >= 1320 && timeInMinutes < 1380) {
      if (status.last_night !== today) {
        shouldClean = true;
        type = 'night';
      }
    }

    if (shouldClean) {
      console.log(`Running ${type} reservations cleanup...`);
      
      // Update all active reservations to 'cancelled' (or you can use .delete())
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('status', 'active');

      if (error) throw error;

      // Update the last cleanup tracker in Firebase
      await statusRef.update({
        [type === 'morning' ? 'last_morning' : 'last_night']: today
      });

      return NextResponse.json({ success: true, message: `${type} cleanup completed.` });
    }

    return NextResponse.json({ success: true, message: 'No cleanup scheduled for this time.' });
  } catch (err: any) {
    console.error('Reservations cleanup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
