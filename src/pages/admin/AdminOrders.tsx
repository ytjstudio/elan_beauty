import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDate } from '../../lib/format';
import type { Order } from '../../lib/types';

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data as Order[] || []);
    setLoading(false);
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || o.order_status === filter;
    return matchSearch && matchFilter;
  });

  const statusFilters = ['all', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Orders</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <input className="input pl-10" placeholder="Search by order number or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={filter} onChange={e => setFilter(e.target.value)}>
          {statusFilters.map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse h-64" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-secondary-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Order #</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Payment</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{o.order_number}</td>
                    <td className="px-4 py-3 text-secondary-600">{o.customer_name}</td>
                    <td className="px-4 py-3 text-secondary-600">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{formatNaira(Number(o.total))}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${o.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{o.payment_status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        o.order_status === 'delivered' ? 'badge-success' :
                        o.order_status === 'cancelled' ? 'badge-error' :
                        o.order_status === 'shipped' || o.order_status === 'out_for_delivery' ? 'badge-primary' :
                        'badge-secondary'
                      }`}>{o.order_status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/orders/${o.id}`} className="inline-flex p-2 text-primary-600 hover:bg-primary-50 rounded-lg">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="text-center text-secondary-500 py-8">No orders found.</p>}
        </div>
      )}
    </div>
  );
}
