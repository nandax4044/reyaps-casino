// Vercel Serverless Catch-All Handler
// Handles ALL /api/* endpoints in a single function (Vercel Hobby plan limit: 12 functions)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// Supabase config
const supabaseUrl = process.env.SUPABASE_URL || 'https://rwngqiakigebtwxohiri.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;
const supabaseAdmin = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// Helper functions
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Local fallback data
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

// Authenticate token and return user
async function authenticateToken(token: string): Promise<any | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData?.user) return null;

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !user) return null;
      return user;
    } catch (e) {
      return null;
    }
  } else {
    return localDb.users.find(u => u.id === token) || null;
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path from Vercel catch-all
  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? `/${pathSegments.join('/')}` : `/${pathSegments || ''}`;
  const method = req.method || 'GET';
  const body = req.body || {};

  console.log(`[API] ${method} ${path}`);

  try {
    // ==================== AUTH ROUTES (PUBLIC) ====================
    
    if (path === '/auth/register' && method === 'POST') {
      const { email, username, password } = body;
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, Username, dan Password wajib diisi!' });
      }

      const slugEmail = email.trim().toLowerCase();
      const slugUsername = username.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: existingUsername } = await supabase
            .from('users')
            .select('id')
            .eq('username', slugUsername)
            .maybeSingle();

          if (existingUsername) {
            return res.status(400).json({ error: 'Username sudah digunakan!' });
          }

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

          await new Promise(resolve => setTimeout(resolve, 800));

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
            return res.json({ success: true, user: safeUser, access_token: token, refresh_token: authData.session?.refresh_token });
          }

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
          return res.json({ success: true, user: safeManualUser, access_token: token, refresh_token: authData.session?.refresh_token });
        } catch (e: any) {
          return res.status(500).json({ error: e.message || 'Server error' });
        }
      } else {
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
          is_staff: slugUsername === 'admin',
          created_at: new Date().toISOString()
        };

        localDb.users.push(newUser);
        const { password: _, ...safeUser } = newUser;
        return res.json({ success: true, user: safeUser, access_token: newUser.id });
      }
    }

    if (path === '/auth/login' && method === 'POST') {
      const { loginKey, password } = body;

      if (!loginKey || !password) {
        return res.status(400).json({ error: 'Email/Username dan Password wajib diisi!' });
      }

      const slugKey = loginKey.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
        try {
          let loginEmail = slugKey;

          if (!slugKey.includes('@')) {
            const { data: foundUser, error: findError } = await supabase
              .from('users')
              .select('email')
              .eq('username', slugKey)
              .maybeSingle();

            if (findError) {
              return res.status(400).json({ error: 'Database error: ' + findError.message });
            }

            if (!foundUser) {
              return res.status(400).json({ 
                error: 'Akun tidak ditemukan! Pastikan username sudah terdaftar.' 
              });
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
            return res.status(400).json({ error: signInError.message });
          }

          if (!sessionData?.user || !sessionData?.session) {
            return res.status(400).json({ error: 'Login gagal. Coba lagi.' });
          }

          const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.user.id)
            .single();

          if (userError || !user) {
            return res.status(400).json({ error: 'Profil user tidak ditemukan!' });
          }

          const { password: _, ...safeUser } = user as any;
          return res.json({
            success: true,
            user: safeUser,
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token
          });
        } catch (e: any) {
          return res.status(500).json({ error: 'Database service failure: ' + e.message });
        }
      } else {
        const user = localDb.users.find(u => u.email === slugKey || u.username === slugKey);
        if (!user) {
          return res.status(400).json({ error: 'Akun tidak terdaftar!' });
        }

        if (user.password !== hashPassword(password)) {
          return res.status(400).json({ error: 'Password yang diinput salah!' });
        }

        const { password: _, ...safeUser } = user;
        return res.json({ success: true, user: safeUser, access_token: user.id });
      }
    }

    if (path === '/auth/refresh' && method === 'POST') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const oldToken = authHeader.split(' ')[1];

      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: oldToken
          });

          if (error || !data?.session) {
            return res.status(401).json({ 
              error: 'Token sudah kadaluarsa. Silakan login ulang.',
              needsLogin: true 
            });
          }

          return res.json({
            success: true,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        } catch (e: any) {
          return res.status(500).json({ error: 'Refresh failed: ' + e.message });
        }
      } else {
        return res.json({ success: true, access_token: oldToken });
      }
    }

    // ==================== PROTECTED ROUTES (REQUIRE AUTH) ====================

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }

    // User profile
    if (path === '/user/profile' && method === 'GET') {
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser, database: isSupabaseConfigured ? 'supabase' : 'mock_memory' });
    }

    // User inventory
    if (path === '/user/inventory' && method === 'GET') {
      if (isSupabaseConfigured && supabase) {
        const { data: items, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
          .order('obtained_at', { ascending: false });

        if (error) throw error;
        return res.json({ inventory: items });
      } else {
        return res.json({ inventory: [] });
      }
    }

    // Deduct balance
    if (path === '/user/deduct' && method === 'POST') {
      const { cost } = body;
      if (cost === undefined || cost < 0) {
        return res.status(400).json({ error: 'Harga spin tidak valid' });
      }

      const currentBalance = parseFloat(user.balance);
      if (currentBalance < cost) {
        return res.status(400).json({ error: 'Saldo Anda tidak mencukupi untuk bermain!' });
      }

      const newBalance = currentBalance - cost;

      if (isSupabaseConfigured && supabase) {
        const { data: updatedUser, error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', user.id)
          .select('balance')
          .single();

        if (error) throw error;
        return res.json({ success: true, balance: updatedUser.balance });
      } else {
        const userInDb = localDb.users.find(u => u.id === user.id);
        if (userInDb) {
          userInDb.balance = newBalance;
          return res.json({ success: true, balance: newBalance });
        }
        return res.status(404).json({ error: 'User not found' });
      }
    }

    // Add win
    if (path === '/user/add-win' && method === 'POST') {
      const { name, rarity, value, icon, image, addedBalance, deductAmount } = body;
      let finalBalance = parseFloat(user.balance);

      if (deductAmount && deductAmount > 0) {
        if (finalBalance < deductAmount) {
          return res.status(400).json({ error: 'Saldo tidak mencukupi!' });
        }
        finalBalance -= deductAmount;
      }

      if (addedBalance && addedBalance > 0) {
        finalBalance += parseFloat(addedBalance);
      }

      if (isSupabaseConfigured && supabase) {
        let invItem = null;
        if (name) {
          const { data, error } = await supabase
            .from('inventory')
            .insert({ 
              user_id: user.id, 
              item_name: name, 
              rarity: rarity || 'Common', 
              value: value || 0, 
              icon: icon || '🎁', 
              image: image || '', 
              status: 'available' 
            })
            .select('*')
            .single();
          if (error) throw error;
          invItem = data;
        }

        const { data: updatedUser, error: balError } = await supabase
          .from('users')
          .update({ balance: finalBalance })
          .eq('id', user.id)
          .select('balance')
          .single();

        if (balError) throw balError;
        return res.json({ success: true, inventoryItem: invItem, balance: updatedUser.balance });
      } else {
        const userInDb = localDb.users.find(u => u.id === user.id);
        if (userInDb) userInDb.balance = finalBalance;
        return res.json({ success: true, inventoryItem: null, balance: finalBalance });
      }
    }

    // ==================== ADMIN ROUTES ====================

    if (path.startsWith('/admin/')) {
      if (!user.is_staff) {
        return res.status(403).json({ error: 'Akses Ditolak: Anda bukan staff/admin!' });
      }

      // Get all users
      if (path === '/admin/users' && method === 'GET') {
        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: list, error } = await supabaseAdmin
            .from('users')
            .select('id, email, username, balance, is_staff, created_at')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return res.json({ users: list });
        } else {
          return res.json({ users: localDb.users.map(({ password, ...u }) => u).reverse() });
        }
      }

      // Update balance
      if (path.match(/\/admin\/users\/[^/]+\/balance/) && method === 'POST') {
        const userId = path.split('/')[3];
        const cleanBalance = parseFloat(body.balance);

        if (isNaN(cleanBalance)) {
          return res.status(400).json({ error: 'Saldo tidak valid!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: updated, error } = await supabaseAdmin
            .from('users')
            .update({ balance: cleanBalance })
            .eq('id', userId)
            .select('*')
            .single();

          if (error) throw error;
          return res.json({ success: true, user: updated });
        } else {
          const targetUser = localDb.users.find(u => u.id === userId);
          if (!targetUser) return res.status(404).json({ error: 'User tidak ditemukan' });
          targetUser.balance = cleanBalance;
          return res.json({ success: true, user: targetUser });
        }
      }

      // Admin fishing routes
      if (path.startsWith('/admin/fishing/')) {
        // Grant fishing access
        if (path === '/admin/fishing/grant-access' && method === 'POST') {
          const { user_id, duration_days } = body;

          if (!user_id || !duration_days) {
            return res.status(400).json({ error: 'Missing required fields: user_id and duration_days' });
          }

          if (isSupabaseConfigured && supabaseAdmin) {
            try {
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + duration_days);

              const { data: userExists, error: userError } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('id', user_id)
                .single();

              if (userError || !userExists) {
                return res.status(400).json({ error: 'User not found' });
              }

              const { data, error } = await supabaseAdmin
                .from('afk_access')
                .upsert(
                  {
                    user_id,
                    feature: 'fishing',
                    is_active: true,
                    expires_at: expiresAt.toISOString(),
                    granted_by: user.id,
                    granted_at: new Date().toISOString(),
                    notes: `${duration_days} days access`
                  },
                  { onConflict: 'user_id,feature' }
                )
                .select()
                .single();

              if (error) {
                console.error('[ADMIN] Grant fishing access error:', error);
                return res.status(500).json({ error: error.message || 'Failed to grant access' });
              }

              return res.json({ success: true, access: data });
            } catch (error: any) {
              console.error('[ADMIN] Grant fishing access error:', error);
              return res.status(500).json({ error: error.message || 'Failed to grant access' });
            }
          }

          return res.json({ success: true, access: null });
        }

        // Get fishing access list
        if (path === '/admin/fishing/access-list' && method === 'GET') {
          if (isSupabaseConfigured && supabaseAdmin) {
            try {
              const { data, error } = await supabaseAdmin
                .from('afk_access')
                .select('*')
                .eq('feature', 'fishing')
                .order('granted_at', { ascending: false });

              if (error) throw error;
              return res.json({ success: true, access: data || [] });
            } catch (error: any) {
              console.error('[ADMIN] Get fishing access list error:', error);
              return res.status(500).json({ error: 'Failed to get access list' });
            }
          }

          return res.json({ success: true, access: [] });
        }
      }
    }

    // ==================== PUBLIC ROUTES ====================

    // Game configs
    if (path.startsWith('/games/config/') && method === 'GET') {
      const gameType = path.split('/').pop();
      
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('game_configs')
            .select('config_data')
            .eq('game_type', gameType);

          if (!error && data && data.length > 0) {
            const config = data[0].config_data;
            if (config.cases && !config.chests) {
              config.chests = config.cases;
              delete config.cases;
            }
            return res.json(config);
          }
        } catch (e: any) {
          console.log(`[CONFIG] Error for ${gameType}:`, e.message);
        }
      }

      // Return minimal fallback configs
      if (gameType === 'cases') {
        return res.json({ chests: [], gameSettings: {} });
      }
      if (gameType === 'crash') {
        return res.json({ crashSettings: {}, prizes: [], leaderboard: [] });
      }
      return res.status(404).json({ error: 'Config type unknown' });
    }

    // Online users
    if (path === '/users/online' && method === 'GET') {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('users')
          .select('username, is_staff')
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          return res.json({ users: data.map((u: any) => ({ username: u.username, isStaff: u.is_staff })) });
        }
      }
      return res.json({ users: localDb.users.map(u => ({ username: u.username, isStaff: u.is_staff })) });
    }

    // Chat messages
    if (path === '/chat/messages' && method === 'GET') {
      return res.json({ messages: [] });
    }

    // 404 for unknown routes
    return res.status(404).json({ 
      error: 'Endpoint not found',
      path: path,
      method: method
    });

  } catch (error: any) {
    console.error('[API ERROR]', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
