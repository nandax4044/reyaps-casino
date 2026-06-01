import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

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
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.log('[AUTH] Token validation error:', authError.message);
        return null;
      }
      
      if (!authData?.user) {
        console.log('[AUTH] No user data from token');
        return null;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !user) {
        console.log('[AUTH] User profile not found:', userError?.message);
        return null;
      }
      
      return user;
    } catch (e: any) {
      console.error('[AUTH] Exception:', e.message);
      return null;
    }
  } else {
    return localDb.users.find(u => u.id === token) || null;
  }
}

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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    // Check authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }

    // Return user profile
    const { password: _, ...safeUser } = user as any;
    return res.json({ 
      user: safeUser, 
      database: isSupabaseConfigured ? 'supabase' : 'mock_memory' 
    });

  } catch (error: any) {
    console.error('[PROFILE] Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem: ' + error.message });
  }
}
