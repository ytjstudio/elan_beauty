import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { StoreLayout } from './components/store/StoreLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Store pages
import { HomePage } from './pages/store/HomePage';
import { ShopPage } from './pages/store/ShopPage';
import { ProductPage } from './pages/store/ProductPage';
import { CartPage } from './pages/store/CartPage';
import { CheckoutPage } from './pages/store/CheckoutPage';
import { ContactPage } from './pages/store/ContactPage';
import { FAQPage } from './pages/store/FAQPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { CustomerDashboard } from './pages/customer/CustomerDashboard';
import { CustomerDashboardHome } from './pages/customer/CustomerDashboardHome';
import { CustomerOrders } from './pages/customer/CustomerOrders';
import { CustomerWishlist } from './pages/customer/CustomerWishlist';
import { CustomerAddresses } from './pages/customer/CustomerAddresses';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { OrderConfirmationPage } from './pages/store/OrderConfirmationPage';

// Admin pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminProductForm } from './pages/admin/AdminProductForm';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminShipping } from './pages/admin/AdminShipping';
import { AdminCoupons } from './pages/admin/AdminCoupons';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminRevenue } from './pages/admin/AdminRevenue';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminFAQs } from './pages/admin/AdminFAQs';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" /></div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <CartProvider>
          <Routes>
            {/* Auth */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Store */}
            <Route element={<StoreLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/shop/:category" element={<ShopPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
            </Route>

            {/* Customer dashboard */}
            <Route element={<ProtectedRoute><StoreLayout /></ProtectedRoute>}>
              <Route path="/account" element={<CustomerDashboard />}>
                <Route index element={<CustomerDashboardHome />} />
                <Route path="orders" element={<CustomerOrders />} />
                <Route path="wishlist" element={<CustomerWishlist />} />
                <Route path="addresses" element={<CustomerAddresses />} />
                <Route path="profile" element={<CustomerProfile />} />
              </Route>
            </Route>

            {/* Admin */}
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/products/new" element={<AdminProductForm />} />
              <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetail />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/shipping" element={<AdminShipping />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/revenue" element={<AdminRevenue />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/faqs" element={<AdminFAQs />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
