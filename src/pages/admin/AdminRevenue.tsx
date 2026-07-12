import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDate } from '../../lib/format';
import type { Transaction, Order } from '../../lib/types';

export function AdminRevenue() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [txRes, orderRes] = await Promise.all([
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('payment_status', 'paid'),
      ]);
      setTransactions(txRes.data as Transaction[] || []);
      setOrders(orderRes.data as Order[] || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="animate-pulse h-64" />;

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.amount), 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayRevenue = transactions.filter(t => new Date(t.created_at) >= today).reduce((s, t) => s + Number(t.amount), 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthlyRevenue = transactions.filter(t => new Date(t.created_at) >= monthStart).reduce((s, t) => s + Number(t.amount), 0);

  // Monthly chart
  const chartData: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i); d.setDate(1); d.setHours(0, 0, 0, 0);
    const next = new Date(d); next.setMonth(next.getMonth() + 1);
    const rev = transactions.filter(t => { const td = new Date(t.created_at); return td >= d && td < next; }).reduce((s, t) => s + Number(t.amount), 0);
    chartData.push({ month: d.toLocaleDateString('en', { month: 'short' }), revenue: rev });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Revenue Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-sm text-secondary-600">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-700 mt-1">{formatNaira(totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-secondary-600">Today's Revenue</p>
          <p className="text-2xl font-bold text-success-600 mt-1">{formatNaira(todayRevenue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-secondary-600">This Month</p>
          <p className="text-2xl font-bold text-secondary-900 mt-1">{formatNaira(monthlyRevenue)}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold mb-4">Monthly Revenue</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="month" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => formatNaira(Number(v))} />
            <Bar dataKey="revenue" fill="#c75a38" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary-50 text-secondary-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Reference</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-3 font-mono text-xs">{tx.reference}</td>
                  <td className="px-4 py-3 font-bold text-success-600">{formatNaira(Number(tx.amount))}</td>
                  <td className="px-4 py-3"><span className="badge-success">{tx.status}</span></td>
                  <td className="px-4 py-3 text-secondary-600">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && <p className="text-center text-secondary-500 py-8">No transactions yet.</p>}
        </div>
      </div>
    </div>
  );
}
