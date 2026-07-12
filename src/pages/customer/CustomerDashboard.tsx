import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Heart, MapPin, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function CustomerDashboard() {
  const { user, signOut } = useAuth();
  const navItems = [
    { to: '/account', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/account/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
    { to: '/account/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0">
          <div className="card p-6 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
              <span className="font-serif text-primary-700 text-xl font-bold">
                {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <p className="font-medium text-secondary-900">{user?.user_metadata?.full_name || 'Customer'}</p>
            <p className="text-sm text-secondary-500">{user?.email}</p>
          </div>
          <nav className="card p-2 space-y-1">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
