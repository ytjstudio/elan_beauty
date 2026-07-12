import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, X, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira } from '../../lib/format';
import type { ShippingLocation } from '../../lib/types';

export function AdminShipping() {
  const [locations, setLocations] = useState<ShippingLocation[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShippingLocation | null>(null);
  const [form, setForm] = useState({ state: '', town: '', price: '', enabled: true });

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    const { data } = await supabase.from('shipping_locations').select('*').order('state').order('town');
    setLocations(data as ShippingLocation[] || []);
  };

  const filtered = locations.filter(l =>
    l.state.toLowerCase().includes(search.toLowerCase()) ||
    l.town.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { state: form.state, town: form.town, price: parseFloat(form.price) || 0, enabled: form.enabled };
    if (editing) {
      await supabase.from('shipping_locations').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('shipping_locations').insert(payload);
    }
    setForm({ state: '', town: '', price: '', enabled: true });
    setEditing(null);
    setShowForm(false);
    fetchLocations();
  };

  const handleEdit = (loc: ShippingLocation) => {
    setEditing(loc);
    setForm({ state: loc.state, town: loc.town, price: loc.price.toString(), enabled: loc.enabled });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this delivery location?')) return;
    await supabase.from('shipping_locations').delete().eq('id', id);
    fetchLocations();
  };

  const toggleEnabled = async (loc: ShippingLocation) => {
    await supabase.from('shipping_locations').update({ enabled: !loc.enabled }).eq('id', loc.id);
    fetchLocations();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">Shipping Management</h1>
        <button onClick={() => { setEditing(null); setForm({ state: '', town: '', price: '', enabled: true }); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end animate-slide-down">
          <div><label className="label">State *</label><input className="input" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} /></div>
          <div><label className="label">Town/Area *</label><input className="input" required value={form.town} onChange={e => setForm({ ...form, town: e.target.value })} /></div>
          <div><label className="label">Shipping Fee (₦) *</label><input className="input" type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Add'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline"><X className="w-4 h-4" /></button>
          </div>
        </form>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input className="input pl-10" placeholder="Search locations..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-secondary-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">State</th>
                <th className="text-left px-4 py-3 font-medium">Town/Area</th>
                <th className="text-left px-4 py-3 font-medium">Shipping Fee</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {filtered.map(loc => (
                <tr key={loc.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 font-medium text-secondary-900">{loc.state}</td>
                  <td className="px-4 py-3 text-secondary-600">{loc.town}</td>
                  <td className="px-4 py-3 font-medium">{formatNaira(loc.price)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleEnabled(loc)} className={`badge ${loc.enabled ? 'badge-success' : 'badge-secondary'}`}>
                      {loc.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(loc)} className="p-2 text-secondary-600 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(loc.id)} className="p-2 text-error-500 hover:text-error-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-8"><Truck className="w-10 h-10 text-secondary-300 mx-auto mb-2" /><p className="text-secondary-500">No shipping locations found.</p></div>}
      </div>
    </div>
  );
}
