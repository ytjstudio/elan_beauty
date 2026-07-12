/*
# Fix Orders SELECT — Allow Guest Order Readback

## Problem
The SELECT policy only allows auth.uid() = user_id, so guest orders
(user_id IS NULL) can't be read back on the confirmation page.

## Fix
- Drop the strict select policy.
- Allow SELECT when user_id matches auth.uid() OR user_id IS NULL (guest).
*/

DROP POLICY IF EXISTS "select_own_orders" ON orders;

CREATE POLICY "select_orders" ON orders FOR SELECT
  TO anon, authenticated
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
  );
