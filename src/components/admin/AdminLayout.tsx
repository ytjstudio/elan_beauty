import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Truck, Ticket,
  Star, BarChart3, Settings, DollarSign, Bell, HelpCircle,
  LogOut, Menu, X, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

export function AdminLayout() {
  const { signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/customers', label: 'Customers', icon: Users },
    { to: '/admin/shipping', label: 'Shipping', icon: Truck },
    { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { to: '/admin/reviews', label: 'Reviews', icon: Star },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/revenue', label: 'Revenue', icon: DollarSign },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/faqs', label: 'FAQs', icon: HelpCircle },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-secondary-900 text-secondary-300 flex flex-col z-50 transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-2">
            {settings?.store_logo ? (
              <img src={settings.store_logo} alt={settings.store_name} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-white font-serif text-lg font-bold">E</span>
              </div>
            )}
            <div>
              <p className="font-serif text-lg font-bold text-white">{settings?.store_name || 'Elan Beauty'}</p>
              <p className="text-xs text-secondary-400">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-secondary-800 space-y-0.5">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-secondary-300 hover:bg-secondary-800 hover:text-white transition-colors">
            <Store className="w-4 h-4" /> View Store
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-error-400 hover:bg-error-900/30 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-white border-b border-secondary-100 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
          <span className="font-serif font-bold">Admin Panel</span>
          <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
