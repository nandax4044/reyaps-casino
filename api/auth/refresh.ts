import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token diperlukan' });
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });

        if (error || !data?.session) {
          console.log('[REFRESH] Token refresh failed:', error?.message);
          return res.status(401).json({ error: 'Refresh token tidak valid atau sudah kadaluarsa' });
        }

        // Get user profile
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userError || !user) {
          return res.status(500).json({ error: 'Profil user tidak ditemukan' });
        }

        const { password: _, ...safeUser } = user as any;
        return res.json({
          success: true,
          user: safeUser,
          token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      } catch (e: any) {
        console.error('[REFRESH] Exception:', e);
        return res.status(500).json({ error: 'Gagal refresh token: ' + e.message });
      }
    } else {
      // Local memory mode - just return the same token
      return res.json({ success: true, token: refresh_token });
    }
  } catch (error: any) {
    console.error('[REFRESH] Outer Exception:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem: ' + error.message });
  }
}
