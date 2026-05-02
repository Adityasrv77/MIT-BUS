import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure Web Push with our VAPID keys
webpush.setVAPIDDetails(
  'mailto:support@mit-bus.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { text, senderId } = await req.json();

    if (!text || !senderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Fetch all push subscriptions from Firebase RTDB via HTTP REST
    const fbUrl = `${process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL}/push_subscriptions.json`;
    const fbRes = await fetch(fbUrl);
    
    if (!fbRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subscriptions: Record<string, any> = await fbRes.json();
    if (!subscriptions) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // 2. Filter out the sender and send notifications
    const sendPromises = Object.entries(subscriptions).map(async ([uid, sub]) => {
      // Don't notify the person who sent the message
      if (uid === senderId) return;

      try {
        await webpush.sendNotification(
          sub,
          JSON.stringify({
            title: 'Transport Chat',
            body: text,
            url: '/#chat'
          })
        );
      } catch (err: any) {
        // If subscription is gone/expired, log it (or delete it from db in a real app)
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`Subscription ${uid} is expired.`);
        } else {
          console.error(`Error sending to ${uid}:`, err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Chat push notification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
