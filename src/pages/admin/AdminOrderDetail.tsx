import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatNaira, formatDateTime } from '../../lib/format';
import type { Order, OrderItem } from '../../lib/types';

const STATUS_OPTIONS = [
  { value: 'placed', label: 'Order Placed' },
  { value: 'confirmed', label: 'Payment Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
      setOrder(data as Order | null);
      if (data) {
        const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', id);
        setItems(itemsData as OrderItem[] || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    await supabase.from('orders').update({ order_status: status, updated_at: new Date().toISOString() }).eq('id', id);
    setOrder(prev => prev ? { ...prev, order_status: status as Order['order_status'] } : null);

    // Notify customer
    if (order?.user_id) {
      const statusLabel = STATUS_OPTIONS.find(s => s.value === status)?.label || status;
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        type: 'order_status',
        title: 'Order Status Updated',
        message: `Your order ${order.order_number} is now: ${statusLabel}`,
      });
    }
    setUpdating(false);
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="animate-pulse h-64" />;
  if (!order) return <div className="text-center py-20"><p>Order not found.</p></div>;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/admin/orders')} className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <button onClick={handlePrint} className="btn-outline"><Printer className="w-4 h-4" /> Print Invoice</button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
          <Package className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-secondary-900">{order.order_number}</h1>
          <p className="text-secondary-500 text-sm">{formatDateTime(order.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card p-6">
            <h2 className="font-serif text-lg font-bold mb-4">Products Ordered</h2>
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center pb-3 border-b border-secondary-50 last:border-0">
                  {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-14 h-14 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900">{item.product_name}</p>
                    <p className="text-sm text-secondary-500">{item.quantity} x {formatNaira(Number(item.price))}</p>
                  </div>
                  <p className="font-bold">{formatNaira(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-secondary-100 mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-secondary-600">Subtotal</span><span>{formatNaira(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-secondary-600">Shipping</span><span>{formatNaira(Number(order.shipping_fee))}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatNaira(Number(order.discount))}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2"><span>Total</span><span className="text-primary-700">{formatNaira(Number(order.total))}</span></div>
            </div>
          </div>

          {/* Delivery info */}
          <div className="card p-6">
            <h2 className="font-serif text-lg font-bold mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-secondary-500">Customer Name</p><p className="font-medium">{order.customer_name}</p></div>
              <div><p className="text-secondary-500">Phone Number</p><p className="font-medium">{order.customer_phone}</p></div>
              <div><p className="text-secondary-500">Email</p><p className="font-medium">{order.customer_email}</p></div>
              <div><p className="text-secondary-500">State</p><p className="font-medium">{order.state}</p></div>
              <div><p className="text-secondary-500">Town/Area</p><p className="font-medium">{order.town}</p></div>
              <div className="sm:col-span-2"><p className="text-secondary-500">Full Address</p><p className="font-medium">{order.address}</p></div>
              {order.merchant_note && <div className="sm:col-span-2"><p className="text-secondary-500">Merchant Note</p><p className="font-medium text-accent-700 bg-accent-50 px-3 py-2 rounded-lg mt-1">{order.merchant_note}</p></div>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status management */}
          <div className="card p-6">
            <h2 className="font-serif text-lg font-bold mb-4">Order Status</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-secondary-600">Payment</span>
                <span className={`badge ${order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{order.payment_status}</span>
              </div>
              {order.payment_date && <div className="flex items-center justify-between text-sm mb-3"><span className="text-secondary-600">Payment Date</span><span className="text-secondary-700">{formatDateTime(order.payment_date)}</span></div>}
              <label className="label">Update Status</label>
              <select
                className="input"
                value={order.order_status}
                onChange={e => updateStatus(e.target.value)}
                disabled={updating}
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="flex flex-wrap gap-2 mt-3">
                <button onClick={() => updateStatus('processing')} disabled={updating} className="btn-secondary text-xs px-3 py-1.5">Mark Processing</button>
                <button onClick={() => updateStatus('shipped')} disabled={updating} className="btn-secondary text-xs px-3 py-1.5">Mark Shipped</button>
                <button onClick={() => updateStatus('delivered')} disabled={updating} className="btn-secondary text-xs px-3 py-1.5">Mark Delivered</button>
                <button onClick={() => updateStatus('cancelled')} disabled={updating} className="btn-outline text-xs px-3 py-1.5 text-error-600 border-error-200">Cancel Order</button>
              </div>
            </div>
          </div>

          {/* Payment info */}
          {order.payment_reference && (
            <div className="card p-6">
              <h2 className="font-serif text-lg font-bold mb-4">Payment Details</h2>
              <div className="text-sm space-y-2">
                <div><p className="text-secondary-500">Reference</p><p className="font-mono text-xs">{order.payment_reference}</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
