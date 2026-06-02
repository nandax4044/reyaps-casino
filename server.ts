import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

import caseOpeningDefault from './src/data/case_opening.json' with { type: 'json' };
import permainanDefault from './src/data/permainan.json' with { type: 'json' };

const app = express();
const PORT = 3000;

// CORS Middleware for production safety
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// ─── Supabase Setup ────────────────────────────────────────────────────────────
const supabaseUrl  = process.env.SUPABASE_URL  || 'https://rwngqiakigebtwxohiri.supabase.co';
const supabaseKey  = process.env.SUPABASE_KEY  || 'sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv';

// SERVICE ROLE key — needed to bypass RLS for admin ops & seeding
// Set A in your .env file (get it from Supabase Dashboard → Settings → API)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

console.log(`[SUPABASE STATUS] ${isSupabaseConfigured
  ? 'Configured ✅ Connecting to ' + supabaseUrl
  : 'Not Configured ⚠️ Running in Local Memory Mode'}`);

// Normal client — for user-facing operations (respects RLS)
const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Admin client — uses service role, bypasses RLS (for seeding & admin endpoints)
const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

// ─── Password Hash ─────────────────────────────────────────────────────────────
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ─── Local Memory Fallback ─────────────────────────────────────────────────────
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
  ],
  inventory: [] as any[],
  configs: {
    cases: JSON.parse(JSON.stringify(caseOpeningDefault)),
    crash:  JSON.parse(JSON.stringify(permainanDefault))
  } as Record<string, any>
};

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: isSupabaseConfigured ? 'supabase' : 'local_memory',
    supabaseUrl: isSupabaseConfigured ? supabaseUrl : null
  });
});

// ─── Auth Middleware ───────────────────────────────────────────────────────────
// Supports two token formats:
//   1. Supabase JWT (from signInWithPassword) — verified via supabase.auth.getUser()
//   2. Legacy plain UUID (fallback, local memory mode)
async function authenticateUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
  }

  const token = authHeader.split(' ')[1];

  if (isSupabaseConfigured && supabase) {
    try {
      // ① Verify JWT token with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.getUser(token);

      if (authError || !authData?.user) {
        return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
      }

      // ② Get user profile from public.users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError || !user) {
        return res.status(401).json({ error: 'Profil user tidak ditemukan. Coba login ulang.' });
      }

      req.body._userId = user.id;
      req.body._user   = user;
      next();
    } catch (e: any) {
      return res.status(500).json({ error: 'Database error: ' + e.message });
    }
  } else {
    // Local memory fallback — token = user UUID
    const user = localDb.users.find(u => u.id === token);
    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }
    req.body._userId = user.id;
    req.body._user   = user;
    next();
  }
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────
// Flow: Supabase Auth signUp  →  trigger auto-creates public.users row
// We also pass username via user_metadata so the trigger can use it
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, Username, dan Password wajib diisi!' });
  }

  const slugEmail    = email.trim().toLowerCase();
  const slugUsername = username.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      // ① Check duplicate username
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', slugUsername)
        .maybeSingle();

      if (existingUsername) {
        return res.status(400).json({ error: 'Username sudah digunakan!' });
      }

      // ② signUp with anon key — no service role needed
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    slugEmail,
        password: password,
        options:  { data: { username: slugUsername } }
      });

      if (authError) {
        console.error('[REGISTER ERROR] signUp failed:', authError);
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
          return res.status(400).json({ error: 'Email sudah terdaftar!' });
        }
        return res.status(400).json({ error: authError.message });
      }

      if (!authData?.user) {
        console.error('[REGISTER ERROR] No user returned from signUp');
        return res.status(500).json({ error: 'Gagal membuat akun. Coba lagi.' });
      }

      const authUserId   = authData.user.id;
      const sessionToken = authData.session?.access_token || null;

      console.log('[REGISTER] User created:', authUserId, 'Session:', !!sessionToken);

      // ③ Wait for handle_new_user trigger to create public.users row
      await new Promise(resolve => setTimeout(resolve, 800));

      // ④ Check if trigger created the profile
      const { data: triggerUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (triggerUser) {
        console.log('[REGISTER] Trigger created profile, updating username');
        // Trigger worked — patch username if needed
        const patchClient = supabaseAdmin || supabase;
        await patchClient.from('users').update({ username: slugUsername }).eq('id', authUserId);
        const merged = { ...triggerUser, username: slugUsername };
        const token  = sessionToken
          || (await supabase.auth.signInWithPassword({ email: slugEmail, password })).data?.session?.access_token
          || authUserId;
        const { password: _, ...safeUser } = merged as any;
        return res.json({ success: true, user: safeUser, token });
      }

      console.log('[REGISTER] Trigger did not create profile, inserting manually');

      // ⑤ Trigger didn't fire — insert profile manually
      //    Use user's own JWT so RLS policy (auth.uid() = id) is satisfied
      const insertClient = sessionToken
        ? createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${sessionToken}` } },
            auth:   { autoRefreshToken: false, persistSession: false }
          })
        : supabase;

      const { data: manualUser, error: manualError } = await insertClient
        .from('users')
        .insert({
          id:       authUserId,
          email:    slugEmail,
          username: slugUsername,
          balance:  0.00,
          is_staff: false
        })
        .select('*')
        .single();

      if (manualError) {
        console.error('[REGISTER ERROR] Manual insert failed:', manualError);
        return res.status(500).json({ error: 'Akun dibuat tapi profil gagal disimpan: ' + manualError.message });
      }

      console.log('[REGISTER] Manual insert succeeded');
      const token = sessionToken
        || (await supabase.auth.signInWithPassword({ email: slugEmail, password })).data?.session?.access_token
        || authUserId;
      const { password: _, ...safeManualUser } = manualUser as any;
      return res.json({ success: true, user: safeManualUser, token });

    } catch (e: any) {
      console.error('[REGISTER EXCEPTION]', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }

  } else {
    // ─ Local memory fallback ─
    const duplicate = localDb.users.find(u => u.email === slugEmail || u.username === slugUsername);
    if (duplicate) {
      return res.status(400).json({ error: 'Email atau Username sudah terdaftar!' });
    }

    const newUser = {
      id:         crypto.randomUUID(),
      email:      slugEmail,
      username:   slugUsername,
      password:   hashPassword(password),
      balance:    0.00,
      is_staff:   slugUsername === 'admin' || localDb.users.length === 0,
      created_at: new Date().toISOString()
    };

    localDb.users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return res.json({ success: true, user: safeUser, token: newUser.id });
  }
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
// Uses Supabase Auth signInWithPassword — returns real JWT token
app.post('/api/auth/login', async (req, res) => {
  const { loginKey, password } = req.body;

  if (!loginKey || !password) {
    return res.status(400).json({ error: 'Email/Username dan Password wajib diisi!' });
  }

  const slugKey = loginKey.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      // ① Find the user's email (loginKey could be username or email)
      let loginEmail = slugKey;

      // If loginKey doesn't look like an email, look up by username
      if (!slugKey.includes('@')) {
        console.log('[LOGIN] Looking up user by username:', slugKey);
        
        const { data: foundUser, error: findError } = await supabase
          .from('users')
          .select('email')
          .eq('username', slugKey)
          .maybeSingle();

        if (findError) {
          console.error('[LOGIN] Database error finding user:', findError);
          return res.status(400).json({ error: 'Database error: ' + findError.message });
        }

        if (!foundUser) {
          console.error('[LOGIN] User not found in database:', slugKey);
          return res.status(400).json({ 
            error: 'Akun tidak ditemukan! Pastikan username sudah terdaftar.',
            debug: { username: slugKey, hint: 'Run COMPLETE_FIX.sql in Supabase' }
          });
        }

        console.log('[LOGIN] Found user email:', foundUser.email);
        loginEmail = foundUser.email;
      }

      // ② Sign in via Supabase Auth to get JWT
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email:    loginEmail,
        password: password
      });

      if (signInError) {
        // Map Supabase Auth errors to friendly messages
        if (signInError.message.includes('Invalid login credentials')) {
          return res.status(400).json({ error: 'Email/Username atau Password salah!' });
        }
        if (signInError.message.includes('Email not confirmed')) {
          return res.status(400).json({ error: 'Email belum dikonfirmasi. Cek inbox kamu.' });
        }
        return res.status(400).json({ error: signInError.message });
      }

      if (!sessionData?.user || !sessionData?.session) {
        return res.status(400).json({ error: 'Login gagal. Coba lagi.' });
      }

      // ③ Fetch user profile from public.users
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
        user:    safeUser,
        token:   sessionData.session.access_token  // real JWT — not UUID anymore
      });

    } catch (e: any) {
      return res.status(500).json({ error: 'Database service failure: ' + e.message });
    }

  } else {
    // ─ Local memory fallback ─
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
});

// ─── REFRESH TOKEN ─────────────────────────────────────────────────────────────
// Refresh the user's session token without requiring re-login
app.post('/api/auth/refresh', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const oldToken = authHeader.split(' ')[1];

  if (isSupabaseConfigured && supabase) {
    try {
      // Try to refresh the session using the old token
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
        token: data.session.access_token,
        refresh_token: data.session.refresh_token
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'Refresh failed: ' + e.message });
    }
  } else {
    // Local memory mode - tokens don't expire
    return res.json({ success: true, token: oldToken });
  }
});

// ─── USER PROFILE ──────────────────────────────────────────────────────────────
app.get('/api/user/profile', authenticateUser, async (req, res) => {
  const user = req.body._user;
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, database: isSupabaseConfigured ? 'supabase' : 'mock_memory' });
});

// ─── USER INVENTORY ────────────────────────────────────────────────────────────
app.get('/api/user/inventory', authenticateUser, async (req, res) => {
  const userId = req.body._userId;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: items, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false });

      if (error) throw error;
      res.json({ inventory: items });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const items = localDb.inventory.filter(i => i.user_id === userId);
    res.json({ inventory: [...items].reverse() });
  }
});

// ─── WITHDRAW REQUEST ──────────────────────────────────────────────────────────
app.post('/api/user/withdraw', authenticateUser, async (req, res) => {
  const { itemId } = req.body;
  const userId = req.body._userId;

  if (!itemId) {
    return res.status(400).json({ error: 'Item ID wajib dilampirkan' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: item, error: getError } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (getError || !item) {
        return res.status(404).json({ error: 'Item tidak ditemukan di inventory Anda!' });
      }

      if (item.status !== 'available') {
        return res.status(400).json({ error: 'Status item ini sudah dalam proses WD!' });
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from('inventory')
        .update({ status: 'requested_withdraw' })
        .eq('id', itemId)
        .select('*')
        .single();

      if (updateError) throw updateError;
      res.json({ success: true, item: updatedItem });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const item = localDb.inventory.find(i => i.id === itemId && i.user_id === userId);
    if (!item) return res.status(404).json({ error: 'Item tidak ditemukan di inventory Anda' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Status item ini sudah dalam proses WD!' });
    item.status = 'requested_withdraw';
    res.json({ success: true, item });
  }
});

// ─── DEDUCT BALANCE ────────────────────────────────────────────────────────────
app.post('/api/user/deduct', authenticateUser, async (req, res) => {
  const { cost } = req.body;
  const userId   = req.body._userId;
  const user     = req.body._user;

  if (cost === undefined || cost < 0) {
    return res.status(400).json({ error: 'Harga spin tidak valid' });
  }

  const currentBalance = parseFloat(user.balance);
  if (currentBalance < cost) {
    return res.status(400).json({ error: 'Saldo Anda tidak mencukupi untuk bermain!' });
  }

  const newBalance = currentBalance - cost;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select('balance')
        .single();

      if (error) throw error;
      res.json({ success: true, balance: updatedUser.balance });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const userInDb = localDb.users.find(u => u.id === userId);
    if (userInDb) { userInDb.balance = newBalance; res.json({ success: true, balance: newBalance }); }
    else res.status(404).json({ error: 'User not found' });
  }
});

// ─── ADD WIN ───────────────────────────────────────────────────────────────────
app.post('/api/user/add-win', authenticateUser, async (req, res) => {
  const { name, rarity, value, icon, image, addedBalance, deductAmount } = req.body;
  const userId = req.body._userId;
  const user   = req.body._user;

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
    try {
      let invItem = null;
      if (name) {
        const { data, error } = await supabase
          .from('inventory')
          .insert({ user_id: userId, item_name: name, rarity: rarity || 'Common', value: value || 0, icon: icon || '🎁', image: image || '', status: 'available' })
          .select('*')
          .single();
        if (error) throw error;
        invItem = data;
      }

      const { data: updatedUser, error: balError } = await supabase
        .from('users')
        .update({ balance: finalBalance })
        .eq('id', userId)
        .select('balance')
        .single();

      if (balError) throw balError;
      res.json({ success: true, inventoryItem: invItem, balance: updatedUser.balance });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    let invItem: any = null;
    if (name) {
      invItem = { id: crypto.randomUUID(), user_id: userId, item_name: name, rarity: rarity || 'Common', value: value || 0, icon: icon || '🎁', image: image || '', obtained_at: new Date().toISOString(), status: 'available' };
      localDb.inventory.push(invItem);
    }
    const userInDb = localDb.users.find(u => u.id === userId);
    if (userInDb) userInDb.balance = finalBalance;
    res.json({ success: true, inventoryItem: invItem, balance: finalBalance });
  }
});

// ─── CRASH GAME WIN (Balance Only - No Items) ─────────────────────────────────
app.post('/api/crash/win', authenticateUser, async (req, res) => {
  const { winAmount, betAmount, multiplier } = req.body;
  const userId = req.body._userId;
  const user   = req.body._user;

  if (!winAmount || winAmount <= 0) {
    return res.status(400).json({ error: 'Invalid win amount' });
  }

  const currentBalance = parseFloat(user.balance);
  const newBalance = currentBalance + winAmount;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select('balance')
        .single();

      if (error) throw error;

      console.log(`[CRASH WIN] User ${userId} won ${winAmount} WL (bet: ${betAmount}, multiplier: ${multiplier}x)`);
      
      res.json({ 
        success: true, 
        balance: updatedUser.balance,
        newBalance: updatedUser.balance,
        winAmount: winAmount
      });
    } catch (e: any) {
      console.error('[CRASH WIN ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  } else {
    const userInDb = localDb.users.find(u => u.id === userId);
    if (userInDb) {
      userInDb.balance = newBalance;
      console.log(`[CRASH WIN] User ${userId} won ${winAmount} WL (bet: ${betAmount}, multiplier: ${multiplier}x)`);
      res.json({ success: true, balance: newBalance, newBalance: newBalance, winAmount: winAmount });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  }
});

// ─── GAME CONFIGS ──────────────────────────────────────────────────────────────
app.get('/api/games/config/:game_type', async (req, res) => {
  const { game_type } = req.params;

  if (isSupabaseConfigured && supabase) {
    try {
      // First, try to get from database
      const { data, error } = await supabase
        .from('game_configs')
        .select('config_data')
        .eq('game_type', game_type);

      // If we got data array, take the first one
      if (!error && data && data.length > 0) {
        const config = data[0].config_data;
        
        // Normalize: if config has 'cases' key, rename to 'chests' for consistency
        if (config.cases && !config.chests) {
          config.chests = config.cases;
          delete config.cases;
        }
        
        console.log(`[CONFIG] Loaded ${game_type} from DB (${data.length} rows found, using first)`);
        return res.json(config);
      }
      
      // If error or no data, log and fall through to defaults
      if (error) {
        console.log(`[CONFIG] DB error for ${game_type}:`, error.message, '- using default');
      } else {
        console.log(`[CONFIG] No data for ${game_type} in DB - using default`);
      }
    } catch (e: any) {
      console.log(`[CONFIG] Exception for ${game_type}:`, e.message, '- using default');
    }
  }

  // Fallback to JSON files
  console.log(`[CONFIG] Using default JSON for ${game_type}`);
  if (game_type === 'cases')  return res.json(caseOpeningDefault);
  if (game_type === 'crash')  return res.json(permainanDefault);
  res.status(404).json({ error: 'Config type unknown' });
});

// ─── STAFF MIDDLEWARE ──────────────────────────────────────────────────────────
async function verifyStaff(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.body._user?.is_staff) {
    return res.status(403).json({ error: 'Akses Ditolak: Anda bukan staff/admin!' });
  }
  next();
}

// ─── ADMIN: Update Game Config ─────────────────────────────────────────────────
app.post('/api/admin/config/:game_type/update', authenticateUser, verifyStaff, async (req, res) => {
  const { game_type }    = req.params;
  const configPayload    = req.body.config;

  if (!configPayload) {
    return res.status(400).json({ error: 'Payload config data kosong' });
  }

  // Use normal client if admin not available (RLS disabled in new schema)
  const client = supabaseAdmin || supabase;

  if (isSupabaseConfigured && client) {
    try {
      // First, check if config exists
      const { data: existing, error: checkError } = await client
        .from('game_configs')
        .select('game_type')
        .eq('game_type', game_type)
        .maybeSingle();

      if (checkError) {
        console.error('[ADMIN CONFIG CHECK ERROR]', checkError);
        throw checkError;
      }

      if (existing) {
        // Config exists - UPDATE
        console.log(`[ADMIN] Updating existing ${game_type} config`);
        const { error: updateError } = await client
          .from('game_configs')
          .update({ config_data: configPayload, updated_at: new Date().toISOString() })
          .eq('game_type', game_type);

        if (updateError) throw updateError;
      } else {
        // Config doesn't exist - INSERT
        console.log(`[ADMIN] Inserting new ${game_type} config`);
        const { error: insertError } = await client
          .from('game_configs')
          .insert({ game_type, config_data: configPayload, updated_at: new Date().toISOString() });

        if (insertError) throw insertError;
      }

      res.json({ success: true, message: `Berhasil mengupdate konfigurasi ${game_type}!` });
    } catch (e: any) {
      console.error('[ADMIN CONFIG UPDATE ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[game_type] = JSON.parse(JSON.stringify(configPayload));
    res.json({ success: true, message: `Berhasil mengupdate konfigurasi ${game_type} di memori lokal!` });
  }
});

// ─── ADMIN: Reset Config to Default (from JSON files) ─────────────────────────
app.post('/api/admin/config/:game_type/reset', authenticateUser, verifyStaff, async (req, res) => {
  const { game_type } = req.params;

  let defaultConfig: any = null;
  if (game_type === 'cases')  defaultConfig = caseOpeningDefault;
  else if (game_type === 'crash')  defaultConfig = permainanDefault;
  else return res.status(404).json({ error: 'Game type tidak dikenal' });

  const client = supabaseAdmin || supabase;

  if (isSupabaseConfigured && client) {
    try {
      // First, delete any existing config for this game_type to avoid duplicates
      await client
        .from('game_configs')
        .delete()
        .eq('game_type', game_type);

      // Then insert the new config
      const { error } = await client
        .from('game_configs')
        .insert({ game_type, config_data: defaultConfig, updated_at: new Date().toISOString() });

      if (error) throw error;
      
      console.log(`[ADMIN] Reset ${game_type} config successfully`);
      res.json({ success: true, message: `Config ${game_type} berhasil direset ke default!`, config: defaultConfig });
    } catch (e: any) {
      console.error('[ADMIN CONFIG RESET ERROR]', e);
      res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[game_type] = JSON.parse(JSON.stringify(defaultConfig));
    res.json({ success: true, message: `Config ${game_type} berhasil direset!`, config: defaultConfig });
  }
});

// ─── ADMIN: Get All Users ──────────────────────────────────────────────────────
app.get('/api/admin/users', authenticateUser, verifyStaff, async (req, res) => {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: list, error } = await supabaseAdmin
        .from('users')
        .select('id, email, username, balance, is_staff, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ users: list });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ users: localDb.users.map(({ password, ...u }) => u).reverse() });
  }
});

// ─── ADMIN: Update Balance ─────────────────────────────────────────────────────
app.post('/api/admin/users/:id/balance', authenticateUser, verifyStaff, async (req, res) => {
  const { id }      = req.params;
  const cleanBalance = parseFloat(req.body.balance);

  if (isNaN(cleanBalance)) {
    return res.status(400).json({ error: 'Saldo tidak valid!' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update({ balance: cleanBalance })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      res.json({ success: true, user: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    user.balance = cleanBalance;
    res.json({ success: true, user });
  }
});

// ─── ADMIN: Edit User ──────────────────────────────────────────────────────────
app.post('/api/admin/users/:id/edit', authenticateUser, verifyStaff, async (req, res) => {
  const { id }               = req.params;
  const { username, email, is_staff } = req.body;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update({ username, email, is_staff: !!is_staff })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      res.json({ success: true, user: updated });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    if (username)            user.username = username;
    if (email)               user.email    = email;
    if (is_staff !== undefined) user.is_staff = is_staff;
    res.json({ success: true, user });
  }
});

// ─── ADMIN: User Inventory ─────────────────────────────────────────────────────
app.get('/api/admin/users/:id/inventory', authenticateUser, verifyStaff, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: items, error } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('user_id', id)
        .order('obtained_at', { ascending: false });

      if (error) throw error;
      res.json({ inventory: items });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.json({ inventory: localDb.inventory.filter(i => i.user_id === id).reverse() });
  }
});

// ─── ADMIN: Clear User Inventory ───────────────────────────────────────────────
app.delete('/api/admin/users/:id/inventory/clear', authenticateUser, verifyStaff, async (req, res) => {
  const { id } = req.params;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('user_id', id);

      if (error) throw error;
      res.json({ success: true, message: 'Inventory berhasil dikosongkan!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    localDb.inventory = localDb.inventory.filter(i => i.user_id !== id);
    res.json({ success: true, message: 'Inventory berhasil dikosongkan!' });
  }
});

// ─── ADMIN: Delete Single Inventory Item ───────────────────────────────────────
app.delete('/api/admin/inventory/:itemId', authenticateUser, verifyStaff, async (req, res) => {
  const { itemId } = req.params;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      res.json({ success: true, message: 'Item berhasil dihapus!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  } else {
    const index = localDb.inventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      localDb.inventory.splice(index, 1);
      res.json({ success: true, message: 'Item berhasil dihapus!' });
    } else {
      res.status(404).json({ error: 'Item tidak ditemukan' });
    }
  }
});

// ─── ONLINE USERS ──────────────────────────────────────────────────────────────
app.get('/api/users/online', async (req, res) => {
  let realUsers: any[] = [];

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin
        .from('users')
        .select('id, username, balance, is_staff');
      realUsers = data || [];
    } catch {
      realUsers = localDb.users.map(({ id, username, balance, is_staff }) => ({ id, username, balance, is_staff }));
    }
  } else {
    realUsers = localDb.users.map(({ id, username, balance, is_staff }) => ({ id, username, balance, is_staff }));
  }

  const activities = [
    'Membuka Golden Chest 🎁', 'Bertaruh di Crash Game 🚀',
    'Mendapatkan 1.82x di Crash! 🎉', 'Idle di Lobby 💬', 'Deposit 200 WL ke staff 🏦',
    'Membuka Legendary Chest 👑', 'Withdraw 1 DL sukses 💎', 'Membuka Weapon Chest ⚔️'
  ];

  const virtualUsers = [
    { id: 'v1', username: 'GrowDev_Id',    balance: 452300,   is_staff: false, activity: activities[0] },
    { id: 'v2', username: 'WLSeller99',    balance: 1250000,  is_staff: false, activity: activities[2] },
    { id: 'v3', username: 'NandX_Rich',    balance: 13540000, is_staff: false, activity: activities[3] },
    { id: 'v4', username: 'ProBreakerGT',  balance: 82500,    is_staff: false, activity: activities[1] },
    { id: 'v5', username: 'BGL_Digger',    balance: 7520000,  is_staff: false, activity: activities[4] },
    { id: 'v6', username: 'VortexWL',      balance: 35000,    is_staff: false, activity: activities[5] },
    { id: 'v7', username: 'LegendaryLox',  balance: 24500000, is_staff: false, activity: activities[6] },
    { id: 'v8', username: 'RichLockz',     balance: 8900100,  is_staff: false, activity: activities[7] },
    { id: 'v9', username: 'FarmerNoobGT',  balance: 15300,    is_staff: false, activity: activities[8] }
  ];

  const mappedRealUsers = realUsers.map((u, idx) => ({
    id:       u.id,
    username: u.username,
    balance:  parseFloat(u.balance),
    is_staff: u.is_staff,
    activity: u.is_staff ? 'Mengelola Jalannya Casino 🛠️' : activities[idx % activities.length]
  }));

  res.json({ onlineCount: mappedRealUsers.length + virtualUsers.length, players: [...mappedRealUsers, ...virtualUsers] });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FISHING ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Check if user has active fishing access
app.get('/api/fishing/check-access', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('afk_access')
        .select('*')
        .eq('user_id', userId)
        .eq('feature', 'fishing')
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      return res.json({
        hasAccess: !!data,
        access: data
      });
    } catch (error: any) {
      console.error('[FISHING] Check access error:', error);
      return res.status(500).json({ error: 'Failed to check access' });
    }
  }

  // Local fallback - no access in local mode
  res.json({ hasAccess: false, access: null });
});

// Get user fishing inventory
app.get('/api/fishing/inventory', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_fishing_inventory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // If no inventory, create one
      if (!data) {
        const { data: newInventory, error: insertError } = await supabase
          .from('user_fishing_inventory')
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) throw insertError;
        return res.json({ inventory: newInventory });
      }

      return res.json({ inventory: data });
    } catch (error: any) {
      console.error('[FISHING] Get inventory error:', error);
      return res.status(500).json({ error: 'Failed to get inventory' });
    }
  }

  // Local fallback
  res.json({
    inventory: {
      user_id: userId,
      equipped_rod: null,
      fishing_gems: 0,
      fishing_saldo: 0,
      total_fish_caught: 0
    }
  });
});

// Equip rod
app.post('/api/fishing/equip-rod', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;
  const { rod } = req.body;

  const validRods = ['ez_rod', 'basic_rod', 'thanksgiving_rod', 'golden_rod', 'lico_rod'];
  if (!validRods.includes(rod)) {
    return res.status(400).json({ error: 'Invalid rod. Valid rods: ez_rod, basic_rod, lico_rod, golden_rod, thanksgiving_rod' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.rpc('update_equipped_rod', {
        p_user_id: userId,
        p_rod: rod
      });

      if (error) throw error;

      return res.json({ success: true, equipped_rod: rod });
    } catch (error: any) {
      console.error('[FISHING] Equip rod error:', error);
      return res.status(500).json({ error: 'Failed to equip rod' });
    }
  }

  res.json({ success: true, equipped_rod: rod });
});

// Catch fish (save or sell)
app.post('/api/fishing/catch-fish', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;
  const { fish_id, fish_name, lb, is_perfect, action } = req.body;

  if (!fish_id || !fish_name || !lb || !action) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['save', 'sell'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const sellPrice = lb * 10;
      const isSold = action === 'sell';

      // Insert fish to inventory
      const { error: fishError } = await supabase
        .from('fish_inventory')
        .insert({
          user_id: userId,
          fish_id,
          fish_name,
          lb,
          is_perfect: is_perfect || false,
          is_sold: isSold,
          sell_price: isSold ? sellPrice : 0,
          sold_at: isSold ? new Date().toISOString() : null
        });

      if (fishError) throw fishError;

      // Increment total fish caught
      await supabase.rpc('increment_fish_caught', { p_user_id: userId });

      // If selling, add to saldo
      if (isSold) {
        await supabase.rpc('increment_fishing_saldo', {
          p_user_id: userId,
          p_amount: sellPrice
        });
      }

      return res.json({
        success: true,
        action,
        sell_price: isSold ? sellPrice : 0
      });
    } catch (error: any) {
      console.error('[FISHING] Catch fish error:', error);
      return res.status(500).json({ error: 'Failed to catch fish' });
    }
  }

  res.json({ success: true, action });
});

// Get fish inventory
app.get('/api/fishing/fish-inventory', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('fish_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sold', false)
        .order('caught_at', { ascending: false });

      if (error) throw error;

      return res.json({ fish: data || [] });
    } catch (error: any) {
      console.error('[FISHING] Get fish inventory error:', error);
      return res.status(500).json({ error: 'Failed to get fish inventory' });
    }
  }

  res.json({ fish: [] });
});

// Get fishing logs (history of all fish caught and sold)
app.get('/api/fishing/logs', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabase) {
    try {
      // Get all fish records for the user
      const { data: fishRecords, error: fishError } = await supabase
        .from('fish_inventory')
        .select('*')
        .eq('user_id', userId)
        .order('caught_at', { ascending: false })
        .limit(100);

      if (fishError) throw fishError;

      // Calculate statistics
      const totalCaught = fishRecords?.length || 0;
      const totalSold = fishRecords?.filter(f => f.is_sold).length || 0;
      const totalUnsold = fishRecords?.filter(f => !f.is_sold).length || 0;
      const totalValue = fishRecords?.reduce((sum, f) => sum + (f.sell_price || 0), 0) || 0;

      // Group by fish name
      const fishByType: Record<string, { count: number; totalLb: number; totalValue: number }> = {};
      fishRecords?.forEach(fish => {
        if (!fishByType[fish.fish_name]) {
          fishByType[fish.fish_name] = { count: 0, totalLb: 0, totalValue: 0 };
        }
        fishByType[fish.fish_name].count++;
        fishByType[fish.fish_name].totalLb += fish.lb;
        fishByType[fish.fish_name].totalValue += fish.sell_price || 0;
      });

      return res.json({
        logs: fishRecords || [],
        statistics: {
          totalCaught,
          totalSold,
          totalUnsold,
          totalValue,
          fishByType
        }
      });
    } catch (error: any) {
      console.error('[FISHING] Get fishing logs error:', error);
      return res.status(500).json({ error: 'Failed to get fishing logs' });
    }
  }

  res.json({
    logs: [],
    statistics: {
      totalCaught: 0,
      totalSold: 0,
      totalUnsold: 0,
      totalValue: 0,
      fishByType: {}
    }
  });
});

// Sell single fish from inventory
app.post('/api/fishing/sell-fish', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;
  const { fish_id } = req.body;

  if (!fish_id) {
    return res.status(400).json({ error: 'Missing fish_id' });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      // Get fish data
      const { data: fish, error: fetchError } = await supabase
        .from('fish_inventory')
        .select('*')
        .eq('id', fish_id)
        .eq('user_id', userId)
        .eq('is_sold', false)
        .single();

      if (fetchError || !fish) {
        return res.status(404).json({ error: 'Fish not found' });
      }

      const sellPrice = fish.lb * 10;

      // Update fish as sold
      const { error: updateError } = await supabase
        .from('fish_inventory')
        .update({
          is_sold: true,
          sell_price: sellPrice,
          sold_at: new Date().toISOString()
        })
        .eq('id', fish_id);

      if (updateError) throw updateError;

      // Add to saldo
      await supabase.rpc('increment_fishing_saldo', {
        p_user_id: userId,
        p_amount: sellPrice
      });

      return res.json({ success: true, sell_price: sellPrice });
    } catch (error: any) {
      console.error('[FISHING] Sell fish error:', error);
      return res.status(500).json({ error: 'Failed to sell fish' });
    }
  }

  res.json({ success: true });
});

// Sell all fish from inventory
app.post('/api/fishing/sell-all-fish', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabase) {
    try {
      // Get all unsold fish
      const { data: fishList, error: fetchError } = await supabase
        .from('fish_inventory')
        .select('*')
        .eq('user_id', userId)
        .eq('is_sold', false);

      if (fetchError) throw fetchError;

      if (!fishList || fishList.length === 0) {
        return res.json({ success: true, total_sold: 0, total_price: 0 });
      }

      // Calculate total price
      const totalPrice = fishList.reduce((sum, fish) => sum + (fish.lb * 10), 0);

      // Update all fish as sold (set sell_price individually)
      const updatePromises = fishList.map(fish => 
        supabase
          .from('fish_inventory')
          .update({
            is_sold: true,
            sell_price: fish.lb * 10,
            sold_at: new Date().toISOString()
          })
          .eq('id', fish.id)
      );

      await Promise.all(updatePromises);

      // Add to saldo
      await supabase.rpc('increment_fishing_saldo', {
        p_user_id: userId,
        p_amount: totalPrice
      });

      return res.json({
        success: true,
        total_sold: fishList.length,
        total_price: totalPrice
      });
    } catch (error: any) {
      console.error('[FISHING] Sell all fish error:', error);
      return res.status(500).json({ error: 'Failed to sell all fish' });
    }
  }

  res.json({ success: true, total_sold: 0, total_price: 0 });
});

// Admin: Grant fishing access
app.post('/api/admin/fishing/grant-access', authenticateUser, verifyStaff, async (req, res) => {
  const adminId = req.body._user.id;
  const { user_id, duration_days } = req.body;

  if (!user_id || !duration_days) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration_days);

      // Check if user exists
      const { data: userExists } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', user_id)
        .single();

      if (!userExists) {
        return res.status(400).json({ error: 'User not found' });
      }

      // Upsert access (update if exists, insert if not)
      const { data, error } = await supabaseAdmin
        .from('afk_access')
        .upsert({
          user_id,
          feature: 'fishing',
          is_active: true,
          expires_at: expiresAt.toISOString(),
          granted_by: adminId,
          granted_at: new Date().toISOString(),
          notes: `${duration_days} days access`
        }, {
          onConflict: 'user_id,feature'
        })
        .select()
        .single();

      if (error) {
        console.error('[ADMIN] Grant fishing access error:', error);
        return res.status(500).json({ error: error.message || 'Failed to grant access' });
      }

      console.log('[ADMIN] Fishing access granted:', user_id, duration_days, 'days');
      return res.json({ success: true, access: data });
    } catch (error: any) {
      console.error('[ADMIN] Grant fishing access error:', error);
      return res.status(500).json({ error: error.message || 'Failed to grant access' });
    }
  }

  res.json({ success: true });
});

// Admin: Get all fishing access list
app.get('/api/admin/fishing/access-list', authenticateUser, verifyStaff, async (req, res) => {
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

  res.json({ success: true, access: [] });
});

// ─── AFK FISHING WORKER ENDPOINTS ──────────────────────────────────────────────

// Import AFK fishing worker
import { startAFKFishing, stopAFKFishing, getAFKStatus, getAllActiveFishers } from './afk-fishing-worker.js';

// Start AFK fishing (server-side bot)
app.post('/api/fishing/afk/start', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;
  const username = req.body._user.username;
  const { rod } = req.body;

  if (!rod) {
    return res.status(400).json({ error: 'Missing rod parameter' });
  }

  try {
    const result = await startAFKFishing(userId, username, rod);
    res.json(result);
  } catch (error: any) {
    console.error('[AFK-FISHING] Start error:', error);
    res.status(500).json({ error: 'Failed to start AFK fishing' });
  }
});

// Stop AFK fishing
app.post('/api/fishing/afk/stop', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  try {
    const result = await stopAFKFishing(userId);
    res.json(result);
  } catch (error: any) {
    console.error('[AFK-FISHING] Stop error:', error);
    res.status(500).json({ error: 'Failed to stop AFK fishing' });
  }
});

// Get AFK fishing status
app.get('/api/fishing/afk/status', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  try {
    const status = getAFKStatus(userId);
    res.json(status);
  } catch (error: any) {
    console.error('[AFK-FISHING] Status error:', error);
    res.status(500).json({ error: 'Failed to get AFK status' });
  }
});

// Get fishing logs (recent catches)
app.get('/api/fishing/logs', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Get recent 10 fish logs
      const { data: logs, error } = await supabaseAdmin
        .from('fishing_logs')
        .select('*')
        .eq('user_id', userId)
        .order('caught_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get pending fish count
      const { data: pendingCount } = await supabaseAdmin
        .rpc('get_pending_fish_count', { p_user_id: userId });

      res.json({ logs: logs || [], pendingCount: pendingCount || 0 });
    } catch (error: any) {
      console.error('[FISHING] Get logs error:', error);
      res.status(500).json({ error: 'Failed to get fishing logs' });
    }
  } else {
    res.json({ logs: [], pendingCount: 0 });
  }
});

// Claim pending fish - DEPRECATED (fish are auto-claimed now)
app.post('/api/fishing/claim-pending', authenticateUser, async (req, res) => {
  // Fish are automatically added to logs, no need to claim
  res.json({ success: true, claimed: [] });
});

// Admin: Get all active fishers
app.get('/api/admin/fishing/active', authenticateUser, verifyStaff, async (req, res) => {
  try {
    const fishers = getAllActiveFishers();
    res.json({ fishers });
  } catch (error: any) {
    console.error('[AFK-FISHING] Get active fishers error:', error);
    res.status(500).json({ error: 'Failed to get active fishers' });
  }
});

// Admin: Revoke fishing access
app.post('/api/admin/fishing/revoke-access', authenticateUser, verifyStaff, async (req, res) => {
  const { access_id } = req.body;

  if (!access_id) {
    return res.status(400).json({ error: 'Missing access_id' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('afk_access')
        .update({ is_active: false })
        .eq('id', access_id);

      if (error) throw error;

      return res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Revoke fishing access error:', error);
      return res.status(500).json({ error: 'Failed to revoke access' });
    }
  }

  res.json({ success: true });
});

// ─── FISHING V2: USER ROD ACCESS ────────────────────────────────────────────

// Get user's available rods
app.get('/api/fishing/user-rods', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Get user's rod access
      const { data: rodAccess, error } = await supabaseAdmin
        .from('user_rod_access')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Basic rod is always available
      const rods = [
        {
          rod_id: 'basic_rod',
          rod_name: 'Basic Rod',
          is_active: true,
          granted_at: new Date().toISOString()
        },
        ...(rodAccess || []).map(r => ({
          rod_id: r.rod_id,
          rod_name: r.rod_id.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          is_active: r.is_active,
          granted_at: r.granted_at
        }))
      ];

      res.json({ rods });
    } catch (error: any) {
      console.error('[FISHING] Get user rods error:', error);
      res.status(500).json({ error: 'Failed to get user rods' });
    }
  } else {
    // Default: only basic rod
    res.json({ rods: [{ rod_id: 'basic_rod', rod_name: 'Basic Rod', is_active: true }] });
  }
});

// ─── FISHING V2: CONVERT SALDO ──────────────────────────────────────────────

// Convert fishing_saldo to main balance
app.post('/api/fishing/convert-saldo', authenticateUser, async (req, res) => {
  const userId = req.body._user.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Get current fishing inventory
      const { data: inventory, error: invError } = await supabaseAdmin
        .from('user_fishing_inventory')
        .select('fishing_saldo')
        .eq('user_id', userId)
        .single();

      if (invError) throw invError;

      const currentFishingSaldo = parseFloat(inventory?.fishing_saldo || '0');

      if (currentFishingSaldo < amount) {
        return res.status(400).json({ error: 'Insufficient fishing balance' });
      }

      // Deduct from fishing_saldo
      const { error: deductError } = await supabaseAdmin
        .from('user_fishing_inventory')
        .update({ 
          fishing_saldo: currentFishingSaldo - amount 
        })
        .eq('user_id', userId);

      if (deductError) throw deductError;

      // Add to main balance
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const currentBalance = parseFloat(user?.balance || '0');
      const newBalance = currentBalance + amount;

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      console.log(`[FISHING] User ${userId} converted ${amount} WL from fishing to main balance`);

      res.json({ 
        success: true, 
        fishing_saldo: currentFishingSaldo - amount,
        main_balance: newBalance,
        converted_amount: amount
      });
    } catch (error: any) {
      console.error('[FISHING] Convert saldo error:', error);
      res.status(500).json({ error: 'Failed to convert saldo' });
    }
  } else {
    res.status(500).json({ error: 'Database not configured' });
  }
});

// ─── FISHING V2: ADMIN ROD MANAGEMENT ───────────────────────────────────────

// Get user's rod access (admin)
app.get('/api/admin/fishing/user-rods/:userId', authenticateUser, verifyStaff, async (req, res) => {
  const { userId } = req.params;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_rod_access')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      res.json({ rods: data || [] });
    } catch (error: any) {
      console.error('[ADMIN] Get user rod access error:', error);
      res.status(500).json({ error: 'Failed to get user rod access' });
    }
  } else {
    res.json({ rods: [] });
  }
});

// Grant rod access to user
app.post('/api/admin/fishing/grant-rod', authenticateUser, verifyStaff, async (req, res) => {
  const adminId = req.body._user.id;
  const { user_id, rod_id, notes } = req.body;

  if (!user_id || !rod_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate rod_id
  const validRods = ['ez_rod', 'basic_rod', 'lico_rod', 'golden_rod', 'thanksgiving_rod'];
  if (!validRods.includes(rod_id)) {
    return res.status(400).json({ error: 'Invalid rod_id. Valid rods: ez_rod, basic_rod, lico_rod, golden_rod, thanksgiving_rod' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Use upsert to handle existing records
      const { data, error } = await supabaseAdmin
        .from('user_rod_access')
        .upsert({
          user_id,
          rod_id,
          granted_by: adminId,
          granted_at: new Date().toISOString(),
          is_active: true,
          notes
        }, {
          onConflict: 'user_id,rod_id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`[ADMIN] Granted ${rod_id} to user ${user_id}`);
      res.json({ success: true, rod: data });
    } catch (error: any) {
      console.error('[ADMIN] Grant rod error:', error);
      res.status(500).json({ error: 'Failed to grant rod access' });
    }
  } else {
    res.json({ success: true });
  }
});

// Revoke rod access from user
app.post('/api/admin/fishing/revoke-rod', authenticateUser, verifyStaff, async (req, res) => {
  const { user_id, rod_id } = req.body;

  if (!user_id || !rod_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('user_rod_access')
        .update({ is_active: false })
        .eq('user_id', user_id)
        .eq('rod_id', rod_id);

      if (error) throw error;

      console.log(`[ADMIN] Revoked ${rod_id} from user ${user_id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Revoke rod error:', error);
      res.status(500).json({ error: 'Failed to revoke rod access' });
    }
  } else {
    res.json({ success: true });
  }
});

// Grant bait to user
app.post('/api/admin/fishing/grant-bait', authenticateUser, verifyStaff, async (req, res) => {
  console.log('[ADMIN] Grant bait endpoint called');
  const adminId = req.body._user.id;
  const { user_id, amount, notes } = req.body;

  console.log('[ADMIN] Grant bait request:', { user_id, amount, notes, adminId });

  if (!user_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields: user_id and amount' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      console.log('[ADMIN] ═══════════════════════════════════════════════════');
      console.log('[ADMIN] Grant Bait Request Started');
      console.log('[ADMIN] User ID:', user_id);
      console.log('[ADMIN] Amount:', amount);
      console.log('[ADMIN] Admin ID:', adminId);
      console.log('[ADMIN] Notes:', notes || 'none');
      console.log('[ADMIN] ═══════════════════════════════════════════════════');
      
      // Check if user_fishing_inventory exists first
      const { data: existingInventory, error: checkError } = await supabaseAdmin
        .from('user_fishing_inventory')
        .select('*')
        .eq('user_id', user_id)
        .maybeSingle();
      
      if (checkError) {
        console.error('[ADMIN] Error checking existing inventory:', checkError);
      } else {
        console.log('[ADMIN] Existing inventory:', existingInventory);
      }
      
      console.log('[ADMIN] Calling grant_bait RPC...');
      
      // Call grant_bait function
      const { data, error } = await supabaseAdmin.rpc('grant_bait', {
        p_user_id: user_id,
        p_amount: amount,
        p_granted_by: adminId,
        p_notes: notes || null
      });

      if (error) {
        console.error('[ADMIN] ❌ Grant bait RPC error:', error);
        console.error('[ADMIN] Error code:', error.code);
        console.error('[ADMIN] Error message:', error.message);
        console.error('[ADMIN] Error details:', error.details);
        console.error('[ADMIN] Error hint:', error.hint);
        throw error;
      }

      console.log('[ADMIN] ✅ Grant bait RPC success! New balance:', data);
      
      // Verify the update
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from('user_fishing_inventory')
        .select('*')
        .eq('user_id', user_id)
        .single();
      
      if (verifyError) {
        console.error('[ADMIN] ❌ Verification error:', verifyError);
      } else {
        console.log('[ADMIN] ✅ Verified inventory:', verifyData);
        console.log('[ADMIN] ✅ Bait balance:', verifyData.bait_balance);
      }
      
      console.log('[ADMIN] ═══════════════════════════════════════════════════');
      console.log('[ADMIN] Grant Bait Completed Successfully!');
      console.log('[ADMIN] ═══════════════════════════════════════════════════');
      
      res.json({ success: true, new_balance: data });
    } catch (error: any) {
      console.error('[ADMIN] ❌❌❌ Grant bait error:', error);
      console.error('[ADMIN] Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to grant bait: ' + error.message });
    }
  } else {
    console.log('[ADMIN] ⚠️ Supabase not configured, using mock response');
    res.json({ success: true, new_balance: amount });
  }
});

// Get user fishing inventory (for admin)
app.get('/api/admin/fishing/user-inventory/:userId', authenticateUser, verifyStaff, async (req, res) => {
  const { userId } = req.params;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_fishing_inventory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      res.json({ success: true, inventory: data });
    } catch (error: any) {
      console.error('[ADMIN] Get user inventory error:', error);
      res.status(500).json({ error: 'Failed to get user inventory' });
    }
  } else {
    res.json({ success: true, inventory: { bait_balance: 0 } });
  }
});

// ─── FISHING V2: ADMIN PRICE CONFIGURATION ──────────────────────────────────

// Get price configuration
app.get('/api/admin/fishing/price-config', authenticateUser, verifyStaff, async (req, res) => {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('fishing_price_config')
        .select('*')
        .order('lb_min', { ascending: true });

      if (error) throw error;

      res.json({ config: data || [] });
    } catch (error: any) {
      console.error('[ADMIN] Get price config error:', error);
      res.status(500).json({ error: 'Failed to get price config' });
    }
  } else {
    // Return default config
    res.json({
      config: [
        { id: '1', lb_min: 1, lb_max: 20, price_per_lb: 5, label: '1-20 LB' },
        { id: '2', lb_min: 21, lb_max: 50, price_per_lb: 11, label: '21-50 LB' },
        { id: '3', lb_min: 51, lb_max: 90, price_per_lb: 20, label: '51-90 LB' },
        { id: '4', lb_min: 91, lb_max: 150, price_per_lb: 47, label: '91-150 LB' },
        { id: '5', lb_min: 151, lb_max: 200, price_per_lb: 60, label: '151-200 LB' }
      ]
    });
  }
});

// Update price configuration
app.post('/api/admin/fishing/price-config', authenticateUser, verifyStaff, async (req, res) => {
  const adminId = req.body._user.id;
  const { config } = req.body;

  if (!config || !Array.isArray(config)) {
    return res.status(400).json({ error: 'Invalid config format' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Update each tier
      const updates = config.map(tier => 
        supabaseAdmin
          .from('fishing_price_config')
          .update({
            price_per_lb: tier.price_per_lb,
            updated_at: new Date().toISOString(),
            updated_by: adminId
          })
          .eq('id', tier.id)
      );

      await Promise.all(updates);

      console.log(`[ADMIN] Updated price config by ${adminId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Update price config error:', error);
      res.status(500).json({ error: 'Failed to update price config' });
    }
  } else {
    res.json({ success: true });
  }
});

// Reset price configuration to default
app.post('/api/admin/fishing/price-config/reset', authenticateUser, verifyStaff, async (req, res) => {
  const adminId = req.body._user.id;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Delete all existing config
      await supabaseAdmin.from('fishing_price_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert default config
      const { error } = await supabaseAdmin
        .from('fishing_price_config')
        .insert([
          { lb_min: 1, lb_max: 20, price_per_lb: 5, label: '1-20 LB', updated_by: adminId },
          { lb_min: 21, lb_max: 50, price_per_lb: 11, label: '21-50 LB', updated_by: adminId },
          { lb_min: 51, lb_max: 90, price_per_lb: 20, label: '51-90 LB', updated_by: adminId },
          { lb_min: 91, lb_max: 150, price_per_lb: 47, label: '91-150 LB', updated_by: adminId },
          { lb_min: 151, lb_max: 200, price_per_lb: 60, label: '151-200 LB', updated_by: adminId }
        ]);

      if (error) throw error;

      console.log(`[ADMIN] Reset price config to default by ${adminId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error('[ADMIN] Reset price config error:', error);
      res.status(500).json({ error: 'Failed to reset price config' });
    }
  } else {
    res.json({ success: true });
  }
});

// ─── SEED ADMIN ────────────────────────────────────────────────────────────────
async function seedAdminUser() {
  const email    = 'satriarizkyananda27@gmail.com';
  const username = 'nanddev';
  const password = 'nanda900';
  const startingBalance = 5000000;

  // Local memory seed
  const existingLocal = localDb.users.find(u => u.username === 'nanddev' || u.email === email);
  if (!existingLocal) {
    localDb.users.push({
      id: 'd9ea2b02-cd12-4017-bfbe-0df39a67c9c9',
      email, username,
      password: hashPassword(password),
      balance:  startingBalance,
      is_staff: true,
      created_at: new Date().toISOString()
    });
    console.log('[LOCAL SEED] Seeded local admin nanddev.');
  }

  // Supabase seed - DISABLED (use SQL script instead)
  // Run SCHEMA_FINAL_FIXED.sql to create admin user
  if (isSupabaseConfigured && supabase) {
    try {
      // Check if public.users table is accessible
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (checkError) {
        console.log('[SUPABASE] Users table not accessible. Run SCHEMA_FINAL_FIXED.sql in Supabase SQL Editor.');
        return;
      }

      // Check if admin already exists in public.users
      const { data: existing } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('username', username)
        .maybeSingle();

      if (existing) {
        console.log('[SUPABASE] Admin user exists:', existing.username, '/', existing.email);
        return;
      }

      console.log('[SUPABASE] Admin user not found. Please run SCHEMA_FINAL_FIXED.sql to create it.');
      console.log('[SUPABASE] Then create user in Supabase Auth: satriarizkyananda27@gmail.com / nanda900');
    } catch (e: any) {
      console.log('[SUPABASE ERROR]', e.message || e);
    }
  }
}

// ─── START SERVER ──────────────────────────────────────────────────────────────
async function startServer() {
  await seedAdminUser();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`[SERVER RUNNING] Full-stack Server successfully started on http://0.0.0.0:${PORT}`);
    
    // Resume active AFK fishing sessions after server restart
    const { resumeActiveSessions } = await import('./afk-fishing-worker.js');
    setTimeout(async () => {
      await resumeActiveSessions();
    }, 2000); // Wait 2 seconds for server to fully initialize
  });
}

startServer();