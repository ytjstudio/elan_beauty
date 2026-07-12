import { useEffect, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/store/ProductCard';
import type { Product } from '../../lib/types';

export function CustomerWishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('wishlist')
        .select('product:products(*, category:categories(*))')
        .eq('user_id', user.id);
      const items = (data || []).map((d: any) => d.product as Product);
      setProducts(items);
      setLoading(false);
    })();
  }, [user]);

  const removeItem = async (productId: string) => {
    if (!user) return;
    await supabase.from('wishlist').delete().eq('user_id', user.id).eq('product_id', productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  if (loading) return <div className="animate-pulse h-40" />;

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-secondary-900 mb-6">My Wishlist</h1>
      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold text-secondary-900 mb-2">No Wishlist Items</h2>
          <p className="text-secondary-600">Save items you love for later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              <button
                onClick={() => removeItem(p.id)}
                className="absolute top-2 left-2 p-2 bg-white/80 rounded-full hover:bg-white text-error-500 z-10"
                aria-label="Remove from wishlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
