import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';


export function ContactPage() {
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send via edge function or email service
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl font-bold text-secondary-900 mb-3">Get in Touch</h1>
        <p className="text-secondary-600">We'd love to hear from you. Reach out with any questions or concerns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-secondary-900">Phone</h3>
                <p className="text-secondary-600">{settings?.contact_phone || '+234 800 000 0000'}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-secondary-900">Email</h3>
                <p className="text-secondary-600">{settings?.contact_email || 'hello@elanbeauty.com'}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-secondary-900">Address</h3>
                <p className="text-secondary-600">{settings?.store_address || 'Lagos, Nigeria'}</p>
              </div>
            </div>
          </div>

          {settings?.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-6 flex items-center gap-4 hover:shadow-lg transition-shadow bg-success-50"
            >
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-secondary-900">WhatsApp</h3>
                <p className="text-secondary-600">Chat with us instantly</p>
              </div>
            </a>
          )}
        </div>

        {/* Form */}
        <div className="card p-8">
          <h2 className="font-serif text-2xl font-bold text-secondary-900 mb-6">Send a Message</h2>
          {sent && (
            <div className="bg-success-50 text-success-700 px-4 py-3 rounded-lg mb-4">
              Message sent! We'll get back to you soon.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Subject *</label>
              <input className="input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <label className="label">Message *</label>
              <textarea className="input min-h-[150px]" required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
