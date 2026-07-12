import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Users, Package, AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDate } from '../../lib/format';
import type { Order, Product, Transaction } from '../../lib/types';

export function AdminOverview() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    productsInStock: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentPayments, setRecentPayments] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [ordersRes, productsRes, customersRes, transactionsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*'),
        supabase.from('auth.users').select('id, email, created_at', { count: 'exact' }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      const orders = ordersRes.data as Order[] || [];
      const products = productsRes.data as Product[] || [];
      const transactions = transactionsRes.data as Transaction[] || [];

      const paidOrders = orders.filter(o => o.payment_status === 'paid');
      const todayOrders = paidOrders.filter(o => new Date(o.created_at) >= today);

      setStats({
        todaySales: todayOrders.reduce((s, o) => s + Number(o.total), 0),
        totalRevenue: paidOrders.reduce((s, o) => s + Number(o.total), 0),
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.order_status === 'placed' || o.order_status === 'confirmed').length,
        processingOrders: orders.filter(o => o.order_status === 'processing').length,
        deliveredOrders: orders.filter(o => o.order_status === 'delivered').length,
        cancelledOrders: orders.filter(o => o.order_status === 'cancelled').length,
        totalCustomers: customersRes.count || 0,
        productsInStock: products.filter(p => p.stock > 0).length,
        lowStockProducts: products.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold).length,
      });

      setRecentOrders(orders.slice(0, 5));
      setRecentPayments(transactions);

      // Chart data - last 7 days
      const days: { date: string; sales: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const daySales = paidOrders.filter(o => {
          const od = new Date(o.created_at);
          return od >= d && od < next;
        }).reduce((s, o) => s + Number(o.total), 0);
        days.push({ date: d.toLocaleDateString('en', { weekday: 'short' }), sales: daySales });
      }
      setChartData(days);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { label: "Today's Sales", value: formatNaira(stats.todaySales), icon: DollarSign, color: 'bg-success-100 text-success-700' },
    { label: 'Total Revenue', value: formatNaira(stats.totalRevenue), icon: DollarSign, color: 'bg-primary-100 text-primary-700' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'bg-secondary-100 text-secondary-700' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'bg-warning-100 text-warning-700' },
    { label: 'Processing', value: stats.processingOrders, icon: Clock, color: 'bg-accent-100 text-accent-700' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle, color: 'bg-success-100 text-success-700' },
    { label: 'Cancelled', value: stats.cancelledOrders, icon: XCircle, color: 'bg-error-100 text-error-700' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-secondary-100 text-secondary-700' },
    { label: 'Products in Stock', value: stats.productsInStock, icon: Package, color: 'bg-primary-100 text-primary-700' },
    { label: 'Low Stock', value: stats.lowStockProducts, icon: AlertTriangle, color: 'bg-warning-100 text-warning-700' },
  ];

  if (loading) return <div className="animate-pulse h-96" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Dashboard Overview</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="card p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-secondary-600">{stat.label}</p>
            <p className="text-lg font-bold text-secondary-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold text-secondary-900 mb-4">Sales (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" stroke="#888" fontSize={12} />
            <YAxis stroke="#888" fontSize={12} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: any) => formatNaira(Number(v))} />
            <Bar dataKey="sales" fill="#c75a38" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-secondary-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? <p className="text-secondary-500 text-sm">No orders yet.</p> : recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between text-sm border-b border-secondary-50 pb-2">
                <div>
                  <p className="font-medium text-secondary-900">{order.order_number}</p>
                  <p className="text-secondary-500">{order.customer_name} - {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-700">{formatNaira(Number(order.total))}</p>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-secondary-900">Recent Payments</h2>
            <Link to="/admin/revenue" className="text-primary-600 text-sm font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPayments.length === 0 ? <p className="text-secondary-500 text-sm">No payments yet.</p> : recentPayments.map(tx => (
              <div key={tx.id} className="flex items-center justify-between text-sm border-b border-secondary-50 pb-2">
                <div>
                  <p className="font-medium text-secondary-900">{tx.reference}</p>
                  <p className="text-secondary-500">{formatDate(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-success-600">{formatNaira(Number(tx.amount))}</p>
                  <span className="badge-success">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
