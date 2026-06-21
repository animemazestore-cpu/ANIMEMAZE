import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
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

async function inspect() {
  console.log('Testing connection to:', supabaseUrl);
  
  const tables = [
    'profiles',
    'categories',
    'products',
    'orders',
    'order_items',
    'payment_proof',
    'payment_proofs',
    'wishlist_items',
    'reviews',
    'product_questions',
    'newsletter_subscribers',
    'replacement_requests',
    'coupons',
    'site_announcements',
    'site_settings',
    'review_likes'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${table}' failed:`, error.message);
      } else {
        console.log(`✅ Table '${table}' exists and is accessible. Data sample:`, data);
      }
    } catch (e) {
      console.log(`❌ Table '${table}' threw error:`, e.message);
    }
  }
}

inspect();
