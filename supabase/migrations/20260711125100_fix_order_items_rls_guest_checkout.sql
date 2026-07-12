/*
# Fix Order Items RLS — Allow Guest Checkout Items

## Problem
The order_items insert/select policies required orders.user_id = auth.uid(),
which fails for guest orders (user_id is NULL).

## Fix
- Drop the strict insert and select policies.
- Create new policies that allow access when:
  1. The order belongs to the logged-in user (auth.uid() = orders.user_id), OR
  2. The order has no user_id (guest order)
*/

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
DROP POLICY IF EXISTS "select_own_order_items" ON order_items;

CREATE POLICY "insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id IS NULL
        OR orders.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "select_order_items" ON order_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id IS NULL
        OR orders.user_id = auth.uid()
      )
    )
  );
