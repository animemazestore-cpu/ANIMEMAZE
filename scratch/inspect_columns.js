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

async function inspectColumns() {
  const tables = ['coupons', 'orders', 'payment_proof', 'replacement_requests', 'site_announcements'];
  for (const table of tables) {
    console.log(`\n--- Inspecting table '${table}' ---`);
    // We can run a select to get one row, or inspect keys of an empty selection using postgrest schema or just inserting/trying select
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Error reading '${table}':`, error.message);
    } else {
      console.log(`Columns available in '${table}':`, data.length > 0 ? Object.keys(data[0]) : 'Empty table, trying RPC or select with specific guess');
    }
  }
}

inspectColumns();
