import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  // Test site_announcements
  console.log('\n--- Testing site_announcements ---');
  try {
    const { data, error } = await supabase
      .from('site_announcements')
      .insert({ message: 'Test announcement text', active: true })
      .select();
    if (error) {
      console.log('❌ Insert failed:', error.message);
    } else {
      console.log('✅ Insert succeeded. Returned row:', data);
      // Clean up
      await supabase.from('site_announcements').delete().eq('id', data[0].id);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  // Test coupons
  console.log('\n--- Testing coupons ---');
  try {
    const { data, error } = await supabase
      .from('coupons')
      .insert({ code: 'TESTCOUPON1', discount_type: 'PERCENTAGE', discount_value: 10, min_order_amount: 100, active: true })
      .select();
    if (error) {
      console.log('❌ Insert failed:', error.message);
    } else {
      console.log('✅ Insert succeeded. Returned row:', data);
      // Clean up
      await supabase.from('coupons').delete().eq('id', data[0].id);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }

  // Test replacement_requests
  console.log('\n--- Testing replacement_requests ---');
  try {
    // We need an order_id first. Let's fetch one order from the database
    const { data: orders } = await supabase.from('orders').select('id').limit(1);
    if (!orders || orders.length === 0) {
      console.log('❌ Cannot test replacement requests: no orders in DB');
    } else {
      const orderId = orders[0].id;
      const { data, error } = await supabase
        .from('replacement_requests')
        .insert({
          order_id: orderId,
          reason: 'Damaged Product',
          description: 'A test replacement description',
          status: 'PENDING'
        })
        .select();
      if (error) {
        console.log('❌ Insert failed:', error.message);
      } else {
        console.log('✅ Insert succeeded. Returned row:', data);
        // Clean up
        await supabase.from('replacement_requests').delete().eq('id', data[0].id);
      }
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
}

testInsert();
