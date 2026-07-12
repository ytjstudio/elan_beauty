import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate(email === 'admin@elanbeauty.com' ? '/admin' : '/account');
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
          <h1 className="font-serif text-2xl font-bold text-secondary-900">Welcome Back</h1>
          <p className="text-secondary-600 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-8">
          {error && <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input className="input pl-10 pr-10" type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-primary-600" />
                <span className="text-sm text-secondary-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="text-center text-sm text-secondary-600 mt-6">
            Don't have an account? <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
