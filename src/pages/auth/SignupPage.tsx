import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.full_name, phone: form.phone } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      // Create admin notification for new customer
      await supabase.from('notifications').insert({
        type: 'new_customer',
        title: 'New Customer Registration',
        message: `${form.full_name} (${form.email}) has registered.`,
        is_admin: true,
      });
      navigate('/account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-secondary-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-serif text-xl font-bold">E</span>
            </div>
            <span className="font-serif text-2xl font-bold text-secondary-900">{settings?.store_name || 'Elan Beauty'}</span>
          </Link>
          <h1 className="font-serif text-2xl font-bold text-secondary-900">Create Account</h1>
          <p className="text-secondary-600 text-sm mt-1">Join the Elan Beauty family</p>
        </div>

        <div className="card p-8">
          {error && <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10 pr-10" type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10" type={showPassword ? 'text' : 'password'} required value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="text-center text-sm text-secondary-600 mt-6">
            Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
