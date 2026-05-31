import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

import caseOpeningDefault from './src/data/case_opening.json' assert { type: 'json' };
import permainanDefault from './src/data/permainan.json' assert { type: 'json' };

const app = express();
const PORT = 3000;

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
        const { data: foundUser, error: findError } = await supabase
          .from('users')
          .select('email')
          .eq('username', slugKey)
          .maybeSingle();

        if (findError || !foundUser) {
          return res.status(400).json({ error: 'Akun tidak ditemukan!' });
        }

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

  // Supabase seed — uses signUp (anon key) instead of auth.admin.createUser (service role)
  if (isSupabaseConfigured && supabase) {
    try {
      // Check if public.users table is accessible
      const { error: checkError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (checkError) {
        console.log('[SUPABASE CONNECTION INFO] Users table not accessible. Run schema.sql in your Supabase SQL Editor first.');
        return;
      }

      // Check if admin already exists in public.users
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        // Already exists — ensure is_staff and balance are correct via service role if available
        if (supabaseAdmin) {
          await supabaseAdmin
            .from('users')
            .update({ is_staff: true, balance: startingBalance })
            .eq('email', email);
        }
        console.log('[SUPABASE SEED] Admin nanddev already exists — updated is_staff & balance.');
        return;
      }

      // ① Try signUp — returns a session JWT we can use to satisfy RLS (auth.uid() = id)
      let authUserId: string | null = null;
      let sessionToken: string | null = null;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (signUpError) {
        // User already exists in auth.users — sign in to get session
        console.log('[SUPABASE SEED] signUp failed:', signUpError.message, '— trying signIn...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.log('[SUPABASE SEED] signIn also failed:', signInError.message);
        } else {
          authUserId   = signInData?.user?.id || null;
          sessionToken = signInData?.session?.access_token || null;
        }
      } else {
        authUserId   = signUpData?.user?.id || null;
        sessionToken = signUpData?.session?.access_token || null;
      }

      if (!authUserId) {
        console.log('[SUPABASE SEED] Could not obtain auth user ID — seed skipped.');
        return;
      }

      // ② Wait briefly for the DB trigger (handle_new_user) to fire
      await new Promise(r => setTimeout(r, 800));

      // ③ Upsert the profile row.
      //    Priority: service role client (bypasses RLS) > user's own JWT (satisfies RLS) > skip
      let upsertClient = supabaseAdmin; // service role bypasses RLS entirely

      if (!upsertClient && sessionToken) {
        // No service role key — create a temporary client authenticated as the user
        // This satisfies the RLS policy: auth.uid() = id
        upsertClient = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${sessionToken}` } },
          auth:   { autoRefreshToken: false, persistSession: false }
        });
      }

      if (!upsertClient) {
        console.log('[SUPABASE SEED] No client available to upsert profile — add SUPABASE_SERVICE_KEY to .env.');
        return;
      }

      const { error: upsertError } = await upsertClient
        .from('users')
        .upsert({
          id:       authUserId,
          email,
          username,
          balance:  startingBalance,
          is_staff: true
        }, { onConflict: 'id' });

      if (upsertError) {
        console.log('[SUPABASE SEED] Profile upsert failed:', upsertError.message);
      } else {
        console.log('[SUPABASE SEED] Successfully seeded admin nanddev!');
      }
    } catch (e: any) {
      console.log('[SUPABASE SEED ERROR] Skipping:', e.message || e);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER RUNNING] Full-stack Server successfully started on http://0.0.0.0:${PORT}`);
  });
}

startServer();