import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Tag, X, AlertCircle, Lock, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { supabase } from '../../lib/supabase';
import { formatNaira, getEffectivePrice } from '../../lib/format';
import type { ShippingLocation, Coupon } from '../../lib/types';

declare global { interface Window { PaystackPop: any } }

function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) {
      // Script tag exists but PaystackPop not set yet — poll until ready
      const poll = setInterval(() => {
        if (window.PaystackPop) { clearInterval(poll); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(poll); reject(new Error('Paystack timed out')); }, 10000);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => {
      const poll = setInterval(() => {
        if (window.PaystackPop) { clearInterval(poll); resolve(); }
      }, 50);
      setTimeout(() => { clearInterval(poll); reject(new Error('Paystack timed out')); }, 10000);
    };
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.head.appendChild(script);
  });
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [shippingLocations, setShippingLocations] = useState<ShippingLocation[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [towns, setTowns] = useState<ShippingLocation[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedTownId, setSelectedTownId] = useState('');
  const [shippingFee, setShippingFee] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [form, setForm] = useState({
    full_name: user?.user_metadata?.full_name || '',
    phone: user?.user_metadata?.phone || '',
    email: user?.email || '',
    address: '',
    merchant_note: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('shipping_locations').select('*').eq('enabled', true).then(({ data }) => {
      const locs = data as ShippingLocation[] || [];
      setShippingLocations(locs);
      setStates([...new Set(locs.map(l => l.state))].sort());
    });
  }, []);

  useEffect(() => {
    if (selectedState) {
      setTowns(shippingLocations.filter(l => l.state === selectedState));
      setSelectedTownId('');
      setShippingFee(0);
    }
  }, [selectedState, shippingLocations]);

  useEffect(() => {
    if (selectedTownId) {
      const town = towns.find(t => t.id === selectedTownId);
      setShippingFee(town?.price || 0);
    }
  }, [selectedTownId, towns]);

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-secondary-600 text-lg mb-4">Your cart is empty.</p>
        <Link to="/shop" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  const discount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'percentage') return (subtotal * appliedCoupon.value) / 100;
    if (appliedCoupon.type === 'fixed') return Math.min(appliedCoupon.value, subtotal);
    return 0;
  })();
  const freeShipping = appliedCoupon?.type === 'free_shipping';
  const effectiveShippingFee = freeShipping ? 0 : shippingFee;
  const total = subtotal - discount + effectiveShippingFee;
  const paystackReady = !!settings.paystack_public_key;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError('');
    const { data } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('enabled', true).maybeSingle();
    const coupon = data as Coupon | null;
    if (!coupon) { setCouponError('Invalid coupon code'); return; }
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) { setCouponError('Coupon has expired'); return; }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) { setCouponError('Coupon usage limit reached'); return; }
    if (subtotal < coupon.min_purchase) { setCouponError(`Minimum purchase of ${formatNaira(coupon.min_purchase)} required`); return; }
    setAppliedCoupon(coupon);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.address.trim()) e.address = 'Delivery address is required';
    if (!selectedState) e.state = 'Please select your state';
    if (!selectedTownId) e.town = 'Please select your town/area';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    setPaymentError('');
    if (!validate()) return;
    if (!paystackReady) {
      setPaymentError('Payment is not configured. The store admin needs to add Paystack keys in Admin Settings before orders can be placed.');
      return;
    }

    setProcessing(true);

    try {
      await loadPaystackScript();
      const town = towns.find(t => t.id === selectedTownId);
      const orderNumber = `ELN-${Date.now().toString().slice(-8)}`;
      const reference = `ref_${orderNumber}_${Date.now()}`;

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: orderNumber,
        user_id: user?.id ?? null,
        customer_name: form.full_name,
        customer_email: form.email,
        customer_phone: form.phone,
        state: selectedState,
        town: town?.town || '',
        address: form.address,
        merchant_note: form.merchant_note || null,
        subtotal,
        shipping_fee: effectiveShippingFee,
        discount,
        total,
        coupon_code: appliedCoupon?.code || null,
        payment_status: 'pending',
        order_status: 'pending',
        payment_reference: reference,
      }).select().single();

      if (orderError || !order) {
        setProcessing(false);
        setPaymentError('Failed to create order: ' + (orderError?.message || 'Unknown error'));
        return;
      }

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_image: item.product.images[0] || null,
        price: getEffectivePrice(item.product),
        quantity: item.quantity,
      }));
      await supabase.from('order_items').insert(orderItems);

      if (appliedCoupon) {
        await supabase.from('coupons').update({ used_count: appliedCoupon.used_count + 1 }).eq('id', appliedCoupon.id);
      }

      const edgeFunctionItems = items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const handler = window.PaystackPop.setup({
        key: settings.paystack_public_key,
        email: form.email,
        amount: Math.round(total * 100),
        currency: 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            { display_name: 'Order Number', variable_name: 'order_number', value: orderNumber },
            { display_name: 'Customer Name', variable_name: 'customer_name', value: form.full_name },
          ],
        },
        callback: function(response: any) {
          supabase.functions.invoke('verify-payment', {
            body: { reference: response.reference, order_id: order.id, items: edgeFunctionItems },
          }).then(({ data: verifyData, error: verifyError }) => {
            if (verifyError || !verifyData || verifyData.status !== 'success') {
              setPaymentError('Payment verification failed. Please contact support with reference: ' + response.reference);
              setProcessing(false);
              return;
            }
            clearCart();
            navigate(`/order-confirmation/${orderNumber}`);
          }).catch(() => {
            setPaymentError('Payment verification failed. Please contact support with reference: ' + response.reference);
            setProcessing(false);
          });
        },
        onClose: () => {
          setProcessing(false);
        },
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      handler.openIframe();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPaymentError('Something went wrong initializing payment: ' + msg);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/cart" className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Cart
      </Link>
      <h1 className="font-serif text-3xl font-bold text-secondary-900 mb-8">Checkout</h1>

      {!paystackReady && (
        <div className="card p-4 mb-6 bg-warning-50 border-warning-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-warning-800">Payment is not configured</p>
            <p className="text-sm text-warning-700 mt-1">The store admin needs to add Paystack API keys in Admin Settings before orders can be placed. Checkout is disabled until this is done.</p>
          </div>
        </div>
      )}
      {paymentError && (
        <div className="card p-4 mb-6 bg-error-50 border-error-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-700">{paymentError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Delivery Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                {errors.full_name && <p className="text-error-600 text-xs mt-1">{errors.full_name}</p>}
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                {errors.phone && <p className="text-error-600 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Email Address *</label>
                <input className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                {errors.email && <p className="text-error-600 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="label">State *</label>
                <select className="input" value={selectedState} onChange={e => setSelectedState(e.target.value)}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <p className="text-error-600 text-xs mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="label">Town/Area *</label>
                <select
                  className="input"
                  value={selectedTownId}
                  onChange={e => setSelectedTownId(e.target.value)}
                  disabled={!selectedState}
                >
                  <option value="">Select Town/Area</option>
                  {towns.map(t => <option key={t.id} value={t.id}>{t.town} - {formatNaira(t.price)}</option>)}
                </select>
                {errors.town && <p className="text-error-600 text-xs mt-1">{errors.town}</p>}
                {selectedState && towns.length === 0 && (
                  <p className="text-warning-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> No delivery locations configured for this state. Please contact us before placing your order.
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Full Delivery Address *</label>
                <textarea className="input min-h-[80px]" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                {errors.address && <p className="text-error-600 text-xs mt-1">{errors.address}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Merchant Note (Optional)</label>
                <textarea
                  className="input min-h-[80px]"
                  placeholder="e.g. Call before delivery, leave with security, package as gift..."
                  value={form.merchant_note}
                  onChange={e => setForm({ ...form, merchant_note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-xl font-bold mb-4">Coupon Code</h2>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-success-50 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-success-600" />
                  <span className="text-success-700 font-medium">{appliedCoupon.code} applied!</span>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-error-500 hover:text-error-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    className="input pl-10"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                  />
                </div>
                <button onClick={applyCoupon} className="btn-secondary">Apply</button>
              </div>
            )}
            {couponError && <p className="text-error-600 text-xs mt-2">{couponError}</p>}
          </div>
        </div>

        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-secondary-900 mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3 text-sm">
                  {item.product.images[0] && <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 rounded object-cover" />}
                  <div className="flex-1">
                    <p className="font-medium text-secondary-900 line-clamp-1">{item.product.name}</p>
                    <p className="text-secondary-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{formatNaira(getEffectivePrice(item.product) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-secondary-100 pt-4">
              <div className="flex justify-between"><span className="text-secondary-600">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-success-600"><span>Discount</span><span>-{formatNaira(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-secondary-600">Shipping</span>
                {freeShipping ? <span className="text-success-600">FREE</span> :
                  shippingFee > 0 ? <span>{formatNaira(shippingFee)}</span> :
                  <span className="text-secondary-400">Select location</span>}
              </div>
              <div className="flex justify-between border-t border-secondary-100 pt-2">
                <span className="font-bold text-secondary-900">Total</span>
                <span className="font-bold text-primary-700 text-lg">{formatNaira(total)}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} disabled={processing || !selectedTownId || !paystackReady} className="btn-primary w-full mt-6">
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Lock className="w-4 h-4" /> Pay {formatNaira(total)}</>
              )}
            </button>
            {errors.submit && <p className="text-error-600 text-sm mt-2">{errors.submit}</p>}
            {!paystackReady && <p className="text-xs text-warning-600 mt-2 text-center">Payment not configured — checkout disabled</p>}
            <p className="text-xs text-secondary-500 mt-3 text-center flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secured by Paystack</p>
          </div>
        </div>
      </div>
    </div>
  );
}
