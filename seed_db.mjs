// Seed script - inserts categories and products into Supabase
const SUPABASE_URL = 'https://ccxoolbddwtnrlwbcjhw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjeG9vbGJkZHd0bnJsd2Jjamh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjY2MjEsImV4cCI6MjA5NzUwMjYyMX0.FzacZqCAwW2n89HydVJ3M2NJ8Qk7iTdvOaGHkTBinBU';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function seed() {
  console.log('Clearing existing products...');
  await fetch(`${SUPABASE_URL}/rest/v1/products?id=not.is.null`, { method: 'DELETE', headers });
  console.log('Clearing existing categories...');
  await fetch(`${SUPABASE_URL}/rest/v1/categories?id=not.is.null`, { method: 'DELETE', headers });

  const categories = [
    { name: 'Action Figures', image_url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=400' },
    { name: 'Apparel', image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400' },
    { name: 'Katanas', image_url: 'https://images.unsplash.com/photo-1594901840134-21fbe66d764e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Keychains', image_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=400' },
    { name: 'Posters & Decor', image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400' },
    { name: 'Accessories', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' },
  ];

  console.log('Inserting categories...');
  const catRes = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
    method: 'POST', headers, body: JSON.stringify(categories)
  });
  const insertedCats = await catRes.json();
  if (!Array.isArray(insertedCats)) {
    console.error('Failed to insert categories:', insertedCats);
    return;
  }
  console.log(`Inserted ${insertedCats.length} categories`);

  const catMap = {};
  insertedCats.forEach(c => { catMap[c.name] = c.id; });

  const products = [
    {
      name: 'Gohan Beast Limited Edition Figure', slug: 'gohan-beast-figure',
      description: 'Highly detailed PVC action figure of Gohan Beast from Dragon Ball Super.', price: 3499, stock: 12, featured: true,
      category_id: catMap['Action Figures'], main_image_url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=600',
      additional_images: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600']
    },
    {
      name: 'Zoro Blunt Display Katana (Shusui)', slug: 'zoro-shusui-katana',
      description: 'Blunt stainless steel cosplay katana replica. 104cm.', price: 4999, stock: 5, featured: true,
      category_id: catMap['Katanas'], main_image_url: 'https://images.unsplash.com/photo-1594901840134-21fbe66d764e?auto=format&fit=crop&q=80&w=600',
      additional_images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600']
    },
    {
      name: 'Akatsuki Cloud Embroidered Hoodie', slug: 'akatsuki-cloud-hoodie',
      description: 'Premium heavyweight cotton hoodie with embroidered Akatsuki red cloud.', price: 1899, stock: 25, featured: true,
      category_id: catMap['Apparel'], main_image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
      additional_images: []
    },
    {
      name: 'Demon Slayer Cosplay Wristwatch', slug: 'demon-slayer-watch',
      description: 'Water-resistant quartz watch inspired by Tanjiro.', price: 1299, stock: 18, featured: true,
      category_id: catMap['Accessories'], main_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
      additional_images: []
    },
    {
      name: 'Luffy Gear 5 Anime Keychain', slug: 'luffy-gear-5-keychain',
      description: 'Soft rubber keychain featuring Monkey D. Luffy in his Gear 5 form.', price: 299, stock: 100, featured: false,
      category_id: catMap['Keychains'], main_image_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600',
      additional_images: []
    },
    {
      name: 'Neon Genesis Evangelion Retro Poster', slug: 'evangelion-poster',
      description: 'Vintage HD aesthetic poster printed on premium matte cardstock.', price: 599, stock: 50, featured: false,
      category_id: catMap['Posters & Decor'], main_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
      additional_images: []
    }
  ];

  console.log('Inserting products...');
  const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST', headers, body: JSON.stringify(products)
  });
  const insertedProds = await prodRes.json();
  if (!Array.isArray(insertedProds)) {
    console.error('Failed to insert products:', insertedProds);
    return;
  }
  console.log(`Inserted ${insertedProds.length} products`);

  const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,slug&order=created_at`, { headers });
  const verified = await verifyRes.json();
  console.log('\nProducts in DB:');
  verified.forEach(p => console.log(`  - ${p.name} (${p.slug})`));

  const verifyCatRes = await fetch(`${SUPABASE_URL}/rest/v1/categories?select=id,name&order=created_at`, { headers });
  const verifiedCats = await verifyCatRes.json();
  console.log('\nCategories in DB:');
  verifiedCats.forEach(c => console.log(`  - ${c.name}`));

  console.log('\nDone!');
}

seed().catch(err => console.error('Seed failed:', err));
