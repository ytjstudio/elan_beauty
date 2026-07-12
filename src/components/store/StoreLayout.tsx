import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { StoreFooter } from './StoreFooter';

export function StoreLayout() {
  const { itemCount } = useCart();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Contact', path: '/contact' },
    { label: 'FAQ', path: '/faq' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-secondary-50">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              {settings?.store_logo ? (
                <img src={settings.store_logo} alt={settings.store_name} className="h-10 lg:h-12 w-auto object-contain" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-white font-serif text-lg font-bold">E</span>
                </div>
              )}
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => navigate('/shop')}
                className="p-2 text-secondary-700 hover:text-primary-600 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              {user && !isAdmin && (
                <Link to="/account/wishlist" className="p-2 text-secondary-700 hover:text-primary-600 transition-colors" aria-label="Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
              )}
              {user ? (
                <Link to={isAdmin ? '/admin' : '/account'} className="p-2 text-secondary-700 hover:text-primary-600 transition-colors" aria-label="Account">
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link to="/login" className="p-2 text-secondary-700 hover:text-primary-600 transition-colors" aria-label="Login">
                  <User className="w-5 h-5" />
                </Link>
              )}
              <Link to="/cart" className="relative p-2 text-secondary-700 hover:text-primary-600 transition-colors" aria-label="Cart">
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">
                    {itemCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-secondary-700"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-secondary-100 animate-slide-down">
            <nav className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-secondary-700 hover:text-primary-600 font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>

      <StoreFooter />
    </div>
  );
}
