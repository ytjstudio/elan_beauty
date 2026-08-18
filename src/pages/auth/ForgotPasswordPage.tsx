import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../context/SettingsContext';

export function ResetPasswordPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The recovery link creates a session via detectSessionInUrl.
    // Wait for it to be available before allowing the user to submit.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
      } else {
        // No session means the link was invalid or expired
        setError('This password reset link is invalid or has expired. Please request a new one.');
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setLoading(false);
      setTimeout(() => {
        supabase.auth.signOut();
        navigate('/login', { replace: true });
      }, 3000);
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
          <h1 className="font-serif text-2xl font-bold text-secondary-900">Reset Password</h1>
          <p className="text-secondary-600 text-sm mt-1">Enter your new password</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-success-600 mx-auto mb-4" />
              <p className="text-secondary-700 mb-2">Your password has been updated successfully!</p>
              <p className="text-secondary-500 text-sm mb-6">Redirecting you to login...</p>
            </div>
          ) : error && !ready ? (
            <div className="text-center">
              <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
              <Link to="/forgot-password" className="btn-primary inline-flex">Request New Link</Link>
            </div>
          ) : (
            <>
              {error && <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      className="input pl-10"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                      className="input pl-10"
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading || !ready} className="btn-primary w-full">
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : 'Update Password'}
                </button>
              </form>
              <p className="text-center text-sm text-secondary-600 mt-6">
                <Link to="/login" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
