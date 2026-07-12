import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatNaira } from '../../lib/format';
import type { Order, OrderItem, Product } from '../../lib/types';


export function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [ordersRes, itemsRes, productsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('payment_status', 'paid'),
        supabase.from('order_items').select('*'),
        supabase.from('products').select('*'),
      ]);
      setOrders(ordersRes.data as Order[] || []);
      setOrderItems(itemsRes.data as OrderItem[] || []);
      setProducts(productsRes.data as Product[] || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="animate-pulse h-96" />;

  // Sales chart
  const salesData: { date: string; sales: number }[] = [];
  const now = new Date();
  const days = period === 'daily' ? 7 : period === 'weekly' ? 12 : 12;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    if (period === 'daily') d.setDate(d.getDate() - i);
    else if (period === 'weekly') d.setDate(d.getDate() - i * 7);
    else d.setMonth(d.getMonth() - i);
    const start = new Date(d);
    if (period === 'daily') start.setHours(0, 0, 0, 0);
    else if (period === 'weekly') start.setHours(0, 0, 0, 0);
    else start.setDate(1);
    const end = new Date(start);
    if (period === 'daily') end.setDate(end.getDate() + 1);
    else if (period === 'weekly') end.setDate(end.getDate() + 7);
    else end.setMonth(end.getMonth() + 1);

    const periodSales = orders.filter(o => {
      const od = new Date(o.created_at);
      return od >= start && od < end;
    }).reduce((s, o) => s + Number(o.total), 0);
    salesData.push({
      date: period === 'monthly' ? start.toLocaleDateString('en', { month: 'short' }) : start.toLocaleDateString('en', { day: 'numeric', month: 'short' }),
      sales: periodSales,
    });
  }

  // Best selling products
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  orderItems.forEach(item => {
    const existing = productSales.get(item.product_id || '') || { name: item.product_name, qty: 0, revenue: 0 };
    existing.qty += item.quantity;
    existing.revenue += Number(item.price) * item.quantity;
    productSales.set(item.product_id || '', existing);
  });
  const bestSelling = Array.from(productSales.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topRevenue = Array.from(productSales.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // AOV
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">Analytics</h1>
        <select className="input w-40" value={period} onChange={e => setPeriod(e.target.value as typeof period)}>
          <option value="daily">Daily (7 days)</option>
          <option value="weekly">Weekly (12 weeks)</option>
          <option value="monthly">Monthly (12 months)</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5"><p className="text-sm text-secondary-600">Total Revenue</p><p className="text-xl font-bold text-primary-700 mt-1">{formatNaira(totalRevenue)}</p></div>
        <div className="card p-5"><p className="text-sm text-secondary-600">Total Orders</p><p className="text-xl font-bold text-secondary-900 mt-1">{orders.length}</p></div>
        <div className="card p-5"><p className="text-sm text-secondary-600">Avg Order Value</p><p className="text-xl font-bold text-secondary-900 mt-1">{formatNaira(aov)}</p></div>
        <div className="card p-5"><p className="text-sm text-secondary-600">Products Sold</p><p className="text-xl font-bold text-secondary-900 mt-1">{orderItems.reduce((s, i) => s + i.quantity, 0)}</p></div>
      </div>

      {/* Sales chart */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold mb-4">Sales Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={salesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => formatNaira(Number(v))} />
            <Line type="monotone" dataKey="sales" stroke="#c75a38" strokeWidth={2} dot={{ fill: '#c75a38' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best selling */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold mb-4">Best Selling Products</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bestSelling} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" stroke="#888" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={100} />
              <Tooltip />
              <Bar dataKey="qty" fill="#c75a38" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top revenue */}
        <div className="card p-6">
          <h2 className="font-serif text-lg font-bold mb-4">Most Purchased (Revenue)</h2>
          <div className="space-y-3">
            {topRevenue.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-secondary-700">{p.name}</span>
                <span className="font-bold text-primary-700">{formatNaira(p.revenue)}</span>
              </div>
            ))}
            {topRevenue.length === 0 && <p className="text-secondary-500 text-sm">No data yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
