import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Save, HelpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { FAQ } from '../../lib/types';

export function AdminFAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: '0' });

  useEffect(() => { fetchFAQs(); }, []);

  const fetchFAQs = async () => {
    const { data } = await supabase.from('faqs').select('*').order('sort_order');
    setFaqs(data as FAQ[] || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { question: form.question, answer: form.answer, sort_order: parseInt(form.sort_order) || 0 };
    if (editing) {
      await supabase.from('faqs').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('faqs').insert(payload);
    }
    setForm({ question: '', answer: '', sort_order: '0' });
    setEditing(null);
    setShowForm(false);
    fetchFAQs();
  };

  const handleEdit = (faq: FAQ) => {
    setEditing(faq);
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order.toString() });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return;
    await supabase.from('faqs').delete().eq('id', id);
    fetchFAQs();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">FAQ Management</h1>
        <button onClick={() => { setEditing(null); setForm({ question: '', answer: '', sort_order: '0' }); setShowForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-down">
          <div><label className="label">Question *</label><input className="input" required value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} /></div>
          <div><label className="label">Answer *</label><textarea className="input min-h-[100px]" required value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} /></div>
          <div><label className="label">Sort Order</label><input className="input" type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: e.target.value })} /></div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {faqs.map(faq => (
          <div key={faq.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-secondary-900">{faq.question}</h3>
                <p className="text-secondary-700 mt-1">{faq.answer}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleEdit(faq)} className="p-2 text-secondary-600 hover:text-primary-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(faq.id)} className="p-2 text-error-500 hover:text-error-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <div className="text-center py-12"><HelpCircle className="w-10 h-10 text-secondary-300 mx-auto mb-2" /><p className="text-secondary-500">No FAQs yet.</p></div>}
      </div>
    </div>
  );
}
