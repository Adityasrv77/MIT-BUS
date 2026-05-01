import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zbqtolxqweorexowsnrk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpicXRvbHhxd2VvcmV4b3dzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODI3NjAsImV4cCI6MjA5Mjk1ODc2MH0.9xXs2ZrRPj9Imc8LQKPiBcJiMW1SixNVnsDVj1hc_40'
);

async function run() {
  const { data, error } = await supabase
    .from('Geolocation')
    .delete()
    .neq('id', 'this-is-a-dummy-id-to-delete-all'); // A trick to delete all rows

  if (error) {
    console.error('Error deleting data:', error);
  } else {
    console.log('Successfully deleted data:', data);
  }
}

run();
