import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ccxoolbddwtnrlwbcjhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeG9vbGJkZHd0bnJsd2Jjamh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjY2MjEsImV4cCI6MjA5NzUwMjYyMX0.FzacZqCAwW2n89HydVJ3M2NJ8Qk7iTdvOaGHkTBinBU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching orders:', error);
  } else {
    console.log('Latest Orders:');
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
