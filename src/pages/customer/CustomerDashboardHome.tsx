import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, MapPin, Package, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatDate } from '../../lib/format';
import type { Order, Address } from '../../lib/types';

export function CustomerDashboardHome() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ordersRes, addrRes, wishRes] = await Promise.all([
        supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('addresses').select('*').eq('user_id', user.id),
        supabase.from('wishlist').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setOrders(ordersRes.data as Order[] || []);
      setAddresses(addrRes.data as Address[] || []);
      setWishlistCount(wishRes.count || 0);
      const paid = (ordersRes.data as Order[] || []).filter(o => o.payment_status === 'paid');
      setTotalSpent(paid.reduce((sum, o) => sum + Number(o.total), 0));
    })();
  }, [user]);

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, link: '/account/orders' },
    { label: 'Wishlist Items', value: wishlistCount, icon: Heart, link: '/account/wishlist' },
    { label: 'Saved Addresses', value: addresses.length, icon: MapPin, link: '/account/addresses' },
    { label: 'Total Spent', value: formatNaira(totalSpent), icon: ShoppingBag, link: '/account/orders' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-secondary-900">My Dashboard</h1>
        <p className="text-secondary-600 text-sm mt-1">Welcome back, {user?.user_metadata?.full_name || 'Customer'}!</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link key={i} to={stat.link} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-600">{stat.label}</p>
                <p className="text-xl font-bold text-secondary-900 mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-secondary-900">Recent Orders</h2>
          <Link to="/account/orders" className="text-primary-600 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="card p-8 text-center">
            <ShoppingBag className="w-10 h-10 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-600">No orders yet.</p>
            <Link to="/shop" className="btn-primary mt-4 inline-flex">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">{order.order_number}</p>
                  <p className="text-sm text-secondary-500">{formatDate(order.created_at)} - {order.order_status}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-700">{formatNaira(Number(order.total))}</p>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                    {order.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
