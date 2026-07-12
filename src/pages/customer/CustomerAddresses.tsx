import { useEffect, useState } from 'react';
import { Plus, Trash2, MapPin, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Address, ShippingLocation } from '../../lib/types';

export function CustomerAddresses() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [towns, setTowns] = useState<ShippingLocation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', state: '', town_id: '', address: '' });

  useEffect(() => {
    if (!user) return;
    supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setAddresses(data as Address[] || []);
    });
    supabase.from('shipping_locations').select('*').eq('enabled', true).then(({ data }) => {
      const locs = data as ShippingLocation[] || [];
      setShippingLocations(locs);
      setStates([...new Set(locs.map(l => l.state))].sort());
    });
  }, [user]);

  useEffect(() => {
    if (form.state) {
      setTowns(shippingLocations.filter(l => l.state === form.state));
      setForm(f => ({ ...f, town_id: '' }));
    }
  }, [form.state, shippingLocations]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const town = towns.find(t => t.id === form.town_id);
    const { data } = await supabase.from('addresses').insert({
      user_id: user.id,
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      state: form.state,
      town: town?.town || '',
      address: form.address,
    }).select().single();
    if (data) {
      setAddresses(prev => [data as Address, ...prev]);
      setForm({ label: 'Home', full_name: '', phone: '', state: '', town_id: '', address: '' });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">My Addresses</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card p-6 mb-6 space-y-4 animate-slide-down">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Label</label>
              <input className="input" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Home, Work..." />
            </div>
            <div>
              <label className="label">Full Name *</label>
              <input className="input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className="input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">State *</label>
              <select className="input" required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}>
                <option value="">Select State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Town/Area *</label>
              <select className="input" required value={form.town_id} onChange={e => setForm({ ...form, town_id: e.target.value })} disabled={!form.state}>
                <option value="">Select Town</option>
                {towns.map(t => <option key={t.id} value={t.id}>{t.town}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Full Address *</label>
              <textarea className="input" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Save Address</button>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-600">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <div key={addr.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge-primary">{addr.label}</span>
                    {addr.is_default && <span className="badge-accent"><Star className="w-3 h-3" /> Default</span>}
                  </div>
                  <p className="font-medium text-secondary-900">{addr.full_name}</p>
                  <p className="text-sm text-secondary-600">{addr.phone}</p>
                  <p className="text-sm text-secondary-600 mt-1">{addr.address}</p>
                  <p className="text-sm text-secondary-600">{addr.town}, {addr.state}</p>
                </div>
                <button onClick={() => handleDelete(addr.id)} className="text-error-500 hover:text-error-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
