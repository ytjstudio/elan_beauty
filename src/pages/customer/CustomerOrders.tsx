import { useEffect, useState } from 'react';
import { Package, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatNaira, formatDate } from '../../lib/format';
import type { Order } from '../../lib/types';

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Payment Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function CustomerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setOrders(data as Order[] || []);
    });
  }, [user]);

  if (orders.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Package className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
        <h2 className="font-serif text-xl font-bold text-secondary-900 mb-2">No Orders Yet</h2>
        <p className="text-secondary-600">You haven't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-secondary-900 mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-secondary-900">{order.order_number}</p>
                  <p className="text-sm text-secondary-500">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-primary-700">{formatNaira(Number(order.total))}</p>
                  <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status}</span>
                </div>
                <ChevronRight className={`w-5 h-5 text-secondary-400 transition-transform ${expanded === order.id ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {expanded === order.id && (
              <div className="border-t border-secondary-100 p-4 animate-slide-down">
                {/* Order tracking */}
                {order.order_status !== 'cancelled' ? (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      {STATUS_STEPS.map((step, i) => {
                        const currentIdx = STATUS_STEPS.indexOf(order.order_status);
                        const isComplete = i <= currentIdx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isComplete ? 'bg-primary-600 text-white' : 'bg-secondary-200 text-secondary-500'
                            }`}>
                              {i + 1}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-1 mx-1 rounded ${isComplete && i < currentIdx ? 'bg-primary-600' : 'bg-secondary-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-secondary-600">
                      {STATUS_STEPS.map(step => <span key={step} className="flex-1 text-center">{STATUS_LABELS[step]}</span>)}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <span className="badge-error">Order Cancelled</span>
                  </div>
                )}

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex gap-3 items-center text-sm">
                      {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded object-cover" />}
                      <div className="flex-1">
                        <p className="font-medium text-secondary-900">{item.product_name}</p>
                        <p className="text-secondary-500">Qty: {item.quantity} x {formatNaira(Number(item.price))}</p>
                      </div>
                      <p className="font-medium">{formatNaira(Number(item.price) * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="border-t border-secondary-100 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-secondary-600">Subtotal</span><span>{formatNaira(Number(order.subtotal))}</span></div>
                  <div className="flex justify-between"><span className="text-secondary-600">Shipping</span><span>{formatNaira(Number(order.shipping_fee))}</span></div>
                  {Number(order.discount) > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatNaira(Number(order.discount))}</span></div>}
                  <div className="flex justify-between font-bold"><span>Total</span><span className="text-primary-700">{formatNaira(Number(order.total))}</span></div>
                </div>

                {/* Delivery info */}
                <div className="border-t border-secondary-100 pt-3 mt-3 text-sm">
                  <p className="text-secondary-600"><span className="font-medium text-secondary-900">Delivery to:</span> {order.address}, {order.town}, {order.state}</p>
                  {order.merchant_note && <p className="text-secondary-600 mt-1"><span className="font-medium text-secondary-900">Note:</span> {order.merchant_note}</p>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
