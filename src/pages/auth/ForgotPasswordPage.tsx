import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export function ForgotPasswordPage() {
  const { settings } = useSettings();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
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
          <h1 className="font-serif text-2xl font-bold text-secondary-900">Forgot Password</h1>
          <p className="text-secondary-600 text-sm mt-1">Enter your email to reset your password</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-4" />
              <p className="text-secondary-700 mb-6">Password reset instructions have been sent to your email.</p>
              <Link to="/login" className="btn-outline inline-flex"><ArrowLeft className="w-4 h-4" /> Back to Login</Link>
            </div>
          ) : (
            <>
              {error && <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input className="input pl-10" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-secondary-600 mt-6">
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Back to Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
