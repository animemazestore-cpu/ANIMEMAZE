import { sanitizeSlug } from './persistence';
import type { Category, Product } from '../types/database';

export const CATEGORY_FIELDS = 'id, name, image_url, size_enabled, created_at';

export const PRODUCT_LIST_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, created_at';

export const PRODUCT_DETAIL_FIELDS =
  'id, name, slug, description, category_id, price, stock, featured, main_image_url, additional_images, created_at';

export const PRODUCT_RELATED_FIELDS =
  'id, name, slug, price, stock, featured, main_image_url, created_at';

export const PRODUCT_LIST_SELECT = `
  ${PRODUCT_LIST_FIELDS},
  category:categories (${CATEGORY_FIELDS})
`;

export const PRODUCT_DETAIL_SELECT = `
  ${PRODUCT_DETAIL_FIELDS},
  category:categories (${CATEGORY_FIELDS})
`;

export function parseProduct(raw: Record<string, unknown>): Product {
  const category = raw.category as Category | undefined;
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: sanitizeSlug(raw.slug as string, raw.name as string),
    description: (raw.description as string | null) ?? null,
    category_id: (raw.category_id as string | null) ?? null,
    price: Number(raw.price),
    stock: Number(raw.stock),
    featured: Boolean(raw.featured),
    main_image_url: raw.main_image_url as string,
    additional_images: Array.isArray(raw.additional_images)
      ? (raw.additional_images as string[])
      : [],
    created_at: raw.created_at as string,
    ...(category ? { category } : {}),
  };
}

export function parseProducts(rows: Record<string, unknown>[] | null): Product[] {
  return rows ? rows.map(parseProduct) : [];
}

export function findProductBySlug(products: Product[], slug: string): Product | undefined {
  return products.find(
    (p) => p.slug === slug || sanitizeSlug(p.slug, p.name) === slug
  );
}
