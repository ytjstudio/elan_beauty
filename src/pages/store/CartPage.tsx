import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatNaira, getEffectivePrice } from '../../lib/format';

export function CartPage() {
  const { items, removeFromCart, updateQuantity, subtotal, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center animate-fade-in">
        <ShoppingBag className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
        <h1 className="font-serif text-2xl font-bold text-secondary-900 mb-2">Your cart is empty</h1>
        <p className="text-secondary-600 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/shop" className="btn-primary">Start Shopping <ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="font-serif text-3xl font-bold text-secondary-900 mb-8">Shopping Cart ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product.id} className="card p-4 flex gap-4">
              <Link to={`/product/${item.product.slug}`} className="flex-shrink-0">
                <img
                  src={item.product.images[0] || 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=200'}
                  alt={item.product.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.product.slug}`} className="font-serif text-lg font-semibold text-secondary-900 hover:text-primary-600 transition-colors">
                  {item.product.name}
                </Link>
                <p className="text-primary-700 font-bold mt-1">{formatNaira(getEffectivePrice(item.product))}</p>
                {item.product.stock < item.quantity && (
                  <p className="text-error-600 text-sm mt-1">Only {item.product.stock} available</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-secondary-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-2 hover:bg-secondary-100 rounded-l-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-2 hover:bg-secondary-100 rounded-r-lg transition-colors"
                      disabled={item.quantity >= item.product.stock}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-error-500 hover:text-error-700 p-2 transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-secondary-900">{formatNaira(getEffectivePrice(item.product) * item.quantity)}</p>
              </div>
            </div>
          ))}
          <Link to="/shop" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium">
            <ArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-secondary-900 mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-secondary-600">Subtotal</span>
                <span className="font-medium">{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary-600">Shipping</span>
                <span className="text-secondary-500">Calculated at checkout</span>
              </div>
              <div className="border-t border-secondary-100 pt-3 flex justify-between">
                <span className="font-bold text-secondary-900">Total</span>
                <span className="font-bold text-primary-700 text-lg">{formatNaira(subtotal)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-6">
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
