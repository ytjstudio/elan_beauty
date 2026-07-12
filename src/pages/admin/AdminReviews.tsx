import { useEffect, useState } from 'react';
import { Check, EyeOff, Trash2, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/format';
import type { Review } from '../../lib/types';

interface ReviewWithProduct extends Review {
  product_name?: string;
  customer_email?: string;
}

export function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    const allReviews = data as Review[] || [];
    // Fetch product names
    const productIds = [...new Set(allReviews.map(r => r.product_id))];
    const { data: products } = await supabase.from('products').select('id, name').in('id', productIds);
    const productMap = new Map((products || []).map((p: any) => [p.id, p.name]));
    setReviews(allReviews.map(r => ({ ...r, product_name: productMap.get(r.product_id) || 'Unknown' })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('reviews').update({ status }).eq('id', id);
    fetchReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    fetchReviews();
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.status === filter);

  if (loading) return <div className="animate-pulse h-64" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Reviews</h1>

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'hidden'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn text-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(review => (
          <div key={review.id} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-warning-400 text-warning-400' : 'text-secondary-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm text-secondary-500">{formatDate(review.created_at)}</span>
                  <span className={`badge ${
                    review.status === 'approved' ? 'badge-success' :
                    review.status === 'hidden' ? 'badge-secondary' : 'badge-warning'
                  }`}>{review.status}</span>
                </div>
                <p className="font-medium text-secondary-900">{review.product_name}</p>
              </div>
              <div className="flex gap-2">
                {review.status !== 'approved' && (
                  <button onClick={() => updateStatus(review.id, 'approved')} className="p-2 text-success-600 hover:bg-success-50 rounded-lg" title="Approve">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {review.status !== 'hidden' && (
                  <button onClick={() => updateStatus(review.id, 'hidden')} className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg" title="Hide">
                    <EyeOff className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(review.id)} className="p-2 text-error-500 hover:bg-error-50 rounded-lg" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {review.comment && <p className="text-secondary-700">{review.comment}</p>}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-secondary-500 py-8">No reviews found.</p>}
      </div>
    </div>
  );
}
