import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export function StoreFooter() {
  const { settings } = useSettings();

  return (
    <footer className="bg-secondary-900 text-secondary-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-serif text-2xl font-bold text-white mb-3">{settings?.store_name || 'Elan Beauty'}</h3>
            <p className="text-sm text-secondary-400 leading-relaxed">
              Premium beauty essentials crafted for your glow. Discover skincare, makeup, and fragrances designed to elevate your radiance.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-primary-400 transition-colors">All Products</Link></li>
              <li><Link to="/shop/skincare" className="hover:text-primary-400 transition-colors">Skincare</Link></li>
              <li><Link to="/shop/makeup" className="hover:text-primary-400 transition-colors">Makeup</Link></li>
              <li><Link to="/shop/fragrance" className="hover:text-primary-400 transition-colors">Fragrance</Link></li>
              <li><Link to="/shop/haircare" className="hover:text-primary-400 transition-colors">Haircare</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              <li><Link to="/account/orders" className="hover:text-primary-400 transition-colors">Track Order</Link></li>
              <li><Link to="/account" className="hover:text-primary-400 transition-colors">My Account</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-400" />
                <span>{settings?.store_address || 'Lagos, Nigeria'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <span>{settings?.contact_phone || '+234 800 000 0000'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-primary-400" />
                <span>{settings?.contact_email || 'hello@elanbeauty.com'}</span>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-400 transition-colors" aria-label="Instagram">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.twitter_url && (
                <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-400 transition-colors" aria-label="Twitter">
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="text-secondary-400 hover:text-primary-400 transition-colors" aria-label="Facebook">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-800 mt-8 pt-6 text-center text-sm text-secondary-500">
          <p>&copy; {new Date().getFullYear()} {settings?.store_name || 'Elan Beauty'}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
