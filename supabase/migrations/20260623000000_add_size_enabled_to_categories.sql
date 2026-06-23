-- Add size_enabled field to categories table
-- This allows administrators to control whether size selection is required for products in a category

alter table public.categories 
add column if not exists size_enabled boolean not null default false;

-- Add comment for documentation
comment on column public.categories.size_enabled is 'When true, products in this category require size selection (S, M, L, XL)';
