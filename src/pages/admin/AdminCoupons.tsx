import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDate } from '../../lib/format';
import type { Coupon } from '../../lib/types';

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: '', type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping', value: '',
    min_purchase: '', expiry_date: '', usage_limit: '', enabled: true,
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    setCoupons(data as Coupon[] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value) || 0,
      min_purchase: parseFloat(form.min_purchase) || 0,
      expiry_date: form.expiry_date || null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      enabled: form.enabled,
    };
    if (editing) {
      await supabase.from('coupons').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('coupons').insert(payload);
    }
    setForm({ code: '', type: 'percentage', value: '', min_purchase: '', expiry_date: '', usage_limit: '', enabled: true });
    setEditing(null);
    setShowForm(false);
    fetchCoupons();
  };

  const handleEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code, type: c.type, value: c.value.toString(),
      min_purchase: c.min_purchase.toString(), expiry_date: c.expiry_date?.split('T')[0] || '',
      usage_limit: c.usage_limit?.toString() || '', enabled: c.enabled,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    fetchCoupons();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">Coupons</h1>
        <button onClick={() => { setEditing(null); setForm({ code: '', type: 'percentage', value: '', min_purchase: '', expiry_date: '', usage_limit: '', enabled: true }); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="label">Code *</label><input className="input" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
            <div>
              <label className="label">Type *</label>
              <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as typeof form.type })}>
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount Discount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label className="label">Value (%) or Amount (₦)</label><input className="input" type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} disabled={form.type === 'free_shipping'} /></div>
            <div><label className="label">Min Purchase (₦)</label><input className="input" type="number" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: e.target.value })} /></div>
            <div><label className="label">Expiry Date</label><input className="input" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} /></div>
            <div><label className="label">Usage Limit</label><input className="input" type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-secondary-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Value</th>
                <th className="text-left px-4 py-3 font-medium">Min Purchase</th>
                <th className="text-left px-4 py-3 font-medium">Expiry</th>
                <th className="text-left px-4 py-3 font-medium">Used</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 font-mono font-bold text-secondary-900">{c.code}</td>
                  <td className="px-4 py-3 text-secondary-600">{c.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? formatNaira(c.value) : '-'}</td>
                  <td className="px-4 py-3">{c.min_purchase > 0 ? formatNaira(c.min_purchase) : '-'}</td>
                  <td className="px-4 py-3 text-secondary-600">{c.expiry_date ? formatDate(c.expiry_date) : '-'}</td>
                  <td className="px-4 py-3">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}</td>
                  <td className="px-4 py-3"><span className={`badge ${c.enabled ? 'badge-success' : 'badge-secondary'}`}>{c.enabled ? 'Active' : 'Disabled'}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(c)} className="p-2 text-secondary-600 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-error-500 hover:text-error-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coupons.length === 0 && <div className="text-center py-8"><Ticket className="w-10 h-10 text-secondary-300 mx-auto mb-2" /><p className="text-secondary-500">No coupons yet.</p></div>}
      </div>
    </div>
  );
}
