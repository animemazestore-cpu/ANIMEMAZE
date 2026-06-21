-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  image_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  featured boolean not null default false,
  main_image_url text not null,
  additional_images jsonb default '[]'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'PENDING_VERIFICATION' check (status in ('PENDING_VERIFICATION', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  payment_status text not null default 'PENDING_VERIFICATION' check (payment_status in ('PENDING_VERIFICATION', 'PAID', 'REJECTED')),
  shipping_address jsonb not null, -- Contains: full_name, phone, email, address, city, state, pincode
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. OrderItems Table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null check (price >= 0)
);

-- 7. PaymentProofs Table
create table if not exists public.payment_proofs (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade unique not null,
  screenshot_url text not null,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Wishlist Table
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- 9. Reviews Table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_name text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text not null,
  review_images jsonb default '[]'::jsonb not null, -- Array of image URLs
  verified_purchase boolean not null default false,
  status text not null default 'APPROVED' check (status in ('APPROVED', 'PENDING', 'REJECTED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. ReviewLikes Table
create table if not exists public.review_likes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique (review_id, user_id)
);

-- 11. ProductQuestions Table
create table if not exists public.product_questions (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete set null,
  question text not null,
  answer text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. NewsletterSubscribers Table
create table if not exists public.newsletter_subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 13. ContactMessages Table
create table if not exists public.contact_messages (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.wishlist enable row level security;
alter table public.reviews enable row level security;
alter table public.review_likes enable row level security;
alter table public.product_questions enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;

-- Setup RLS Policies

-- Profiles Policies
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow users to update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow admins full access to profiles" on public.profiles for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Categories Policies
create policy "Allow public read categories" on public.categories for select using (true);
create policy "Allow admins full access to categories" on public.categories for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Products Policies
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow admins full access to products" on public.products for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Orders Policies
create policy "Allow users to read own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Allow users to create orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Allow admins full access to orders" on public.orders for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Order Items Policies
create policy "Allow users to read own order items" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Allow users to insert own order items" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_items.order_id and user_id = auth.uid())
);
create policy "Allow admins full access to order items" on public.order_items for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Payment Proofs Policies
create policy "Allow users to read own payment proof" on public.payment_proofs for select using (
  exists (select 1 from public.orders where id = payment_proofs.order_id and user_id = auth.uid())
);
create policy "Allow users to insert own payment proof" on public.payment_proofs for insert with check (
  exists (select 1 from public.orders where id = payment_proofs.order_id and user_id = auth.uid())
);
create policy "Allow admins full access to payment proofs" on public.payment_proofs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Wishlist Policies
create policy "Allow users to read own wishlist" on public.wishlist for select using (auth.uid() = user_id);
create policy "Allow users to insert own wishlist" on public.wishlist for insert with check (auth.uid() = user_id);
create policy "Allow users to delete own wishlist" on public.wishlist for delete using (auth.uid() = user_id);

-- Reviews Policies
create policy "Allow public read reviews" on public.reviews for select using (status = 'APPROVED' or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Allow logged in users to insert review" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Allow users to update own reviews" on public.reviews for update using (auth.uid() = user_id);
create policy "Allow admins full access to reviews" on public.reviews for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Review Likes Policies
create policy "Allow public read review likes" on public.review_likes for select using (true);
create policy "Allow logged in users to toggle like" on public.review_likes for all using (auth.uid() = user_id);

-- Product Questions Policies
create policy "Allow public read product questions" on public.product_questions for select using (true);
create policy "Allow logged in users to ask questions" on public.product_questions for insert with check (auth.uid() = user_id);
create policy "Allow admins to answer questions" on public.product_questions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow admins full access to questions" on public.product_questions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Newsletter Subscribers Policies
create policy "Allow public to subscribe to newsletter" on public.newsletter_subscribers for insert with check (true);
create policy "Allow admins full access to subscribers" on public.newsletter_subscribers for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Contact Messages Policies
create policy "Allow public to send contact messages" on public.contact_messages for insert with check (true);
create policy "Allow admins to view contact messages" on public.contact_messages for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Setup Auth User Sync Trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'user';
begin
  -- Set first user or specific emails as admin for testing convenience
  if new.email = 'admin@animemaze.com' or new.email like 'admin@%' or not exists (select 1 from public.profiles) then
    default_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    default_role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Decrement product stock RPC function
create or replace function public.decrement_product_stock(prod_id uuid, qty integer)
returns void as $$
begin
  update public.products
  set stock = stock - qty
  where id = prod_id;
end;
$$ language plpgsql security definer;

-- 14. Replacement Requests Table
create table if not exists public.replacement_requests (
  id text primary key,
  order_id text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reason text not null,
  description text not null,
  photo_url text,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'PROCESSING', 'RESOLVED', 'REJECTED')),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on replacement_requests
alter table public.replacement_requests enable row level security;

-- Setup RLS Policies for replacement_requests
create policy "Allow users to read own replacement requests" on public.replacement_requests for select using (auth.uid() = user_id);
create policy "Allow users to insert own replacement requests" on public.replacement_requests for insert with check (auth.uid() = user_id);
create policy "Allow admins full access to replacement requests" on public.replacement_requests for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

