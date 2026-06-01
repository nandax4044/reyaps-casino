import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Password Hash
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Local Memory Fallback
const localDb = {
  users: [
    {
      id: 'f8ea2b02-cd12-4017-bfbe-0df39a67c5e5',
      email: 'admin@staff.com',
      username: 'admin',
      password: hashPassword('admin123'),
      balance: 1000.00,
      is_staff: true,
      created_at: new Date().toISOString()
    }
  ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { loginKey, password } = req.body;

    if (!loginKey || !password) {
      return res.status(400).json({ error: 'Email/Username dan Password wajib diisi!' });
    }

    const slugKey = loginKey.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        let loginEmail = slugKey;

        // If not an email, look up username
        if (!slugKey.includes('@')) {
          const { data: foundUser, error: findError } = await supabase
            .from('users')
            .select('email')
            .eq('username', slugKey)
            .maybeSingle();

          if (findError) {
            return res.status(500).json({ 
              error: 'Terjadi kesalahan saat mencari akun.',
              details: findError.message 
            });
          }
          
          if (!foundUser) {
            return res.status(400).json({ error: 'Username tidak ditemukan!' });
          }

          loginEmail = foundUser.email;
        }

        const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: password
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            return res.status(400).json({ error: 'Email/Username atau Password salah!' });
          }
          return res.status(400).json({ error: 'Login gagal: ' + signInError.message });
        }

        if (!sessionData?.user || !sessionData?.session) {
          return res.status(400).json({ error: 'Login gagal. Tidak ada sesi yang dibuat.' });
        }

        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.user.id)
          .single();

        if (userError || !user) {
          return res.status(500).json({ 
            error: 'Profil user tidak ditemukan!',
            details: userError?.message 
          });
        }

        const { password: _, ...safeUser } = user as any;
        return res.json({
          success: true,
          user: safeUser,
          token: sessionData.session.access_token
        });

      } catch (e: any) {
        return res.status(500).json({ 
          error: 'Terjadi kesalahan pada database: ' + e.message
        });
      }
    } else {
      // Local memory mode
      const user = localDb.users.find(u => u.email === slugKey || u.username === slugKey);
      if (!user) {
        return res.status(400).json({ error: 'Akun tidak terdaftar!' });
      }

      if (user.password !== hashPassword(password)) {
        return res.status(400).json({ error: 'Password yang diinput salah!' });
      }

      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser, token: user.id });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Terjadi kesalahan sistem: ' + error.message
    });
  }
}
