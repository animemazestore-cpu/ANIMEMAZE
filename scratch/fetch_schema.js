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

async function fetchSchema() {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Accept': 'application/openapi+json'
    }
  });
  const data = await res.json();
  console.log('Definitions keys:', Object.keys(data.definitions || {}));
  
  const tables = ['coupons', 'replacement_requests', 'payment_proof', 'site_announcements'];
  for (const table of tables) {
    const definition = data.definitions?.[table];
    if (definition) {
      console.log(`\nSchema for '${table}':`);
      console.log(Object.keys(definition.properties));
    } else {
      console.log(`\nTable '${table}' not found in definitions`);
    }
  }
}

fetchSchema();
