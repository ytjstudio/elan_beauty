import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/format';
import { ImageUpload } from '../../components/admin/ImageUpload';
import type { Category } from '../../lib/types';

export function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    category_id: '',
    stock: '',
    low_stock_threshold: '5',
    featured: false,
    enabled: true,
    images: [] as string[],
  });

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data as Category[] || []));
    if (id) {
      supabase.from('products').select('*').eq('id', id).maybeSingle().then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            sale_price: data.sale_price?.toString() || '',
            category_id: data.category_id || '',
            stock: data.stock?.toString() || '',
            low_stock_threshold: data.low_stock_threshold?.toString() || '5',
            featured: data.featured || false,
            enabled: data.enabled !== false,
            images: data.images || [],
          });
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      slug: slugify(form.name),
      description: form.description,
      price: parseFloat(form.price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
      category_id: form.category_id || null,
      stock: parseInt(form.stock) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      featured: form.featured,
      enabled: form.enabled,
      images: form.images,
    };

    if (isEdit) {
      await supabase.from('products').update(payload).eq('id', id);
    } else {
      await supabase.from('products').insert(payload);
    }
    setSaving(false);
    navigate('/admin/products');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button onClick={() => navigate('/admin/products')} className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </button>
      <h1 className="font-serif text-2xl font-bold text-secondary-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Product Name *</label>
          <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[120px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Price (₦) *</label>
            <input className="input" type="number" step="0.01" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="label">Sale Price (₦)</label>
            <input className="input" type="number" step="0.01" value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Stock Quantity *</label>
            <input className="input" type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div>
            <label className="label">Low Stock Threshold</label>
            <input className="input" type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="label">Product Images</label>
          <ImageUpload images={form.images} onChange={(images) => setForm({ ...form, images })} />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="accent-primary-600 w-4 h-4" />
            <span className="text-sm font-medium text-secondary-700">Featured Product</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} className="accent-primary-600 w-4 h-4" />
            <span className="text-sm font-medium text-secondary-700">Enabled (visible in store)</span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <><Save className="w-4 h-4" /> {isEdit ? 'Update Product' : 'Create Product'}</>}
        </button>
      </form>
    </div>
  );
}
