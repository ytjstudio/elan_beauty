import { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Check, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function CustomerProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Password change
  const [pwd, setPwd] = useState({ new: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');

  // Account deletion
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    const { error } = await supabase.rpc('delete_own_account');
    if (error) {
      setDeleteError(error.message);
      setDeleting(false);
    } else {
      await signOut();
      navigate('/', { replace: true });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, phone },
    });
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    if (pwd.new !== pwd.confirm) { setPwdMsg('Passwords do not match'); return; }
    if (pwd.new.length < 6) { setPwdMsg('Password must be at least 6 characters'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwd.new });
    if (error) setPwdMsg(error.message);
    else { setPwdMsg('Password updated successfully!'); setPwd({ new: '', confirm: '' }); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-secondary-900">My Profile</h1>

      {/* Profile info */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold mb-4">Profile Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input pl-10" value={name} onChange={e => setName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Email (read-only)</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input pl-10 bg-secondary-50" value={user?.email || ''} disabled />
            </div>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input pl-10" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}</>}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <h2 className="font-serif text-lg font-bold mb-4">Change Password</h2>
        {pwdMsg && <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${pwdMsg.includes('success') ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>{pwdMsg}</div>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input pl-10" type="password" value={pwd.new} onChange={e => setPwd({ ...pwd, new: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input pl-10" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Update Password</button>
        </form>
      </div>

      {/* Delete account */}
      <div className="card p-6 border-red-200">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="font-serif text-lg font-bold text-red-600">Delete Account</h2>
        </div>
        <p className="text-sm text-secondary-600 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
        {deleteError && <div className="bg-error-50 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm">{deleteError}</div>}
        {!deleteConfirm ? (
          <button onClick={() => setDeleteConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete My Account
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 font-medium">Are you absolutely sure? This will permanently delete your account, orders, and wishlist.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount} disabled={deleting} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                <Trash2 className="w-4 h-4" /> {deleting ? 'Deleting...' : 'Yes, Delete Forever'}
              </button>
              <button onClick={() => { setDeleteConfirm(false); setDeleteError(''); }} className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
