import { useEffect, useState } from 'react';
import { Save, Check, Store, RotateCcw, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';
import type { Settings } from '../../lib/types';

export function AdminSettings() {
  const { settings, refresh } = useSettings();
  const [form, setForm] = useState<Partial<Settings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', form.id);
    refresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!settings) return <div className="animate-pulse h-64" />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">Website Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2"><Store className="w-5 h-5" /> Store Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Store Name</label><input className="input" value={form.store_name || ''} onChange={e => setForm({ ...form, store_name: e.target.value })} /></div>
            <div><label className="label">Store Logo URL</label><input className="input" value={form.store_logo || ''} onChange={e => setForm({ ...form, store_logo: e.target.value })} /></div>
            <div><label className="label">Hero Banner URL</label><input className="input" value={form.hero_banner || ''} onChange={e => setForm({ ...form, hero_banner: e.target.value })} /></div>
            <div><label className="label">Hero Title</label><input className="input" value={form.hero_title || ''} onChange={e => setForm({ ...form, hero_title: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Hero Subtitle</label><input className="input" value={form.hero_subtitle || ''} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} /></div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Contact Email</label><input className="input" value={form.contact_email || ''} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><label className="label">Contact Phone</label><input className="input" value={form.contact_phone || ''} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="label">Store Address</label><input className="input" value={form.store_address || ''} onChange={e => setForm({ ...form, store_address: e.target.value })} /></div>
            <div><label className="label">WhatsApp Number</label><input className="input" value={form.whatsapp_number || ''} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} /></div>
          </div>
        </div>

        {/* Social */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Social Media Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="label">Instagram URL</label><input className="input" value={form.instagram_url || ''} onChange={e => setForm({ ...form, instagram_url: e.target.value })} /></div>
            <div><label className="label">Twitter/X URL</label><input className="input" value={form.twitter_url || ''} onChange={e => setForm({ ...form, twitter_url: e.target.value })} /></div>
            <div><label className="label">Facebook URL</label><input className="input" value={form.facebook_url || ''} onChange={e => setForm({ ...form, facebook_url: e.target.value })} /></div>
            <div><label className="label">TikTok URL</label><input className="input" value={form.tiktok_url || ''} onChange={e => setForm({ ...form, tiktok_url: e.target.value })} /></div>
          </div>
        </div>

        {/* Payment */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Paystack Configuration</h2>
          <div className="grid grid-cols-1 gap-4">
            <div><label className="label">Paystack Public Key</label><input className="input" value={form.paystack_public_key || ''} onChange={e => setForm({ ...form, paystack_public_key: e.target.value })} placeholder="pk_test_..." /></div>
            <div><label className="label">Paystack Secret Key</label><input className="input" value={form.paystack_secret_key || ''} onChange={e => setForm({ ...form, paystack_secret_key: e.target.value })} placeholder="sk_test_..." /></div>
          </div>
        </div>

        {/* Inventory */}
        <div className="card p-6 space-y-4">
          <h2 className="font-serif text-lg font-bold">Inventory Settings</h2>
          <div><label className="label">Low Stock Threshold</label><input className="input" type="number" value={form.low_stock_threshold || 5} onChange={e => setForm({ ...form, low_stock_threshold: parseInt(e.target.value) })} /></div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Settings'}</>}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="card p-6 space-y-4 border-red-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="font-serif text-lg font-bold text-red-600">Danger Zone</h2>
        </div>
        <p className="text-sm text-secondary-600">Permanently delete all orders and reset product statistics. This action cannot be undone.</p>
        <button
          onClick={async () => {
            if (!confirm('Are you sure? This will permanently delete ALL orders and reset product sales counts.')) return;
            setResetting(true);
            try {
              await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
              await supabase.from('products').update({ sales_count: 0 }).neq('id', '00000000-0000-0000-0000-000000000000');
              alert('All orders have been deleted and product stats reset.');
            } catch (e) {
              alert('Error: ' + (e as Error).message);
            }
            setResetting(false);
          }}
          disabled={resetting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {resetting ? 'Resetting...' : 'Reset All Orders'}
        </button>
      </div>
    </div>
  );
}
