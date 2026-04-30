const webpush = require('web-push');

// 1. Generate VAPID keys
// You only do this ONCE and store them safely
const vapidKeys = webpush.generateVAPIDKeys();

console.log('--- PUBLIC KEY ---');
console.log(vapidKeys.publicKey);
console.log('\n--- PRIVATE KEY ---');
console.log(vapidKeys.privateKey);

// 2. Setup the push configuration
webpush.setVAPIDDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 3. Example function to send a push
const sendPush = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push sent successfully');
  } catch (err) {
    console.error('Push failed:', err);
  }
};

/*
To use this:
1. Run 'npm install web-push'
2. Run this script once to get keys
3. Update lib/pwa.ts with the PUBLIC KEY
4. Use the PRIVATE KEY in your backend to send notifications
*/
