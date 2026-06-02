// Vercel Serverless Catch-All Handler - FISHING FOCUSED
// Handles ALL /api/* endpoints in a single function
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

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

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? `/${pathSegments.join('/')}` : `/${pathSegments || ''}`;
  const method = req.method || 'GET';
  const body = req.body || {};

  try {
    // ==================== AUTH ROUTES ====================
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
            const { data: foundUser } = await supabase
              .from('users')
              .select('email')
              .eq('username', slugKey)
              .maybeSingle();

            if (foundUser) loginEmail = foundUser.email;
            else return res.status(400).json({ error: 'Akun tidak ditemukan!' });
          }

          const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password
          });

          if (signInError || !sessionData?.session) {
            return res.status(400).json({ error: 'Email/Username atau Password salah!' });
          }

          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.user.id)
            .single();

          if (!user) return res.status(400).json({ error: 'Profil user tidak ditemukan!' });

          const { password: _, ...safeUser } = user as any;
          return res.json({
            success: true,
            user: safeUser,
            access_token: sessionData.session.access_token,
            refresh_token: sessionData.session.refresh_token
          });
        } catch (e: any) {
          return res.status(500).json({ error: e.message });
        }
      } else {
        const user = localDb.users.find(u => u.email === slugKey || u.username === slugKey);
        if (!user || user.password !== hashPassword(password)) {
          return res.status(400).json({ error: 'Email/Username atau Password salah!' });
        }
        const { password: _, ...safeUser } = user;
        return res.json({ success: true, user: safeUser, access_token: user.id });
      }
    }

    if (path === '/auth/register' && method === 'POST') {
      const { email, username, password } = body;
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Semua field wajib diisi!' });
      }

      const slugEmail = email.trim().toLowerCase();
      const slugUsername = username.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
        try {
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('username', slugUsername)
            .maybeSingle();

          if (existing) return res.status(400).json({ error: 'Username sudah digunakan!' });

          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: slugEmail,
            password: password,
            options: { data: { username: slugUsername } }
          });

          if (authError) return res.status(400).json({ error: authError.message });
          if (!authData?.user) return res.status(500).json({ error: 'Gagal membuat akun' });

          await new Promise(resolve => setTimeout(resolve, 800));

          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (user) {
            const { password: _, ...safeUser } = user as any;
            const token = authData.session?.access_token || authData.user.id;
            return res.json({ success: true, user: safeUser, access_token: token, refresh_token: authData.session?.refresh_token });
          }

          const { data: manualUser } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: slugEmail,
              username: slugUsername,
              balance: 0,
              is_staff: false
            })
            .select('*')
            .single();

          if (manualUser) {
            const { password: _, ...safeUser } = manualUser as any;
            const token = authData.session?.access_token || authData.user.id;
            return res.json({ success: true, user: safeUser, access_token: token, refresh_token: authData.session?.refresh_token });
          }

          return res.status(500).json({ error: 'Gagal membuat profil' });
        } catch (e: any) {
          return res.status(500).json({ error: e.message });
        }
      } else {
        const duplicate = localDb.users.find(u => u.email === slugEmail || u.username === slugUsername);
        if (duplicate) return res.status(400).json({ error: 'Email atau Username sudah terdaftar!' });

        const newUser = {
          id: crypto.randomUUID(),
          email: slugEmail,
          username: slugUsername,
          password: hashPassword(password),
          balance: 0,
          is_staff: false,
          created_at: new Date().toISOString()
        };

        localDb.users.push(newUser);
        const { password: _, ...safeUser } = newUser;
        return res.json({ success: true, user: safeUser, access_token: newUser.id });
      }
    }

    // ==================== PROTECTED ROUTES ====================
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sesi tidak valid.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    }

    // User profile
    if (path === '/user/profile' && method === 'GET') {
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser, database: isSupabaseConfigured ? 'supabase' : 'mock_memory' });
    }

    // User inventory
    if (path === '/user/inventory' && method === 'GET') {
      if (isSupabaseConfigured && supabase) {
        const { data: items } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', user.id)
          .order('obtained_at', { ascending: false });

        return res.json({ inventory: items || [] });
      }
      return res.json({ inventory: [] });
    }

    // Deduct balance
    if (path === '/user/deduct' && method === 'POST') {
      const { cost } = body;
      if (cost === undefined || cost < 0) {
        return res.status(400).json({ error: 'Harga tidak valid' });
      }

      const currentBalance = parseFloat(user.balance);
      if (currentBalance < cost) {
        return res.status(400).json({ error: 'Saldo tidak mencukupi!' });
      }

      const newBalance = currentBalance - cost;

      if (isSupabaseConfigured && supabase) {
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', user.id)
          .select('balance')
          .single();

        return res.json({ success: true, balance: updatedUser.balance });
      }
      return res.json({ success: true, balance: newBalance });
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
          const { data } = await supabase
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
          invItem = data;
        }

        const { data: updatedUser } = await supabase
          .from('users')
          .update({ balance: finalBalance })
          .eq('id', user.id)
          .select('balance')
          .single();

        return res.json({ success: true, inventoryItem: invItem, balance: updatedUser.balance });
      }
      return res.json({ success: true, inventoryItem: null, balance: finalBalance });
    }

    // ==================== USER FISHING ENDPOINTS ====================
    if (path.startsWith('/fishing/')) {
      // Check fishing access
      if (path === '/fishing/check-access' && method === 'GET') {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('fishing_access')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

          return res.json({ hasAccess: !!data, access: data || null });
        }
        return res.json({ hasAccess: false, access: null });
      }

      // Get user fishing inventory
      if (path === '/fishing/inventory' && method === 'GET') {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('fishing_inventory')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          return res.json({
            inventory: data || { user_id: user.id, bait: 0, fishing_saldo: 0 }
          });
        }
        return res.json({ inventory: { user_id: user.id, bait: 0, fishing_saldo: 0 } });
      }

      // Get user rods
      if (path === '/fishing/user-rods' && method === 'GET') {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('user_rods')
            .select('*')
            .eq('user_id', user.id);

          const rods = [
            { rod_id: 'basic_rod', rod_name: 'Basic Rod', is_active: true },
            ...(data || []).map((r: any) => ({
              rod_id: r.rod_id,
              rod_name: r.rod_id.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
              is_active: true
            }))
          ];

          return res.json({ rods });
        }
        return res.json({ rods: [{ rod_id: 'basic_rod', rod_name: 'Basic Rod', is_active: true }] });
      }

      // AFK status
      if (path === '/fishing/afk/status' && method === 'GET') {
        if (isSupabaseConfigured && supabase) {
          const { data: session } = await supabase
            .from('afk_fishing_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();

          if (session) {
            // Update heartbeat
            await supabase
              .from('afk_fishing_sessions')
              .update({ last_heartbeat: new Date().toISOString() })
              .eq('id', session.id);

            return res.json({ 
              isActive: true, 
              session: {
                started_at: session.started_at,
                equipped_rod: session.equipped_rod,
                duration_minutes: Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000)
              }
            });
          }
        }
        return res.json({ isActive: false });
      }

      // Fishing logs
      if (path === '/fishing/logs' && method === 'GET') {
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase
            .from('fish_inventory')
            .select('*')
            .eq('user_id', user.id)
            .order('caught_at', { ascending: false })
            .limit(100);

          return res.json({ logs: data || [], statistics: { totalCaught: (data || []).length } });
        }
        return res.json({ logs: [], statistics: { totalCaught: 0 } });
      }

      // Claim pending
      if (path === '/fishing/claim-pending' && method === 'POST') {
        return res.json({ success: true, claimed: [] });
      }

      // Start AFK
      if (path === '/fishing/afk/start' && method === 'POST') {
        const { rod_id } = body;

        if (isSupabaseConfigured && supabaseAdmin) {
          try {
            // Check if already has active session
            const { data: existing } = await supabaseAdmin
              .from('afk_fishing_sessions')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .maybeSingle();

            if (existing) {
              return res.json({ 
                success: true, 
                message: 'AFK fishing already running',
                session: existing 
              });
            }

            // Check bait
            const { data: inventory } = await supabaseAdmin
              .from('fishing_inventory')
              .select('bait')
              .eq('user_id', user.id)
              .maybeSingle();

            if (!inventory || inventory.bait <= 0) {
              return res.status(400).json({ error: 'Tidak ada bait! Hubungi admin untuk mendapat bait.' });
            }

            // Create AFK session
            const { data: session } = await supabaseAdmin
              .from('afk_fishing_sessions')
              .insert({
                user_id: user.id,
                username: user.username,
                equipped_rod: rod_id || 'basic_rod',
                is_active: true,
                started_at: new Date().toISOString(),
                last_heartbeat: new Date().toISOString()
              })
              .select('*')
              .single();

            return res.json({ 
              success: true, 
              message: 'AFK fishing started! Browser bisa ditutup.',
              session 
            });
          } catch (e: any) {
            console.error('[START AFK] Error:', e);
            return res.status(500).json({ error: 'Gagal start AFK: ' + e.message });
          }
        }
        return res.status(500).json({ error: 'Database not configured' });
      }

      // Stop AFK
      if (path === '/fishing/afk/stop' && method === 'POST') {
        if (isSupabaseConfigured && supabaseAdmin) {
          try {
            const { data: session } = await supabaseAdmin
              .from('afk_fishing_sessions')
              .update({ is_active: false, updated_at: new Date().toISOString() })
              .eq('user_id', user.id)
              .eq('is_active', true)
              .select('*')
              .maybeSingle();

            if (session) {
              const duration = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000);
              return res.json({ 
                success: true, 
                message: `AFK fishing stopped. Duration: ${duration} minutes`,
                session 
              });
            }

            return res.json({ success: true, message: 'No active AFK session' });
          } catch (e: any) {
            console.error('[STOP AFK] Error:', e);
            return res.status(500).json({ error: 'Gagal stop AFK: ' + e.message });
          }
        }
        return res.status(500).json({ error: 'Database not configured' });
      }
    }

    // ==================== ADMIN ROUTES ====================
    if (path.startsWith('/admin/')) {
      if (!user.is_staff) {
        return res.status(403).json({ error: 'Akses Ditolak!' });
      }

      // Get all users
      if (path === '/admin/users' && method === 'GET') {
        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: list } = await supabaseAdmin
            .from('users')
            .select('id, email, username, balance, is_staff, created_at')
            .order('created_at', { ascending: false });

          return res.json({ users: list || [] });
        }
        return res.json({ users: localDb.users.map(({ password, ...u }) => u) });
      }

      // Update balance
      if (path.match(/\/admin\/users\/[^/]+\/balance/) && method === 'POST') {
        const userId = path.split('/')[3];
        const cleanBalance = parseFloat(body.balance);

        if (isNaN(cleanBalance)) {
          return res.status(400).json({ error: 'Saldo tidak valid!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: updated } = await supabaseAdmin
            .from('users')
            .update({ balance: cleanBalance })
            .eq('id', userId)
            .select('*')
            .single();

          return res.json({ success: true, user: updated });
        }
        return res.json({ success: true });
      }

      // ==================== FISHING ADMIN ENDPOINTS ====================
      
      // Get fishing access list
      if (path === '/admin/fishing/access-list' && method === 'GET') {
        if (isSupabaseConfigured && supabaseAdmin) {
          const { data } = await supabaseAdmin
            .from('fishing_access')
            .select(`
              *,
              users!fishing_access_user_id_fkey(username, email)
            `)
            .order('created_at', { ascending: false });

          // Format response properly - frontend expects "access" not "access_list"
          const accessList = (data || []).map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            username: item.users?.username || 'Unknown',
            email: item.users?.email || 'Unknown',
            granted_by: item.granted_by,
            expires_at: item.expires_at,
            is_active: item.is_active,
            created_at: item.created_at
          }));

          return res.json({ access: accessList });
        }
        return res.json({ access: [] });
      }

      // Grant fishing access
      if (path === '/admin/fishing/grant-access' && method === 'POST') {
        const { user_id, duration_days } = body;

        if (!user_id || !duration_days) {
          return res.status(400).json({ error: 'user_id dan duration_days wajib diisi!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          try {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + duration_days);

            // Check if user exists
            const { data: userExists, error: userError } = await supabaseAdmin
              .from('users')
              .select('id, username, email')
              .eq('id', user_id)
              .single();

            if (userError || !userExists) {
              return res.status(400).json({ error: 'User tidak ditemukan!' });
            }

            // Upsert fishing access
            const { data: access, error } = await supabaseAdmin
              .from('fishing_access')
              .upsert({
                user_id: user_id,
                granted_by: user.id,
                expires_at: expiresAt.toISOString(),
                is_active: true
              }, {
                onConflict: 'user_id'
              })
              .select()
              .single();

            if (error) {
              console.error('[GRANT ACCESS] Error:', error);
              return res.status(500).json({ error: 'Gagal memberikan akses: ' + error.message });
            }

            // Return with user info
            return res.json({ 
              success: true, 
              access: {
                ...access,
                username: userExists.username,
                email: userExists.email
              }
            });
          } catch (e: any) {
            console.error('[GRANT ACCESS] Exception:', e);
            return res.status(500).json({ error: 'Server error: ' + e.message });
          }
        }
        return res.json({ success: true });
      }

      // Get user rod access
      if (path.match(/\/admin\/fishing\/user-rods\/[^/]+$/) && method === 'GET') {
        const userId = path.split('/').pop();

        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: rods } = await supabaseAdmin
            .from('user_rods')
            .select('*')
            .eq('user_id', userId)
            .order('granted_at', { ascending: false });

          return res.json({ rods: rods || [] });
        }
        return res.json({ rods: [] });
      }

      // Grant rod access
      if (path === '/admin/fishing/grant-rod' && method === 'POST') {
        const { user_id, rod_id, notes } = body;

        if (!user_id || !rod_id) {
          return res.status(400).json({ error: 'user_id dan rod_id wajib diisi!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: rod } = await supabaseAdmin
            .from('user_rods')
            .insert({
              user_id: user_id,
              rod_id: rod_id,
              granted_by: user.id,
              notes: notes || null
            })
            .select('*')
            .single();

          return res.json({ success: true, rod });
        }
        return res.json({ success: true });
      }

      // Revoke rod access
      if (path === '/admin/fishing/revoke-rod' && method === 'POST') {
        const { user_id, rod_id } = body;

        if (!user_id || !rod_id) {
          return res.status(400).json({ error: 'user_id dan rod_id wajib diisi!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          await supabaseAdmin
            .from('user_rods')
            .delete()
            .eq('user_id', user_id)
            .eq('rod_id', rod_id);

          return res.json({ success: true, message: 'Rod access revoked' });
        }
        return res.json({ success: true });
      }

      // Grant bait
      if (path === '/admin/fishing/grant-bait' && method === 'POST') {
        const { user_id, amount, notes } = body;

        console.log('[GRANT BAIT] Request:', { user_id, amount, notes });

        if (!user_id || !amount || amount <= 0) {
          return res.status(400).json({ error: 'user_id dan amount (>0) wajib diisi!' });
        }

        if (isSupabaseConfigured && supabaseAdmin) {
          try {
            // Check if user exists
            const { data: userCheck } = await supabaseAdmin
              .from('users')
              .select('id, username')
              .eq('id', user_id)
              .maybeSingle();

            if (!userCheck) {
              console.log('[GRANT BAIT] User not found:', user_id);
              return res.status(400).json({ error: 'User tidak ditemukan!' });
            }

            console.log('[GRANT BAIT] User found:', userCheck.username);

            // Get current bait
            const { data: inventory } = await supabaseAdmin
              .from('fishing_inventory')
              .select('bait')
              .eq('user_id', user_id)
              .maybeSingle();

            const currentBait = inventory?.bait || 0;
            const newBait = currentBait + amount;

            console.log('[GRANT BAIT] Bait:', { current: currentBait, adding: amount, new: newBait });

            // Upsert inventory
            const { data: updated, error: upsertError } = await supabaseAdmin
              .from('fishing_inventory')
              .upsert({
                user_id: user_id,
                bait: newBait,
                fishing_saldo: inventory?.fishing_saldo || 0,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'user_id'
              })
              .select('*')
              .single();

            if (upsertError) {
              console.error('[GRANT BAIT] Upsert error:', upsertError);
              return res.status(500).json({ error: 'Gagal update bait: ' + upsertError.message });
            }

            console.log('[GRANT BAIT] Success:', updated);

            return res.json({ 
              success: true, 
              inventory: {
                ...updated,
                bait_balance: updated.bait // For frontend compatibility
              }
            });
          } catch (e: any) {
            console.error('[GRANT BAIT] Exception:', e);
            return res.status(500).json({ error: 'Server error: ' + e.message });
          }
        }
        return res.json({ success: true });
      }

      // Get user fishing inventory
      if (path.match(/\/admin\/fishing\/user-inventory\/[^/]+$/) && method === 'GET') {
        const userId = path.split('/').pop();

        if (isSupabaseConfigured && supabaseAdmin) {
          const { data: inventory } = await supabaseAdmin
            .from('fishing_inventory')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          // Return with both bait and bait_balance for compatibility
          const result = inventory || { user_id: userId, bait: 0, fishing_saldo: 0 };
          return res.json({ 
            inventory: {
              ...result,
              bait_balance: result.bait // Frontend expects bait_balance
            }
          });
        }
        return res.json({ inventory: { user_id: userId, bait: 0, bait_balance: 0, fishing_saldo: 0 } });
      }
    }

    // ==================== PUBLIC ROUTES ====================

    // Game configs
    if (path.startsWith('/games/config/') && method === 'GET') {
      const gameType = path.split('/').pop();
      
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('game_configs')
          .select('config_data')
          .eq('game_type', gameType);

        if (data && data.length > 0) {
          return res.json(data[0].config_data);
        }
      }

      if (gameType === 'cases') {
        return res.json({ chests: [], gameSettings: {} });
      }
      return res.status(404).json({ error: 'Config not found' });
    }

    // Online users
    if (path === '/users/online' && method === 'GET') {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from('users')
          .select('username, is_staff')
          .order('created_at', { ascending: false })
          .limit(10);

        if (data) {
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
