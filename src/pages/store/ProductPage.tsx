import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star, ArrowLeft, Truck, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, getEffectivePrice, isOnSale, getDiscountPercent } from '../../lib/format';
import { ProductCard } from '../../components/store/ProductCard';
import type { Product, Review } from '../../lib/types';

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [added, setAdded] = useState(false);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .maybeSingle();
      const prod = data as Product | null;
      setProduct(prod);
      if (prod) {
        const [relRes, revRes] = await Promise.all([
          supabase.from('products').select('*, category:categories(*)').eq('enabled', true).neq('id', prod.id).limit(4),
          supabase.from('reviews').select('*').eq('product_id', prod.id).eq('status', 'approved').order('created_at', { ascending: false }),
        ]);
        setRelated(relRes.data as Product[] || []);
        setReviews(revRes.data as Review[] || []);
        if (user) {
          const { data: wish } = await supabase.from('wishlist').select('id').eq('user_id', user.id).eq('product_id', prod.id).maybeSingle();
          setInWishlist(!!wish);
        }
      }
      setLoading(false);
    })();
  }, [slug, user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-secondary-500 text-lg">Product not found.</p>
        <Link to="/shop" className="btn-primary mt-4">Back to Shop</Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;
  const lowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (inWishlist) {
      await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', product.id);
      setInWishlist(false);
    } else {
      await supabase.from('wishlist').insert({ user_id: user.id, product_id: product.id });
      setInWishlist(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/shop" className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div
            className="relative aspect-square rounded-xl overflow-hidden bg-secondary-100 zoom-container cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            <img
              src={product.images[activeImage] || 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={product.name}
              className={`w-full h-full object-cover transition-transform duration-500 ${zoom ? 'scale-150' : 'scale-100'}`}
            />
            {isOnSale(product) && (
              <span className="absolute top-4 left-4 badge-error text-sm">-{getDiscountPercent(product)}% OFF</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImage === i ? 'border-primary-600' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link to={`/shop/${product.category.slug}`} className="text-primary-600 text-sm font-medium uppercase tracking-wider">
              {product.category.name}
            </Link>
          )}
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900 mt-2 mb-3">{product.name}</h1>

          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating) ? 'fill-warning-400 text-warning-400' : 'text-secondary-300'}`} />
                ))}
              </div>
              <span className="text-sm text-secondary-600">{product.rating.toFixed(1)} ({product.review_count} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-700">{formatNaira(getEffectivePrice(product))}</span>
            {isOnSale(product) && (
              <span className="text-xl text-secondary-400 line-through">{formatNaira(product.price)}</span>
            )}
          </div>

          <p className="text-secondary-700 leading-relaxed mb-6">{product.description}</p>

          {/* Stock */}
          <div className="mb-6">
            {outOfStock ? (
              <span className="badge-error">Out of Stock</span>
            ) : lowStock ? (
              <span className="badge-warning">Only {product.stock} left in stock!</span>
            ) : (
              <span className="badge-success">In Stock ({product.stock} available)</span>
            )}
          </div>

          {/* Quantity + Add to cart */}
          {!outOfStock && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-secondary-200 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-secondary-100 rounded-l-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-6 py-3 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-secondary-100 rounded-r-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1">
                {added ? 'Added to Cart!' : <><ShoppingBag className="w-5 h-5" /> Add to Cart</>}
              </button>
            </div>
          )}

          <button onClick={handleWishlist} className="btn-outline w-full mb-6">
            <Heart className={`w-5 h-5 ${inWishlist ? 'fill-accent-500 text-accent-500' : ''}`} />
            {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
          </button>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-secondary-100">
            <div className="text-center">
              <Truck className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs text-secondary-600">Fast Delivery</p>
            </div>
            <div className="text-center">
              <Shield className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs text-secondary-600">Secure Payment</p>
            </div>
            <div className="text-center">
              <RefreshCw className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-xs text-secondary-600">7-Day Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-secondary-900 mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-warning-400 text-warning-400' : 'text-secondary-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-secondary-500">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>
                {review.comment && <p className="text-secondary-700">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-secondary-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
