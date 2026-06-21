import type { Product, Category } from '../types/database';

const PRODUCTS_KEY = 'animemaze_local_products';
const CATEGORIES_KEY = 'animemaze_local_categories';

export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Action Figures', image_url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=400', created_at: '' },
  { id: '2', name: 'Apparel', image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400', created_at: '' },
  { id: '3', name: 'Katanas', image_url: 'https://images.unsplash.com/photo-1594901840134-21fbe66d764e?auto=format&fit=crop&q=80&w=400', created_at: '' },
  { id: '4', name: 'Keychains', image_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=400', created_at: '' },
  { id: '5', name: 'Posters & Decor', image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=400', created_at: '' },
  { id: '6', name: 'Accessories', image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400', created_at: '' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'f1',
    name: 'Gohan Beast Limited Edition Figure',
    slug: 'gohan-beast-figure',
    description: 'Highly detailed PVC action figure of Gohan Beast from Dragon Ball Super. Features beautiful energy aura detailing, matte finish, and a sturdy dynamic base. Height: 24cm.',
    price: 3499,
    stock: 12,
    featured: true,
    category_id: '1',
    main_image_url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&q=80&w=600',
    additional_images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600'
    ],
    created_at: '2026-06-20T00:00:00Z'
  },
  {
    id: 'k1',
    name: 'Zoro Blunt Display Katana (Shusui)',
    slug: 'zoro-shusui-katana',
    description: 'Blunt stainless steel cosplay katana replica. 104cm. For decorative display only. Includes premium wooden scabbard with hand-carved details and a black display stand.',
    price: 4999,
    stock: 5,
    featured: true,
    category_id: '3',
    main_image_url: 'https://images.unsplash.com/photo-1594901840134-21fbe66d764e?auto=format&fit=crop&q=80&w=600',
    additional_images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'
    ],
    created_at: '2026-06-19T00:00:00Z'
  },
  {
    id: 'h1',
    name: 'Akatsuki Cloud Embroidered Hoodie',
    slug: 'akatsuki-cloud-hoodie',
    description: 'Premium heavyweight cotton hoodie with embroidered Akatsuki red cloud. Unisex fit, fleece lined interior, heavy ribbed cuffs.',
    price: 1899,
    stock: 25,
    featured: true,
    category_id: '2',
    main_image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600',
    additional_images: [],
    created_at: '2026-06-18T00:00:00Z'
  },
  {
    id: 'w1',
    name: 'Demon Slayer Cosplay Wristwatch',
    slug: 'demon-slayer-watch',
    description: 'Water-resistant quartz watch inspired by Tanjiro\'s checkerboard haori pattern. Has a premium leather strap, metallic black case, and Japanese movement.',
    price: 1299,
    stock: 18,
    featured: true,
    category_id: '6',
    main_image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    additional_images: [],
    created_at: '2026-06-17T00:00:00Z'
  },
  {
    id: 'k2',
    name: 'Luffy Gear 5 Anime Keychain',
    slug: 'luffy-gear-5-keychain',
    description: 'Soft rubber keychain featuring Monkey D. Luffy in his Gear 5 form.',
    price: 299,
    stock: 100,
    featured: false,
    category_id: '4',
    main_image_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&q=80&w=600',
    additional_images: [],
    created_at: '2026-06-16T00:00:00Z'
  },
  {
    id: 'p1',
    name: 'Neon Genesis Evangelion Retro Poster',
    slug: 'evangelion-poster',
    description: 'Vintage high-definition aesthetic poster printed on premium matte cardstock.',
    price: 599,
    stock: 50,
    featured: false,
    category_id: '5',
    main_image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
    additional_images: [],
    created_at: '2026-06-15T00:00:00Z'
  }
];

// Fix any stored product whose slug looks like a URL or has invalid chars
export const sanitizeSlug = (slug: string, name: string): string => {
  const isCorrupted =
    !slug ||
    slug.includes('://') ||
    slug.includes('.com') ||
    slug.includes('.jpg') ||
    slug.includes('.png') ||
    slug.includes('?') ||
    slug.includes(' ') ||
    slug.length > 80;
  if (isCorrupted) {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
  return slug;
};

export const getLocalProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    const stored: Product[] = data ? JSON.parse(data) : [];

    // Sanitize slugs of stored products (fix any URL-slugs from earlier bug)
    const sanitizedStored = stored.map(sp => ({
      ...sp,
      slug: sanitizeSlug(sp.slug, sp.name)
    }));

    // Always ensure mock products exist as a baseline — merge stored on top
    const merged = [...MOCK_PRODUCTS];
    for (const sp of sanitizedStored) {
      if (!merged.some(mp => mp.id === sp.id)) {
        merged.push(sp);
      } else {
        // stored version overrides mock (in case admin edited a mock product)
        const idx = merged.findIndex(mp => mp.id === sp.id);
        merged[idx] = sp;
      }
    }

    // Save sanitized+merged back so future reads have correct slugs
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Error parsing local products:', e);
    return MOCK_PRODUCTS;
  }
};

export const saveLocalProduct = (product: Product): void => {
  try {
    const products = getLocalProducts();
    const sanitizedProduct = {
      ...product,
      slug: sanitizeSlug(product.slug, product.name)
    };
    const index = products.findIndex(p => p.id === product.id);
    if (index > -1) {
      products[index] = sanitizedProduct;
    } else {
      products.push(sanitizedProduct);
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving local product:', e);
  }
};

export const deleteLocalProduct = (id: string): void => {
  try {
    const products = getLocalProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting local product:', e);
  }
};

export const getLocalCategories = (): Category[] => {
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(MOCK_CATEGORIES));
      return MOCK_CATEGORIES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error parsing local categories:', e);
    return [];
  }
};

export const saveLocalCategory = (category: Category): void => {
  try {
    const categories = getLocalCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index > -1) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error('Error saving local category:', e);
  }
};

export const deleteLocalCategory = (id: string): void => {
  try {
    const categories = getLocalCategories();
    const filtered = categories.filter(c => c.id !== id);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error deleting local category:', e);
  }
};
