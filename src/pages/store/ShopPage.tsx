import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from '../../components/store/ProductCard';
import { supabase } from '../../lib/supabase';
import type { Product, Category } from '../../lib/types';
import { getEffectivePrice } from '../../lib/format';

export function ShopPage() {
  const { category: categorySlug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug || 'all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [availability, setAvailability] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (categorySlug) setSelectedCategory(categorySlug);
  }, [categorySlug]);

  useEffect(() => {
    (async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*, category:categories(*)').eq('enabled', true),
        supabase.from('categories').select('*').order('name'),
      ]);
      setProducts(prodRes.data as Product[] || []);
      setCategories(catRes.data as Category[] || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category?.slug === selectedCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    result = result.filter(p => {
      const price = getEffectivePrice(p);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    if (availability === 'in_stock') result = result.filter(p => p.stock > 0);
    if (availability === 'out_of_stock') result = result.filter(p => p.stock === 0);

    switch (sortBy) {
      case 'price_low': result.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b)); break;
      case 'price_high': result.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a)); break;
      case 'popular': result.sort((a, b) => b.sales_count - a.sales_count); break;
      default: result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return result;
  }, [products, selectedCategory, search, priceRange, availability, sortBy]);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="font-medium text-secondary-900 mb-3">Category</h3>
        <div className="space-y-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedCategory === 'all' ? 'bg-primary-100 text-primary-700 font-medium' : 'text-secondary-600 hover:bg-secondary-100'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.slug ? 'bg-primary-100 text-primary-700 font-medium' : 'text-secondary-600 hover:bg-secondary-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="font-medium text-secondary-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={priceRange[1]}
            onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-primary-600"
          />
          <div className="flex justify-between text-sm text-secondary-600">
            <span>₦{priceRange[0].toLocaleString()}</span>
            <span>₦{priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-medium text-secondary-900 mb-3">Availability</h3>
        <div className="space-y-2">
          {([
            { value: 'all', label: 'All' },
            { value: 'in_stock', label: 'In Stock' },
            { value: 'out_of_stock', label: 'Out of Stock' },
          ] as const).map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={availability === opt.value}
                onChange={() => setAvailability(opt.value)}
                className="accent-primary-600"
              />
              <span className="text-sm text-secondary-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold text-secondary-900">
          {selectedCategory === 'all'
            ? 'Shop All'
            : categories.find(c => c.slug === selectedCategory)?.name || 'Shop'}
        </h1>
        <p className="text-secondary-600 mt-1">{filtered.length} products</p>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1"
        />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="input sm:w-56"
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
        <button
          onClick={() => setShowFilters(true)}
          className="btn-outline lg:hidden"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-5 sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card animate-pulse">
                  <div className="aspect-square bg-secondary-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-secondary-200 rounded w-3/4" />
                    <div className="h-6 bg-secondary-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-secondary-500 text-lg">No products found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto animate-slide-down p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
