/*
# Fix Orders RLS — Allow Guest Checkout

## Problem
The insert policy required `auth.uid() = user_id`, which fails for guest
customers (not logged in) because both sides are NULL and NULL = NULL is false.

## Fix
- Drop the strict insert policy.
- Create a new insert policy that allows:
  1. Logged-in users: auth.uid() = user_id (same as before)
  2. Guest users: user_id IS NULL (guest checkout)
- Both cases still enforce payment_status = 'pending' AND order_status = 'pending'.
*/

DROP POLICY IF EXISTS "insert_own_orders_pending" ON orders;

CREATE POLICY "insert_orders_pending" ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    payment_status = 'pending'
    AND order_status = 'pending'
    AND (
      user_id IS NULL
      OR auth.uid() = user_id
    )
  );
