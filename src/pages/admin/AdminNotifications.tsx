import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateTime } from '../../lib/format';
import type { Notification } from '../../lib/types';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase.from('notifications').select('*').eq('is_admin', true).order('created_at', { ascending: false });
    setNotifications(data as Notification[] || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_admin', true).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (loading) return <div className="animate-pulse h-64" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-secondary-900">Notifications</h1>
        <button onClick={markAllRead} className="btn-outline"><Check className="w-4 h-4" /> Mark All Read</button>
      </div>

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`card p-4 flex items-start gap-3 ${!n.is_read ? 'border-l-4 border-l-primary-500' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-secondary-100' : 'bg-primary-100'}`}>
              <Bell className={`w-5 h-5 ${n.is_read ? 'text-secondary-400' : 'text-primary-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-secondary-900">{n.title}</p>
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary-500" />}
              </div>
              <p className="text-sm text-secondary-600 mt-0.5">{n.message}</p>
              <p className="text-xs text-secondary-400 mt-1">{formatDateTime(n.created_at)}</p>
            </div>
            {!n.is_read && (
              <button onClick={() => markAsRead(n.id)} className="p-2 text-secondary-500 hover:text-primary-600">
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && <div className="text-center py-12"><Bell className="w-10 h-10 text-secondary-300 mx-auto mb-2" /><p className="text-secondary-500">No notifications.</p></div>}
      </div>
    </div>
  );
}
