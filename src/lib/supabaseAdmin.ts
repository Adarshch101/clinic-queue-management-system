import { createClient } from '@supabase/supabase-js';

// Server-only Supabase client with the service-role key.
// NEVER import this file from client components — the service-role key
// bypasses Row Level Security and must stay server-side only.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey && process.env.NODE_ENV === 'production') {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
}

export const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;