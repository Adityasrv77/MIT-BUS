import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbqtolxqweorexowsnrk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXRvbHhxd2VvcmV4b3dzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODI3NjAsImV4cCI6MjA5Mjk1ODc2MH0.9xXs2ZrRPj9Imc8LQKPiBcJiMW1SixNVnsDVj1hc_40'
);

async function run() {
  const { data, error } = await supabase
    .from('Geolocation')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
  } else {
    console.log('Columns:', Object.keys(data[0] || {}));
  }
}

run();
