export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  category_id: string | null;
  images: string[];
  stock: number;
  low_stock_threshold: number;
  featured: boolean;
  enabled: boolean;
  rating: number;
  review_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ShippingLocation {
  id: string;
  state: string;
  town: string;
  price: number;
  enabled: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  min_purchase: number;
  expiry_date: string | null;
  usage_limit: number | null;
  used_count: number;
  enabled: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  state: string;
  town: string;
  address: string;
  merchant_note: string | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  coupon_code: string | null;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  order_status: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_reference: string | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  price: number;
  quantity: number;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  comment: string | null;
  status: 'pending' | 'approved' | 'hidden';
  created_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  state: string;
  town: string;
  address: string;
  is_default: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Settings {
  id: string;
  store_name: string;
  store_logo: string | null;
  hero_banner: string | null;
  hero_title: string;
  hero_subtitle: string;
  contact_email: string;
  contact_phone: string;
  store_address: string;
  whatsapp_number: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  paystack_public_key: string | null;
  paystack_secret_key: string | null;
  low_stock_threshold: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  order_id: string;
  reference: string;
  amount: number;
  status: string;
  gateway: string;
  customer_email: string | null;
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
}
