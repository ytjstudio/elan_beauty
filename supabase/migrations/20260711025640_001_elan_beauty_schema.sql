/*
# Elan Beauty E-commerce Schema

## Overview
Complete e-commerce platform for a single-seller beauty brand. Includes customer auth,
product catalog, cart, orders, shipping by location, reviews, coupons, analytics, and admin settings.

## New Tables
1. `categories` — product categories (name, slug, image)
2. `products` — catalog items (name, price, sale_price, description, images, stock, featured, enabled)
3. `shipping_locations` — admin-configured delivery areas (state, town, price, enabled)
4. `coupons` — discount codes (percentage/fixed/free shipping, expiry, usage limits, min purchase)
5. `orders` — customer orders (number, customer info, address, shipping, total, payment status, order status)
6. `order_items` — products within an order (product snapshot, qty, price)
7. `reviews` — customer product reviews (rating, comment, approved/hidden)
8. `addresses` — customer saved delivery addresses
9. `wishlist` — customer saved products
10. `notifications` — admin + customer notifications
11. `settings` — store configuration (name, logo, banner, contact, paystack keys, social links)
12. `transactions` — successful Paystack payment records
13. `faqs` — frequently asked questions

## Security (RLS)
- Products, categories, enabled shipping locations, approved reviews, settings, faqs: readable by anon+authenticated (public storefront)
- Orders, wishlist, addresses, reviews (own): owner-scoped to authenticated via auth.uid()
- Admin writes (products, categories, shipping, coupons, settings, all orders): authenticated manage policies
- Notifications: owner-scoped + admin-visible
*/

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_categories" ON categories;
CREATE POLICY "anon_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_categories" ON categories;
CREATE POLICY "auth_manage_categories" ON categories FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  sale_price numeric(12,2),
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  featured boolean NOT NULL DEFAULT false,
  enabled boolean NOT NULL DEFAULT true,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  sales_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_products" ON products;
CREATE POLICY "auth_manage_products" ON products FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_enabled ON products(enabled) WHERE enabled = true;

-- ============ SHIPPING LOCATIONS ============
CREATE TABLE IF NOT EXISTS shipping_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL,
  town text NOT NULL,
  price numeric(12,2) NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shipping_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_shipping" ON shipping_locations;
CREATE POLICY "anon_read_shipping" ON shipping_locations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_shipping" ON shipping_locations;
CREATE POLICY "auth_manage_shipping" ON shipping_locations FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_shipping_state ON shipping_locations(state);

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage','fixed','free_shipping')),
  value numeric(12,2) NOT NULL DEFAULT 0,
  min_purchase numeric(12,2) DEFAULT 0,
  expiry_date timestamptz,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_coupons" ON coupons;
CREATE POLICY "anon_read_coupons" ON coupons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_coupons" ON coupons;
CREATE POLICY "auth_manage_coupons" ON coupons FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  state text NOT NULL,
  town text NOT NULL,
  address text NOT NULL,
  merchant_note text,
  subtotal numeric(12,2) NOT NULL,
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,
  coupon_code text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  order_status text NOT NULL DEFAULT 'placed' CHECK (order_status IN ('placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled')),
  payment_reference text,
  payment_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_orders" ON orders;
CREATE POLICY "select_own_orders" ON orders FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_orders" ON orders;
CREATE POLICY "insert_own_orders" ON orders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_manage_orders" ON orders;
CREATE POLICY "auth_manage_orders" ON orders FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  price numeric(12,2) NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_order_items" ON order_items;
CREATE POLICY "select_own_order_items" ON order_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_order_items" ON order_items;
CREATE POLICY "insert_own_order_items" ON order_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_manage_order_items" ON order_items;
CREATE POLICY "auth_manage_order_items" ON order_items FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','hidden')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_approved_reviews" ON reviews;
CREATE POLICY "anon_read_approved_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (status = 'approved');

DROP POLICY IF EXISTS "insert_own_reviews" ON reviews;
CREATE POLICY "insert_own_reviews" ON reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_manage_reviews" ON reviews;
CREATE POLICY "auth_manage_reviews" ON reviews FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text NOT NULL,
  state text NOT NULL,
  town text NOT NULL,
  address text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_addresses" ON addresses;
CREATE POLICY "select_own_addresses" ON addresses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_addresses" ON addresses;
CREATE POLICY "insert_own_addresses" ON addresses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_addresses" ON addresses;
CREATE POLICY "update_own_addresses" ON addresses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_addresses" ON addresses;
CREATE POLICY "delete_own_addresses" ON addresses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ WISHLIST ============
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wishlist" ON wishlist;
CREATE POLICY "select_own_wishlist" ON wishlist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wishlist" ON wishlist;
CREATE POLICY "insert_own_wishlist" ON wishlist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wishlist" ON wishlist;
CREATE POLICY "delete_own_wishlist" ON wishlist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR is_admin = true);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR is_admin = true) WITH CHECK (true);

-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Elan Beauty',
  store_logo text,
  hero_banner text,
  hero_title text DEFAULT 'Radiance, Redefined',
  hero_subtitle text DEFAULT 'Discover premium beauty essentials crafted for your glow.',
  contact_email text DEFAULT 'hello@elanbeauty.com',
  contact_phone text DEFAULT '+234 800 000 0000',
  store_address text DEFAULT 'Lagos, Nigeria',
  whatsapp_number text,
  instagram_url text,
  twitter_url text,
  facebook_url text,
  tiktok_url text,
  paystack_public_key text,
  paystack_secret_key text,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_settings" ON settings;
CREATE POLICY "anon_read_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_settings" ON settings;
CREATE POLICY "auth_manage_settings" ON settings FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============ TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reference text UNIQUE NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'success',
  gateway text NOT NULL DEFAULT 'paystack',
  customer_email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = transactions.order_id AND orders.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_manage_transactions" ON transactions;
CREATE POLICY "auth_manage_transactions" ON transactions FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- ============ FAQ ============
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_faqs" ON faqs;
CREATE POLICY "anon_read_faqs" ON faqs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_faqs" ON faqs;
CREATE POLICY "auth_manage_faqs" ON faqs FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- ============ HELPER: generate order number ============
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  seq_val bigint;
BEGIN
  SELECT nextval(pg_get_serial_sequence('orders','id')) INTO seq_val;
  RETURN 'ELN-' || to_char(now(), 'YYMMDD') || '-' || lpad(seq_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;
