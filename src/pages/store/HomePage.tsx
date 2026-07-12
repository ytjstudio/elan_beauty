import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Quote } from 'lucide-react';
import { ProductCard } from '../../components/store/ProductCard';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import type { Product, Category } from '../../lib/types';

export function HomePage() {
  const { settings } = useSettings();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [featRes, newRes, catRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').eq('featured', true).eq('enabled', true).limit(8),
        supabase.from('products').select('*, category:categories(*)').eq('enabled', true).order('created_at', { ascending: false }).limit(4),
        supabase.from('categories').select('*').order('name'),
      ]);
      setFeatured(featRes.data as Product[] || []);
      setNewArrivals(newRes.data as Product[] || []);
      setCategories(catRes.data as Category[] || []);
      setLoading(false);
    })();
  }, []);

  const reviews = [
    { name: 'Amara O.', text: 'Elan Beauty has completely transformed my skincare routine. The Radiance Serum is a game-changer!', rating: 5, location: 'Lagos' },
    { name: 'Chioma N.', text: 'The quality of these products is unmatched. My skin has never looked better. Highly recommend!', rating: 5, location: 'Abuja' },
    { name: 'Funmi A.', text: 'Beautiful packaging, fast delivery, and amazing products. The lipstick stays on all day!', rating: 5, location: 'Ibadan' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={settings?.hero_banner || 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=1600'}
          alt="Elan Beauty"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-secondary-950/70 via-secondary-950/40 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-xl text-white">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 animate-slide-up">
              {settings?.hero_title || 'Radiance, Redefined'}
            </h1>
            <p className="text-lg text-secondary-200 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {settings?.hero_subtitle || 'Discover premium beauty essentials crafted for your glow.'}
            </p>
            <Link to="/shop" className="btn-primary text-base animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Shop Collection <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900 mb-2">Shop by Category</h2>
          <p className="text-secondary-600">Explore our curated collections</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/shop/${cat.slug}`}
              className="group relative aspect-square rounded-xl overflow-hidden card hover:shadow-lg transition-all"
            >
              <img
                src={cat.image_url || 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=400'}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                <h3 className="text-white font-serif text-lg font-semibold">{cat.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900">Featured Products</h2>
            <p className="text-secondary-600 mt-1">Our handpicked favorites</p>
          </div>
          <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-secondary-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary-200 rounded w-3/4" />
                  <div className="h-6 bg-secondary-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900">New Arrivals</h2>
              <p className="text-secondary-600 mt-1">Fresh additions to our collection</p>
            </div>
            <Link to="/shop" className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900 mb-2">What Our Customers Say</h2>
          <p className="text-secondary-600">Real reviews from real beauty lovers</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <div key={i} className="card p-6 hover:shadow-lg transition-shadow">
              <Quote className="w-8 h-8 text-primary-300 mb-3" />
              <div className="flex gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-warning-400 text-warning-400" />
                ))}
              </div>
              <p className="text-secondary-700 leading-relaxed mb-4">"{review.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="font-serif text-primary-700 font-bold">{review.name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">{review.name}</p>
                  <p className="text-sm text-secondary-500">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-700 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-4">Ready to Glow?</h2>
          <p className="text-primary-100 mb-8 text-lg">Join thousands of happy customers who trust Elan Beauty for their beauty needs.</p>
          <Link to="/shop" className="btn bg-white text-primary-700 hover:bg-primary-50 text-base">
            Start Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
