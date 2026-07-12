import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Settings } from '../lib/types';
import { supabase } from '../lib/supabase';

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  refresh: () => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  refresh: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    setSettings(data as Settings | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
