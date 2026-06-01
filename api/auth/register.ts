import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Supabase Setup
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

// Password Hash
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Local Memory Fallback
const localDb = {
  users: [] as any[]
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
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, Username, dan Password wajib diisi!' });
    }

    const slugEmail = email.trim().toLowerCase();
    const slugUsername = username.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        // Check duplicate username
        const { data: existingUsername } = await supabase
          .from('users')
          .select('id')
          .eq('username', slugUsername)
          .maybeSingle();

        if (existingUsername) {
          return res.status(400).json({ error: 'Username sudah digunakan!' });
        }

        // Sign up
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: slugEmail,
          password: password,
          options: { data: { username: slugUsername } }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            return res.status(400).json({ error: 'Email sudah terdaftar!' });
          }
          return res.status(400).json({ error: authError.message });
        }

        if (!authData?.user) {
          return res.status(500).json({ error: 'Gagal membuat akun. Coba lagi.' });
        }

        const authUserId = authData.user.id;
        const sessionToken = authData.session?.access_token || null;

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if trigger created profile
        const { data: triggerUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUserId)
          .maybeSingle();

        if (triggerUser) {
          const patchClient = supabaseAdmin || supabase;
          await patchClient.from('users').update({ username: slugUsername }).eq('id', authUserId);
          const merged = { ...triggerUser, username: slugUsername };
          const token = sessionToken
            || (await supabase.auth.signInWithPassword({ email: slugEmail, password })).data?.session?.access_token
            || authUserId;
          const { password: _, ...safeUser } = merged as any;
          return res.json({ success: true, user: safeUser, token });
        }

        // Manual insert if trigger didn't fire
        const insertClient = sessionToken
          ? createClient(supabaseUrl, supabaseKey, {
              global: { headers: { Authorization: `Bearer ${sessionToken}` } },
              auth: { autoRefreshToken: false, persistSession: false }
            })
          : supabase;

        const { data: manualUser, error: manualError } = await insertClient
          .from('users')
          .insert({
            id: authUserId,
            email: slugEmail,
            username: slugUsername,
            balance: 0.00,
            is_staff: false
          })
          .select('*')
          .single();

        if (manualError) {
          return res.status(500).json({ error: 'Akun dibuat tapi profil gagal disimpan: ' + manualError.message });
        }

        const token = sessionToken
          || (await supabase.auth.signInWithPassword({ email: slugEmail, password })).data?.session?.access_token
          || authUserId;
        const { password: _, ...safeManualUser } = manualUser as any;
        return res.json({ success: true, user: safeManualUser, token });

      } catch (e: any) {
        return res.status(500).json({ error: e.message || 'Server error' });
      }
    } else {
      // Local memory fallback
      const duplicate = localDb.users.find(u => u.email === slugEmail || u.username === slugUsername);
      if (duplicate) {
        return res.status(400).json({ error: 'Email atau Username sudah terdaftar!' });
      }

      const newUser = {
        id: crypto.randomUUID(),
        email: slugEmail,
        username: slugUsername,
        password: hashPassword(password),
        balance: 0.00,
        is_staff: false,
        created_at: new Date().toISOString()
      };

      localDb.users.push(newUser);
      const { password: _, ...safeUser } = newUser;
      return res.json({ success: true, user: safeUser, token: newUser.id });
    }
  } catch (error: any) {
    return res.status(500).json({ error: 'Terjadi kesalahan sistem: ' + error.message });
  }
}
