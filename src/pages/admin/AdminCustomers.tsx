import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDate } from '../../lib/format';
import type { Order } from '../../lib/types';

interface CustomerRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  orderCount: number;
  totalSpent: number;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: users, error: userError } = await supabase.rpc('get_all_users');
      if (userError) {
        console.error('Failed to load users:', userError);
        setLoading(false);
        return;
      }
      const { data: orderData } = await supabase.from('orders').select('*');
      const allOrders = orderData as Order[] || [];
      setOrders(allOrders);

      const rows: CustomerRow[] = (users || []).map((u: any) => {
        const userOrders = allOrders.filter(o => o.user_id === u.id);
        const paid = userOrders.filter(o => o.payment_status === 'paid');
        return {
          id: u.id,
          email: u.email,
          full_name: u.full_name || '-',
          phone: u.phone || '-',
          created_at: u.created_at,
          orderCount: userOrders.length,
          totalSpent: paid.reduce((s, o) => s + Number(o.total), 0),
        };
      });
      setCustomers(rows);
      setLoading(false);
    })();
  }, []);

  const filtered = customers.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Customers</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
        <input className="input pl-10" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="animate-pulse h-64" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-secondary-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Orders</th>
                  <th className="text-left px-4 py-3 font-medium">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{c.full_name}</td>
                    <td className="px-4 py-3 text-secondary-600">{c.email}</td>
                    <td className="px-4 py-3 text-secondary-600">{c.phone}</td>
                    <td className="px-4 py-3 text-secondary-600">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-3">{c.orderCount}</td>
                    <td className="px-4 py-3 font-bold text-primary-700">{formatNaira(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <p className="text-center text-secondary-500 py-8">No customers found.</p>}
        </div>
      )}
    </div>
  );
}
