import { useParams, Link } from 'react-router-dom';
import { Check, Package, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatNaira } from '../../lib/format';
import type { Order } from '../../lib/types';

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('orders').select('*, order_items(*)').eq('order_number', orderNumber).maybeSingle().then(({ data }) => {
      setOrder(data as Order | null);
      setLoading(false);
    });
  }, [orderNumber]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mx-auto" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mx-auto mb-6">
        <Check className="w-10 h-10 text-success-600" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-secondary-900 mb-3">Order Confirmed!</h1>
      <p className="text-secondary-600 mb-2">Thank you for your purchase. Your order has been placed successfully.</p>
      <p className="text-secondary-900 font-medium mb-8">Order Number: <span className="text-primary-700">{orderNumber}</span></p>

      {order && (
        <div className="card p-6 text-left mb-8">
          <div className="flex justify-between mb-4">
            <span className="text-secondary-600">Total Amount</span>
            <span className="font-bold text-primary-700">{formatNaira(order.total)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-secondary-600">Payment Status</span>
            <span className={order.payment_status === 'paid' ? 'text-success-600 font-medium' : 'text-warning-600 font-medium'}>{order.payment_status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-600">Delivery To</span>
            <span className="text-secondary-900">{order.town}, {order.state}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-secondary-500 mb-8">
        <Package className="w-5 h-5" />
        <p className="text-sm">You will receive notifications as your order progresses.</p>
      </div>

      <div className="flex gap-4 justify-center">
        <Link to="/account/orders" className="btn-primary">Track Order <ArrowRight className="w-4 h-4" /></Link>
        <Link to="/shop" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}
