-- ============================================================
-- Add Estimated Delivery Date Column to Orders Table
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Add estimated_delivery_date column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- Update existing orders to have estimated delivery dates (5-6 days from creation)
-- This ensures backward compatibility with existing orders
UPDATE public.orders 
SET estimated_delivery_date = created_at + INTERVAL '5 days' + (RANDOM() * INTERVAL '1 day')
WHERE estimated_delivery_date IS NULL;

-- ============================================================
-- DONE! The estimated_delivery_date column has been added
-- ============================================================
