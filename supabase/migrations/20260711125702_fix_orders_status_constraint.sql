/*
# Fix Orders Check Constraint — Add 'pending' Status

## Problem
The orders_order_status_check constraint did not include 'pending', so
inserting an order with order_status='pending' (required by RLS policy)
violated the constraint.

## Fix
- Drop the old check constraint.
- Recreate it with 'pending' added to the allowed values.
*/

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_order_status_check
  CHECK (order_status = ANY (ARRAY[
    'pending'::text,
    'placed'::text,
    'confirmed'::text,
    'processing'::text,
    'shipped'::text,
    'out_for_delivery'::text,
    'delivered'::text,
    'cancelled'::text
  ]));
