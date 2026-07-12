import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira, getEffectivePrice } from '../../lib/format';
import type { Product, Category } from '../../lib/types';

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data as Category[] || []));
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false });
    setProducts(data as Product[] || []);
    setLoading(false);
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleEnabled = async (product: Product) => {
    await supabase.from('products').update({ enabled: !product.enabled }).eq('id', product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">Products</h1>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input className="input pl-10" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="animate-pulse h-64" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-secondary-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Price</th>
                  <th className="text-left px-4 py-3 font-medium">Stock</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded object-cover" />
                        <span className="font-medium text-secondary-900">{p.name}</span>
                        {p.featured && <span className="badge-primary">Featured</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-600">{p.category?.name || '-'}</td>
                    <td className="px-4 py-3 font-medium">{formatNaira(getEffectivePrice(p))}</td>
                    <td className="px-4 py-3">
                      {p.stock === 0 ? <span className="badge-error">Out of Stock</span> :
                       p.stock <= p.low_stock_threshold ? <span className="badge-warning"><AlertTriangle className="w-3 h-3" /> {p.stock}</span> :
                       <span className="badge-success">{p.stock}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEnabled(p)} className={`badge ${p.enabled ? 'badge-success' : 'badge-secondary'}`}>
                        {p.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/products/${p.id}/edit`} className="p-2 text-secondary-600 hover:text-primary-600">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-error-500 hover:text-error-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
