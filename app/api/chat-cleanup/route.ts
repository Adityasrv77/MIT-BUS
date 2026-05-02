import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    });
  } catch (error: any) {
    console.error('Firebase Admin init error:', error.stack);
  }
}

export async function GET() {
  try {
    const db = admin.database();
    const chatRef = db.ref('transport_chat/messages');
    
    // 4 hours in milliseconds
    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    const cutoff = Date.now() - FOUR_HOURS_MS;

    const snapshot = await chatRef.once('value');
    const messages = snapshot.val();

    if (!messages) {
      return NextResponse.json({ message: 'No messages to clean' });
    }

    let deletedCount = 0;
    const updates: any = {};

    Object.entries(messages).forEach(([id, msg]: [string, any]) => {
      // If message is older than cutoff, mark for deletion
      if (msg.timestamp < cutoff) {
        updates[id] = null;
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await chatRef.update(updates);
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} messages older than 4 hours.` 
    });
  } catch (err: any) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
