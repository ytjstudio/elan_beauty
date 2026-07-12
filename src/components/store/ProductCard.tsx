import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../../lib/types';
import { formatNaira, getEffectivePrice, isOnSale, getDiscountPercent } from '../../lib/format';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const [adding, setAdding] = useState(false);
  const outOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    setAdding(true);
    addToCart(product, 1);
    setTimeout(() => setAdding(false), 800);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (inWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
      setInWishlist(false);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id });
      setInWishlist(true);
    }
  };

  return (
    <Link to={`/product/${product.slug}`} className="group card overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square overflow-hidden bg-secondary-100">
        <img
          src={product.images[0] || 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? 'opacity-60' : ''}`}
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isOnSale(product) && (
            <span className="badge-error">-{getDiscountPercent(product)}%</span>
          )}
          {product.featured && (
            <span className="badge-primary">Featured</span>
          )}
          {outOfStock && (
            <span className="badge-secondary">Out of Stock</span>
          )}
        </div>
        {/* Wishlist */}
        {user && (
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all"
            aria-label="Add to wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'fill-accent-500 text-accent-500' : 'text-secondary-600'}`} />
          </button>
        )}
        {/* Quick add */}
        {!outOfStock && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full btn-primary text-sm py-2"
            >
              {adding ? 'Added!' : <><ShoppingBag className="w-4 h-4" /> Quick Add</>}
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-1">
          {product.name}
        </h3>
        {product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3.5 h-3.5 fill-warning-400 text-warning-400" />
            <span className="text-xs text-secondary-600">{product.rating.toFixed(1)} ({product.review_count})</span>
          </div>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg font-bold text-primary-700">{formatNaira(getEffectivePrice(product))}</span>
          {isOnSale(product) && (
            <span className="text-sm text-secondary-400 line-through">{formatNaira(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
