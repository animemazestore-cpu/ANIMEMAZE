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
