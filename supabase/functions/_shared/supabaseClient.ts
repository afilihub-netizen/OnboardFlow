// Deno edge: supabase-js v2
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.2';

export function getSupabase(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!; // service role (edge only)
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  // opcional: recuperar user_id do JWT do cliente (se enviar Authorization Bearer)
  const authHeader = req.headers.get('authorization') ?? '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  return { client, jwt };
}