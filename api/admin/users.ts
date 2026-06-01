import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Local Memory Fallback
const localDb = {
  users: [
    {
      id: 'f8ea2b02-cd12-4017-bfbe-0df39a67c5e5',
      email: 'admin@staff.com',
      username: 'admin',
      balance: 1000.00,
      is_staff: true,
      created_at: new Date().toISOString()
    }
  ]
};

// Authentication Helper
async function authenticateToken(token: string) {
  if (isSupabaseConfigured && supabase) {
    try {
      // Deteksi JWT vs UUID
      const isJWT = token.length > 100 && token.startsWith('eyJ');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      
      let userId: string | null = null;
      
      if (isJWT) {
        // Verifikasi JWT via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authData?.user) {
          console.log('[AUTH] JWT validation failed:', authError?.message);
          return null;
        }
        userId = authData.user.id;
      } else if (isUUID) {
        // Token lama berupa UUID
        userId = token;
      } else {
        console.log('[AUTH] Invalid token format');
        return null;
      }

      // Ambil profil user dari public.users menggunakan admin client
      const dbClient = supabaseAdmin || supabase;
      const { data: user, error: userError } = await dbClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.log('[AUTH] User not found:', userId, userError?.message);
        return null;
      }
      
      return user;
    } catch (e: any) {
      console.error('[AUTH] Exception:', e.message);
      return null;
    }
  } else {
    // Local memory mode
    return localDb.users.find(u => u.id === token) || null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[ADMIN_USERS] No auth header');
      return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login kembali.' });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'undefined' || token === 'null') {
      console.log('[ADMIN_USERS] Invalid token');
      return res.status(401).json({ error: 'Token tidak valid. Silakan login kembali.' });
    }

    const user = await authenticateToken(token);
    
    if (!user) {
      console.log('[ADMIN_USERS] Authentication failed');
      return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
    }

    if (!user.is_staff) {
      console.log('[ADMIN_USERS] Not staff:', user.username);
      return res.status(403).json({ error: 'Akses Ditolak: Akun Anda tidak memiliki hak staff/admin!' });
    }

    console.log('[ADMIN_USERS] Authorized as staff:', user.username);

    // Get all users using admin client
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: users, error, count } = await supabaseAdmin
          .from('users')
          .select('id, username, email, balance, is_staff, created_at', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[ADMIN_USERS] DB Error:', error);
          throw error;
        }

        console.log('[ADMIN_USERS] Fetched', count, 'users');
        return res.json({ users: users || [] });
      } catch (e: any) {
        console.error('[ADMIN_USERS] Exception:', e);
        return res.status(500).json({ error: 'Database error: ' + e.message });
      }
    }

    // Local memory fallback
    const users = localDb.users.map(({ password, ...u }: any) => u);
    console.log('[ADMIN_USERS] Using local DB, count:', users.length);
    return res.json({ users });
  } catch (e: any) {
    console.error('[ADMIN_USERS] Handler Error:', e);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem: ' + e.message });
  }
}

