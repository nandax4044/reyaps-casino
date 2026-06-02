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
  if (!token) {
    console.log('[AUTH] Token is empty or null');
    return null;
  }

  try {
    if (isSupabaseConfigured && supabase) {
      console.log('[AUTH] Validating Supabase token');
      
      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      
      if (authError) {
        console.error('[AUTH] getUser failed:', authError.message || authError);
        return null;
      }

      if (!authData?.user?.id) {
        console.log('[AUTH] No user in auth response');
        return null;
      }

      const userId = authData.user.id;
      console.log('[AUTH] Auth verified, fetching profile for:', userId);

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('[AUTH] Profile query failed:', userError.message);
        return null;
      }
      
      if (!user) {
        console.log('[AUTH] User not found in database');
        return null;
      }
      
      console.log('[AUTH] ✅ User authenticated');
      return user;
    } else {
      console.log('[AUTH] Supabase not configured, using local lookup');
      const localUser = localDb.users.find(u => u.id === token);
      if (localUser) {
        console.log('[AUTH] ✅ Local user found');
      } else {
        console.log('[AUTH] Local user not found');
      }
      return localUser || null;
    }
  } catch (e: any) {
    console.error('[AUTH] Unexpected error:', e?.message);
    return null;
  }
}

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path from Vercel catch-all
  const pathSegments = req.query.path;
  const path = Array.isArray(pathSegments) ? `/${pathSegments.join('/')}` : `/${pathSegments || ''}`;
  const method = req.method || 'GET';
  
  // Parse body - handle both JSON object and string
  let body = {};
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        console.log('[API] Failed to parse body as JSON, using as-is');
        body = {};
      }
    } else {
      body = req.body;
    }
  }

  console.log(`[API] ${method} ${path}`);

  try {
    // ==================== DEBUG ENDPOINT ====================
    if (path === '/debug/info' && method === 'GET') {
      return res.json({
        timestamp: new Date().toISOString(),
        supabaseConfigured: isSupabaseConfigured,
        supabaseUrl: supabaseUrl ? 'configured' : 'missing',
        supabaseKey: supabaseKey ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV
      });
    }

    // ==================== AUTH ROUTES (PUBLIC) ====================
    
    if (path === '/auth/register' && method === 'POST') {
      try {
        console.log('[REGISTER] Request received');
        
        const email = body?.email;
        const username = body?.username;
        const password = body?.password;

        if (!email || !username || !password) {
          console.log('[REGISTER] Missing fields');
          return res.status(400).json({ error: 'Email, Username, dan Password wajib diisi!' });
        }

        const slugEmail = String(email).trim().toLowerCase();
        const slugUsername = String(username).trim().toLowerCase();

        // Check local first
        console.log('[REGISTER] Checking local duplicates...');
        const localDuplicate = localDb.users.find(u => 
          u.email.toLowerCase() === slugEmail || u.username.toLowerCase() === slugUsername
        );

        if (localDuplicate) {
          console.log('[REGISTER] Local duplicate found');
          return res.status(400).json({ error: 'Email atau Username sudah terdaftar!' });
        }

        // Check Supabase if configured
        if (isSupabaseConfigured && supabase) {
          console.log('[REGISTER] Checking Supabase for duplicate username...');
          
          const { data: existingUsername, error: checkError } = await supabase
            .from('users')
            .select('id')
            .eq('username', slugUsername)
            .maybeSingle()
            .catch((e: any) => ({ data: null, error: e }));

          if (existingUsername) {
            console.log('[REGISTER] Username already exists in Supabase');
            return res.status(400).json({ error: 'Username sudah digunakan!' });
          }

          console.log('[REGISTER] Calling supabase.auth.signUp...');
          
          const { data: authData, error: authError } = await supabase
            .auth.signUp({
              email: slugEmail,
              password: String(password),
              options: { data: { username: slugUsername } }
            })
            .catch((e: any) => ({ data: null, error: e }));

          if (authError || !authData?.user) {
            console.log('[REGISTER] SignUp failed:', authError?.message);
            if (authError?.message?.includes('already registered')) {
              return res.status(400).json({ error: 'Email sudah terdaftar!' });
            }
            return res.status(400).json({ error: authError?.message || 'Registration failed' });
          }

          const authUserId = authData.user.id;
          const sessionToken = authData.session?.access_token || null;

          console.log('[REGISTER] User created, waiting for trigger...');
          
          // Wait for handle_new_user trigger
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if trigger created profile
          const { data: triggerUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .maybeSingle()
            .catch((e: any) => ({ data: null, error: e }));

          if (triggerUser) {
            console.log('[REGISTER] ✅ Profile created by trigger');
            const { password: _, ...safeUser } = triggerUser as any;
            
            // Get session token
            let token = sessionToken || authUserId;
            if (!sessionToken && !token) {
              const signInResult = await supabase
                .auth.signInWithPassword({ email: slugEmail, password: String(password) })
                .catch((e: any) => ({ data: null, error: e }));
              token = signInResult?.data?.session?.access_token || authUserId;
            }
            
            return res.status(200).json({
              success: true,
              user: safeUser,
              access_token: token,
              token: token,
              refresh_token: authData.session?.refresh_token
            });
          }

          console.log('[REGISTER] Trigger did not create profile, inserting manually...');

          // Manually insert profile
          const insertClient = sessionToken
            ? createClient(supabaseUrl, supabaseKey, {
                global: { headers: { Authorization: `Bearer ${sessionToken}` } },
                auth: { autoRefreshToken: false, persistSession: false }
              })
            : supabase;

          const { data: manualUser, error: insertError } = await insertClient
            .from('users')
            .insert({
              id: authUserId,
              email: slugEmail,
              username: slugUsername,
              balance: 0.00,
              is_staff: false
            })
            .select('*')
            .single()
            .catch((e: any) => ({ data: null, error: e }));

          if (insertError || !manualUser) {
            console.log('[REGISTER] Manual insert failed:', insertError?.message);
            return res.status(400).json({ error: 'Profil gagal disimpan: ' + (insertError?.message || 'Unknown error') });
          }

          console.log('[REGISTER] ✅ Profile created manually');
          const { password: _, ...safeUser } = manualUser as any;
          
          let token = sessionToken || authUserId;
          if (!sessionToken && !token) {
            const signInResult = await supabase
              .auth.signInWithPassword({ email: slugEmail, password: String(password) })
              .catch((e: any) => ({ data: null, error: e }));
            token = signInResult?.data?.session?.access_token || authUserId;
          }
          
          return res.status(200).json({
            success: true,
            user: safeUser,
            access_token: token,
            token: token,
            refresh_token: authData.session?.refresh_token
          });

        } else {
          // Local registration fallback
          console.log('[REGISTER] Using local registration');
          
          const newUser = {
            id: crypto.randomUUID(),
            email: slugEmail,
            username: slugUsername,
            password: hashPassword(String(password)),
            balance: 0.00,
            is_staff: slugUsername === 'admin',
            created_at: new Date().toISOString()
          };

          localDb.users.push(newUser);
          console.log('[REGISTER] ✅ Local user created');
          
          const { password: _, ...safeUser } = newUser;
          return res.status(200).json({
            success: true,
            user: safeUser,
            access_token: newUser.id,
            token: newUser.id
          });
        }

      } catch (err: any) {
        console.error('[REGISTER] Exception caught:', err?.message || String(err));
        return res.status(500).json({
          error: 'Registration error',
          details: err?.message || 'Unknown error'
        });
      }
    }

    if (path === '/auth/login' && method === 'POST') {
      try {
        console.log('[LOGIN] Request received');
        
        const loginKey = body?.loginKey;
        const password = body?.password;

        if (!loginKey || !password) {
          console.log('[LOGIN] Missing credentials');
          return res.status(400).json({ error: 'Email/Username dan Password wajib diisi!' });
        }

        const slugKey = String(loginKey).trim().toLowerCase();

        // Try local first (faster, always works)
        console.log('[LOGIN] Checking local auth...');
        const localUser = localDb.users.find(u => 
          (u.email && u.email.toLowerCase() === slugKey) || 
          (u.username && u.username.toLowerCase() === slugKey)
        );

        if (localUser && localUser.password === hashPassword(String(password))) {
          console.log('[LOGIN] ✅ Local auth success');
          const { password: _, ...safeUser } = localUser;
          return res.status(200).json({
            success: true,
            user: safeUser,
            access_token: localUser.id,
            token: localUser.id
          });
        }

        // Try Supabase if configured
        if (!isSupabaseConfigured || !supabase) {
          console.log('[LOGIN] No local match and Supabase not configured');
          return res.status(401).json({ error: 'Akun tidak ditemukan!' });
        }

        console.log('[LOGIN] Attempting Supabase auth...');
        
        let loginEmail = slugKey;
        
        // If not email format, look up username
        if (!slugKey.includes('@')) {
          console.log('[LOGIN] Looking up username in Supabase...');
          const { data: foundUser, error: lookupError } = await supabase
            .from('users')
            .select('email')
            .eq('username', slugKey)
            .maybeSingle()
            .catch((e: any) => ({ data: null, error: e }));

          if (lookupError) {
            console.log('[LOGIN] Username lookup failed:', lookupError?.message);
          }

          if (!foundUser) {
            console.log('[LOGIN] Username not found in Supabase');
            return res.status(401).json({ error: 'Akun tidak ditemukan!' });
          }

          loginEmail = foundUser.email;
          console.log('[LOGIN] Found email for username');
        }

        // Attempt Supabase sign in
        const { data: sessionData, error: signInError } = await supabase
          .auth.signInWithPassword({ email: loginEmail, password: String(password) })
          .catch((e: any) => ({ data: null, error: e }));

        if (signInError || !sessionData?.session) {
          console.log('[LOGIN] Supabase sign-in failed');
          return res.status(401).json({ error: 'Email/Username atau Password salah!' });
        }

        // Fetch user profile
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', sessionData.user.id)
          .single()
          .catch((e: any) => ({ data: null, error: e }));

        if (userError || !user) {
          console.log('[LOGIN] User profile fetch failed');
          return res.status(401).json({ error: 'Profil user tidak ditemukan!' });
        }

        console.log('[LOGIN] ✅ Supabase auth success');
        const { password: _, ...safeUser } = user as any;
        return res.status(200).json({
          success: true,
          user: safeUser,
          access_token: sessionData.session.access_token,
          token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token
        });

      } catch (err: any) {
        console.error('[LOGIN] Exception caught:', err?.message || String(err));
        return res.status(500).json({
          error: 'Login service error',
          details: err?.message || 'Unknown error'
        });
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
      console.log('[AUTH] Missing or invalid auth header');
      return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token.length === 0) {
      console.log('[AUTH] Empty token');
      return res.status(401).json({ error: 'Token tidak valid.' });
    }

    console.log('[AUTH] Authenticating token...');
    let user: any = null;
    
    try {
      user = await authenticateToken(token);
    } catch (authErr: any) {
      console.error('[AUTH] Authentication error:', authErr?.message);
      return res.status(500).json({ error: 'Authentication service error', details: authErr?.message });
    }
    
    if (!user) {
      console.log('[AUTH] User authentication failed - token invalid or user not found');
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }

    console.log('[AUTH] ✅ User authenticated:', user.id);

    // User profile
    if (path === '/user/profile' && method === 'GET') {
      try {
        console.log('[PROFILE] Getting profile for user:', user?.id);
        
        if (!user || typeof user !== 'object') {
          console.error('[PROFILE] Invalid user object:', typeof user);
          return res.status(500).json({ error: 'Invalid user object' });
        }
        
        // Create a copy to avoid modifying the original
        const profileData = { ...user };
        
        // Remove sensitive fields
        delete profileData.password;
        delete profileData.password_hash;
        
        console.log('[PROFILE] ✅ Sending profile:', Object.keys(profileData));
        
        return res.json({ 
          user: profileData, 
          database: isSupabaseConfigured ? 'supabase' : 'mock_memory',
          success: true
        });
      } catch (profileError: any) {
        console.error('[PROFILE] Exception:', profileError?.message);
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
