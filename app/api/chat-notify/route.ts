import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
    });
  } catch (error: any) {
    console.error('Firebase Admin init error:', error.stack);
  }
}

export async function POST(req: Request) {
  try {
    const { text, senderId } = await req.json();

    if (!text || !senderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch all FCM tokens from Firebase RTDB
    const db = admin.database();
    const snapshot = await db.ref('push_subscriptions').once('value');
    const subscriptions = snapshot.val();

    if (!subscriptions) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // 2. Filter out the sender's token
    const tokens: string[] = [];
    Object.entries(subscriptions).forEach(([uid, token]) => {
      if (uid !== senderId && typeof token === 'string') {
        tokens.push(token);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No other users to notify' });
    }

    // 3. Send Multicast Message via FCM (Data payload for custom handling)
    const message = {
      data: {
        title: 'Transport Chat',
        body: text,
        url: '/#chat'
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Cleanup expired/invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          // In a real app, delete these from the database
        }
      });
      console.log('List of failed tokens:', failedTokens);
    }

    return NextResponse.json({ success: true, successCount: response.successCount });
  } catch (err: any) {
    console.error('FCM Push notification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
