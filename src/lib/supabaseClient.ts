// ==============================================================================
// MudiDokan (মুদিদোকান) Supabase Client Layer
// Connects to Supabase Edge / PostgreSQL with offline fallback readiness
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const sanitizeUrl = (raw?: string): string => {
  if (!raw) return 'https://placeholder-mudidokan.supabase.co';
  let cleaned = raw.trim();
  // Strip trailing /rest/v1 or trailing slashes if accidentally included
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  return cleaned;
};

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const rawAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
).trim();

const SUPABASE_URL = sanitizeUrl(rawUrl);
const SUPABASE_ANON_KEY = rawAnonKey || 'placeholder-anon-key';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(rawUrl) &&
    Boolean(rawAnonKey) &&
    SUPABASE_URL !== 'https://placeholder-mudidokan.supabase.co'
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
