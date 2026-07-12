-- ============================================================
-- AnimeMaze - Fix orders table for FamPay automated flow
-- Run this in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Drop the old CHECK constraints that reject PENDING_PAYMENT / FAILED
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check,
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- 2. Add updated CHECK constraints that include the FamPay statuses
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING_PAYMENT','PENDING_VERIFICATION','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED')),
  ADD CONSTRAINT orders_payment_status_check
    CHECK (payment_status IN ('PENDING_PAYMENT','PENDING_VERIFICATION','PAID','FAILED','REJECTED'));

-- 3. Add estimated_delivery_date column if it doesn't exist
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- 4. Add RLS UPDATE policy so users can update the payment_status of their OWN orders
--    (required for FamPay auto-verify to write PAID status back)
DROP POLICY IF EXISTS "Users can update own order payment status" ON public.orders;
CREATE POLICY "Users can update own order payment status"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Verify policies are correct
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'orders';
