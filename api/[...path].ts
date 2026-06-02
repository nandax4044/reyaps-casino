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
      if (authError || !authData?.user) {
        console.log('[AUTH] getUser failed:', authError?.message);
        return null;
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.log('[AUTH] User query failed:', userError.message);
        return null;
      }
      
      if (!user) {
        console.log('[AUTH] User not found in database');
        return null;
      }
      
      return user;
    } catch (e: any) {
      console.error('[AUTH] Unexpected error:', e.message);
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
      try {
        if (!user) {
          return res.status(401).json({ error: 'User not authenticated' });
        }

        // Safely extract password
        const userObj = user as any;
        const { password: _, ...safeUser } = userObj;
        
        return res.json({ 
          user: safeUser || {}, 
          database: isSupabaseConfigured ? 'supabase' : 'mock_memory' 
        });
      } catch (profileError: any) {
        console.error('[PROFILE ERROR]', profileError);
        return res.status(500).json({ 
          error: 'Failed to get profile', 
          details: profileError?.message || 'Unknown error'
        });
      }
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

      // ==================== USER FISHING ROUTES ====================
      if (path.startsWith('/fishing/')) {
        // Check fishing access
        if (path === '/fishing/check-access' && method === 'GET') {
          if (isSupabaseConfigured && supabase) {
            try {
              const { data, error } = await supabase
                .from('afk_access')
                .select('*')
                .eq('user_id', user.id)
                .eq('feature', 'fishing')
                .eq('is_active', true)
                .gte('expires_at', new Date().toISOString())
                .order('expires_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (error) throw error;
              return res.json({ hasAccess: !!data, access: data || null });
            } catch (error: any) {
              console.error('[FISHING] Check access error:', error);
              return res.status(500).json({ error: 'Failed to check access' });
            }
          }

          return res.json({ hasAccess: false, access: null });
        }

        // Get user fishing inventory
        if (path === '/fishing/inventory' && method === 'GET') {
          if (isSupabaseConfigured && supabase) {
            try {
              const { data, error } = await supabase
                .from('user_fishing_inventory')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

              if (error) throw error;

              return res.json({
                inventory: data || {
                  user_id: user.id,
                  equipped_rod: null,
                  fishing_gems: 0,
                  fishing_saldo: 0,
                  total_fish_caught: 0,
                  bait_balance: 0
                }
              });
            } catch (error: any) {
              console.error('[FISHING] Get inventory error:', error);
              return res.status(500).json({ error: 'Failed to get inventory' });
            }
          }

          return res.json({
            inventory: {
              user_id: user.id,
              equipped_rod: null,
              fishing_gems: 0,
              fishing_saldo: 0,
              total_fish_caught: 0,
              bait_balance: 0
            }
          });
        }

        // Get user rods
        if (path === '/fishing/user-rods' && method === 'GET') {
          if (isSupabaseConfigured && supabaseAdmin) {
            try {
              const { data, error } = await supabaseAdmin
                .from('user_rod_access')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true);

              if (error) throw error;

              const rods = [
                {
                  rod_id: 'basic_rod',
                  rod_name: 'Basic Rod',
                  is_active: true,
                  granted_at: new Date().toISOString()
                },
                ...(data || []).map((r: any) => ({
                  rod_id: r.rod_id,
                  rod_name: r.rod_id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                  is_active: r.is_active,
                  granted_at: r.granted_at
                }))
              ];

              return res.json({ rods });
            } catch (error: any) {
              console.error('[FISHING] Get user rods error:', error);
              return res.status(500).json({ error: 'Failed to get user rods' });
            }
          }

          return res.json({ rods: [{ rod_id: 'basic_rod', rod_name: 'Basic Rod', is_active: true }] });
        }

        // AFK fishing status
        if (path === '/fishing/afk/status' && method === 'GET') {
          return res.json({
            isActive: false,
            message: 'AFK fishing status is unavailable in this deployment.'
          });
        }

        // Fishing logs
        if (path === '/fishing/logs' && method === 'GET') {
          if (isSupabaseConfigured && supabase) {
            try {
              const { data: fishRecords, error } = await supabase
                .from('fish_inventory')
                .select('*')
                .eq('user_id', user.id)
                .order('caught_at', { ascending: false })
                .limit(100);

              if (error) throw error;

              const logs = fishRecords || [];
              const totalCaught = logs.length;
              const totalSold = logs.filter((f: any) => f.is_sold).length;
              const totalUnsold = logs.filter((f: any) => !f.is_sold).length;
              const totalValue = logs.reduce((sum: number, f: any) => sum + (f.sell_price || 0), 0);

              const fishByType: Record<string, { count: number; totalLb: number; totalValue: number }> = {};
              logs.forEach((fish: any) => {
                if (!fishByType[fish.fish_name]) {
                  fishByType[fish.fish_name] = { count: 0, totalLb: 0, totalValue: 0 };
                }
                fishByType[fish.fish_name].count++;
                fishByType[fish.fish_name].totalLb += fish.lb || 0;
                fishByType[fish.fish_name].totalValue += fish.sell_price || 0;
              });

              return res.json({
                logs,
                statistics: {
                  totalCaught,
                  totalSold,
                  totalUnsold,
                  totalValue,
                  fishByType
                }
              });
            } catch (error: any) {
              console.error('[FISHING] Get logs error:', error);
              return res.status(500).json({ error: 'Failed to get fishing logs' });
            }
          }

          return res.json({
            logs: [],
            statistics: {
              totalCaught: 0,
              totalSold: 0,
              totalUnsold: 0,
              totalValue: 0,
              fishByType: {}
            }
          });
        }

        // Claim pending fish
        if (path === '/fishing/claim-pending' && method === 'POST') {
          return res.json({ success: true, claimed: [] });
        }

        // Start AFK fishing
        if (path === '/fishing/afk/start' && method === 'POST') {
          return res.json({ success: true, message: 'AFK fishing start is not available in this deployment.' });
        }

        // Stop AFK fishing
        if (path === '/fishing/afk/stop' && method === 'POST') {
          return res.json({ success: true, message: 'AFK fishing stop is not available in this deployment.' });
        }
      }

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

        // Get fishing rod access for a specific user
        if (path.startsWith('/admin/fishing/user-rods/') && method === 'GET') {
          const userId = path.split('/')[4];
          if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
          }

          if (isSupabaseConfigured && supabaseAdmin) {
            try {
              const { data, error } = await supabaseAdmin
                .from('user_rod_access')
                .select('*')
                .eq('user_id', userId);

              if (error) throw error;
              return res.json({ success: true, rods: data || [] });
            } catch (error: any) {
              console.error('[ADMIN] Get user rod access error:', error);
              return res.status(500).json({ error: 'Failed to get user rod access' });
            }
          }

          return res.json({ success: true, rods: [] });
        }

        // Grant rod access to a user
        if (path === '/admin/fishing/grant-rod' && method === 'POST') {
          const { user_id, rod_id, notes } = body;

          if (!user_id || !rod_id) {
            return res.status(400).json({ error: 'Missing required fields: user_id and rod_id' });
          }

          const validRods = ['ez_rod', 'basic_rod', 'lico_rod', 'golden_rod', 'thanksgiving_rod'];
          if (!validRods.includes(rod_id)) {
            return res.status(400).json({ error: 'Invalid rod_id. Valid rods: ez_rod, basic_rod, lico_rod, golden_rod, thanksgiving_rod' });
          }

          if (isSupabaseConfigured && supabaseAdmin) {
            try {
              const { data, error } = await supabaseAdmin
                .from('user_rod_access')
                .upsert(
                  {
                    user_id,
                    rod_id,
                    granted_by: user.id,
                    granted_at: new Date().toISOString(),
                    is_active: true,
                    notes
                  },
                  { onConflict: 'user_id,rod_id' }
                )
                .select()
                .single();

              if (error) {
                console.error('[ADMIN] Grant rod access error:', error);
                return res.status(500).json({ error: error.message || 'Failed to grant rod access' });
              }

              return res.json({ success: true, rod: data });
            } catch (error: any) {
              console.error('[ADMIN] Grant rod access error:', error);
              return res.status(500).json({ error: error.message || 'Failed to grant rod access' });
            }
          }

          return res.json({ success: true, rod: null });
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
    console.error('[API ERROR]', {
      path: path,
      method: method,
      message: error?.message,
      stack: error?.stack,
      error: error
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error',
      path: path,
      method: method
    });
  }
}
