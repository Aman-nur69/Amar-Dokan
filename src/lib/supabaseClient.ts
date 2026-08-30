// ==============================================================================
// MudiDokan (মুদিদোকান) Supabase Client Layer
// Connects to Supabase Edge / PostgreSQL with offline fallback readiness
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-mudidokan.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY) &&
    import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder-mudidokan.supabase.co'
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
