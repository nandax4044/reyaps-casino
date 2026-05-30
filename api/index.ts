// Vercel Serverless Function Handler
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load default configs from JSON files
let caseOpeningDefault: any;
let rodaDefault: any;
let permainanDefault: any;

try {
  // Try to load from files (for Vercel)
  const apiDir = __dirname || process.cwd();
  caseOpeningDefault = JSON.parse(readFileSync(join(apiDir, 'case_opening.json'), 'utf-8'));
  rodaDefault = JSON.parse(readFileSync(join(apiDir, 'roda.json'), 'utf-8'));
  permainanDefault = JSON.parse(readFileSync(join(apiDir, 'permainan.json'), 'utf-8'));
} catch (e) {
  // Fallback to minimal data if files not found
  console.error('[CONFIG] Failed to load JSON files:', e);
  caseOpeningDefault = {
    chests: [
      {
        id: "fishing",
        name: "Fishing Chest",
        price: 50,
        icon: "🎣",
        color: "from-cyan-500 to-blue-600",
        image: "/images/fishing_chest.png",
        items: [
          { name: "Wigly", rarity: "Common", chance: 60, value: 5, icon: "🥾", color: "#a1a1aa", image: "/images/wigly.png" },
          { name: "Cotd", rarity: "Rare", chance: 25, value: 30, icon: "🐟", color: "#3b82f6", image: "/images/cotd.png" },
          { name: "Golden Rod", rarity: "Epic", chance: 10, value: 2500, icon: "🧵", color: "#a855f7", image: "/images/goldenrod.png" },
          { name: "Fishing Hat", rarity: "Legendary", chance: 4, value: 7000, icon: "🎣", color: "#eab308", image: "/images/hatfishing.png" }
        ]
      }
    ],
    gameSettings: {
      defaultSpinDurationMs: 5500,
      fastSpinDurationMs: 1500,
      soundTickFrequencyHz: 220,
      pointerShadowGlowHex: "#38bdf8",
      spinEasing: "cubic-bezier(0.04, 0.84, 0.12, 1)"
    }
  };
  rodaDefault = {
    prizes: [
      { id: "1", name: "Diamond Lock", icon: "💎", rarity: "Legendary", value: 100, chance: 5, image: "/images/diamond_lock.png", color: "#eab308" },
      { id: "2", name: "World Lock", icon: "🔒", rarity: "Rare", value: 10, chance: 20, image: "/images/world_lock.png", color: "#3b82f6" },
      { id: "3", name: "Dirt", icon: "🟫", rarity: "Common", value: 1, chance: 40, image: "/images/dirt.png", color: "#a1a1aa" }
    ]
  };
  permainanDefault = {
    prizes: [
      { name: "Cosmic Dust", rarity: "Common", value: 100, icon: "🧪", image: "https://picsum.photos/seed/stardust/150/150" },
      { name: "Nebula Fragment", rarity: "Rare", value: 500, icon: "💫", image: "https://picsum.photos/seed/nebula/150/150" }
    ]
  };
}

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
    wheel: JSON.parse(JSON.stringify(rodaDefault)),
    crash: JSON.parse(JSON.stringify(permainanDefault))
  } as Record<string, any>
};

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, method, body, headers } = req;
  const path = url.replace('/api', '');

  try {
    // Route handling
    if (path === '/health') {
      return res.json({
        status: 'ok',
        database: isSupabaseConfigured ? 'supabase' : 'local_memory',
        supabaseUrl: isSupabaseConfigured ? supabaseUrl : null
      });
    }

    // Auth routes
    if (path === '/auth/register' && method === 'POST') {
      return await handleRegister(body, res);
    }

    if (path === '/auth/login' && method === 'POST') {
      return await handleLogin(body, res);
    }

    // Protected routes (require auth)
    const authHeader = headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateToken(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
    }

    // User routes
    if (path === '/user/profile' && method === 'GET') {
      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser, database: isSupabaseConfigured ? 'supabase' : 'mock_memory' });
    }

    if (path === '/user/inventory' && method === 'GET') {
      return await handleGetInventory(user.id, res);
    }

    if (path === '/user/withdraw' && method === 'POST') {
      return await handleWithdraw(user.id, body, res);
    }

    if (path === '/user/deduct' && method === 'POST') {
      return await handleDeduct(user, body, res);
    }

    if (path === '/user/add-win' && method === 'POST') {
      return await handleAddWin(user, body, res);
    }

    // Game config routes
    if (path.startsWith('/games/config/') && method === 'GET') {
      const gameType = path.split('/').pop();
      return await handleGetConfig(gameType, res);
    }

    // Admin routes
    if (path.startsWith('/admin/')) {
      if (!user.is_staff) {
        return res.status(403).json({ error: 'Akses Ditolak: Anda bukan staff/admin!' });
      }

      if (path === '/admin/users' && method === 'GET') {
        return await handleGetUsers(res);
      }

      if (path.match(/\/admin\/users\/[^/]+\/balance/) && method === 'POST') {
        const userId = path.split('/')[3];
        return await handleUpdateBalance(userId, body, res);
      }

      if (path.match(/\/admin\/users\/[^/]+\/edit/) && method === 'POST') {
        const userId = path.split('/')[3];
        return await handleEditUser(userId, body, res);
      }

      if (path.match(/\/admin\/users\/[^/]+\/inventory$/) && method === 'GET') {
        const userId = path.split('/')[3];
        return await handleGetInventory(userId, res);
      }

      if (path.match(/\/admin\/users\/[^/]+\/inventory\/clear/) && method === 'DELETE') {
        const userId = path.split('/')[3];
        return await handleClearInventory(userId, res);
      }

      if (path.match(/\/admin\/inventory\/[^/]+/) && method === 'DELETE') {
        const itemId = path.split('/').pop();
        return await handleDeleteItem(itemId, res);
      }

      if (path.match(/\/admin\/config\/[^/]+\/update/) && method === 'POST') {
        const gameType = path.split('/')[3];
        return await handleUpdateConfig(gameType, body, res);
      }

      if (path.match(/\/admin\/config\/[^/]+\/reset/) && method === 'POST') {
        const gameType = path.split('/')[3];
        return await handleResetConfig(gameType, res);
      }
    }

    // Online users
    if (path === '/users/online' && method === 'GET') {
      return await handleOnlineUsers(res);
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error: any) {
    console.error('[API ERROR]', error);
    console.error('[API ERROR STACK]', error.stack);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}


// ─── Authentication Helper ─────────────────────────────────────────────────────
async function authenticateToken(token: string) {
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

// ─── Register Handler ──────────────────────────────────────────────────────────
async function handleRegister(body: any, res: any) {
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
        const token = sessionToken || authUserId;
        const { password: _, ...safeUser } = merged as any;
        return res.json({ success: true, user: safeUser, token });
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
          balance: 500.00,
          is_staff: false
        })
        .select('*')
        .single();

      if (manualError) {
        return res.status(500).json({ error: 'Akun dibuat tapi profil gagal disimpan: ' + manualError.message });
      }

      const token = sessionToken || authUserId;
      const { password: _, ...safeManualUser } = manualUser as any;
      return res.json({ success: true, user: safeManualUser, token });

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
      balance: 1000.00,
      is_staff: slugUsername === 'admin' || localDb.users.length === 0,
      created_at: new Date().toISOString()
    };

    localDb.users.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return res.json({ success: true, user: safeUser, token: newUser.id });
  }
}

// ─── Login Handler ─────────────────────────────────────────────────────────────
async function handleLogin(body: any, res: any) {
  console.log('[LOGIN] Request received:', { loginKey: body?.loginKey, hasPassword: !!body?.password });
  
  const { loginKey, password } = body;

  if (!loginKey || !password) {
    console.log('[LOGIN] Missing credentials');
    return res.status(400).json({ error: 'Email/Username dan Password wajib diisi!' });
  }

  const slugKey = loginKey.trim().toLowerCase();
  console.log('[LOGIN] Attempting login for:', slugKey);

  if (isSupabaseConfigured && supabase) {
    try {
      let loginEmail = slugKey;

      if (!slugKey.includes('@')) {
        console.log('[LOGIN] Looking up username:', slugKey);
        const { data: foundUser, error: findError } = await supabase
          .from('users')
          .select('email')
          .eq('username', slugKey)
          .maybeSingle();

        if (findError) {
          console.error('[LOGIN] Username lookup error:', findError);
          return res.status(400).json({ error: 'Akun tidak ditemukan!' });
        }
        
        if (!foundUser) {
          console.log('[LOGIN] Username not found:', slugKey);
          return res.status(400).json({ error: 'Akun tidak ditemukan!' });
        }

        loginEmail = foundUser.email;
        console.log('[LOGIN] Found email for username:', loginEmail);
      }

      console.log('[LOGIN] Attempting Supabase auth with email:', loginEmail);
      const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });

      if (signInError) {
        console.error('[LOGIN] Supabase auth error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          return res.status(400).json({ error: 'Email/Username atau Password salah!' });
        }
        return res.status(400).json({ error: signInError.message });
      }

      if (!sessionData?.user || !sessionData?.session) {
        console.error('[LOGIN] No session data returned');
        return res.status(400).json({ error: 'Login gagal. Coba lagi.' });
      }

      console.log('[LOGIN] Auth successful, fetching user profile:', sessionData.user.id);
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.user.id)
        .single();

      if (userError) {
        console.error('[LOGIN] User profile fetch error:', userError);
        return res.status(400).json({ error: 'Profil user tidak ditemukan!' });
      }
      
      if (!user) {
        console.error('[LOGIN] User profile not found');
        return res.status(400).json({ error: 'Profil user tidak ditemukan!' });
      }

      console.log('[LOGIN] Login successful for user:', user.username);
      const { password: _, ...safeUser } = user as any;
      return res.json({
        success: true,
        user: safeUser,
        token: sessionData.session.access_token
      });

    } catch (e: any) {
      console.error('[LOGIN] Exception:', e);
      return res.status(500).json({ error: 'Database service failure: ' + e.message });
    }
  } else {
    console.log('[LOGIN] Using local memory mode');
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
}


// ─── Get Inventory Handler ─────────────────────────────────────────────────────
async function handleGetInventory(userId: string, res: any) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: items, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: false });

      if (error) throw error;
      return res.json({ inventory: items });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const items = localDb.inventory.filter(i => i.user_id === userId);
    return res.json({ inventory: [...items].reverse() });
  }
}

// ─── Withdraw Handler ──────────────────────────────────────────────────────────
async function handleWithdraw(userId: string, body: any, res: any) {
  const { itemId } = body;

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
      return res.json({ success: true, item: updatedItem });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const item = localDb.inventory.find(i => i.id === itemId && i.user_id === userId);
    if (!item) return res.status(404).json({ error: 'Item tidak ditemukan di inventory Anda' });
    if (item.status !== 'available') return res.status(400).json({ error: 'Status item ini sudah dalam proses WD!' });
    item.status = 'requested_withdraw';
    return res.json({ success: true, item });
  }
}

// ─── Deduct Balance Handler ────────────────────────────────────────────────────
async function handleDeduct(user: any, body: any, res: any) {
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
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', user.id)
        .select('balance')
        .single();

      if (error) throw error;
      return res.json({ success: true, balance: updatedUser.balance });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const userInDb = localDb.users.find(u => u.id === user.id);
    if (userInDb) {
      userInDb.balance = newBalance;
      return res.json({ success: true, balance: newBalance });
    }
    return res.status(404).json({ error: 'User not found' });
  }
}

// ─── Add Win Handler ───────────────────────────────────────────────────────────
async function handleAddWin(user: any, body: any, res: any) {
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
    try {
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
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    let invItem: any = null;
    if (name) {
      invItem = {
        id: crypto.randomUUID(),
        user_id: user.id,
        item_name: name,
        rarity: rarity || 'Common',
        value: value || 0,
        icon: icon || '🎁',
        image: image || '',
        obtained_at: new Date().toISOString(),
        status: 'available'
      };
      localDb.inventory.push(invItem);
    }
    const userInDb = localDb.users.find(u => u.id === user.id);
    if (userInDb) userInDb.balance = finalBalance;
    return res.json({ success: true, inventoryItem: invItem, balance: finalBalance });
  }
}

// ─── Get Config Handler ────────────────────────────────────────────────────────
async function handleGetConfig(gameType: string | undefined, res: any) {
  if (!gameType) {
    return res.status(400).json({ error: 'Game type required' });
  }

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
      console.log(`[CONFIG] Exception for ${gameType}:`, e.message);
    }
  }

  if (gameType === 'cases') return res.json(caseOpeningDefault);
  if (gameType === 'wheel') return res.json(rodaDefault);
  if (gameType === 'crash') return res.json(permainanDefault);
  return res.status(404).json({ error: 'Config type unknown' });
}


// ─── Get Users Handler ─────────────────────────────────────────────────────────
async function handleGetUsers(res: any) {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: list, error } = await supabaseAdmin
        .from('users')
        .select('id, email, username, balance, is_staff, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ users: list });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    return res.json({ users: localDb.users.map(({ password, ...u }) => u).reverse() });
  }
}

// ─── Update Balance Handler ────────────────────────────────────────────────────
async function handleUpdateBalance(userId: string, body: any, res: any) {
  const cleanBalance = parseFloat(body.balance);

  if (isNaN(cleanBalance)) {
    return res.status(400).json({ error: 'Saldo tidak valid!' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update({ balance: cleanBalance })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return res.json({ success: true, user: updated });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    user.balance = cleanBalance;
    return res.json({ success: true, user });
  }
}

// ─── Edit User Handler ─────────────────────────────────────────────────────────
async function handleEditUser(userId: string, body: any, res: any) {
  const { username, email, is_staff } = body;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updated, error } = await supabaseAdmin
        .from('users')
        .update({ username, email, is_staff: !!is_staff })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return res.json({ success: true, user: updated });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
    if (username) user.username = username;
    if (email) user.email = email;
    if (is_staff !== undefined) user.is_staff = is_staff;
    return res.json({ success: true, user });
  }
}

// ─── Clear Inventory Handler ───────────────────────────────────────────────────
async function handleClearInventory(userId: string, res: any) {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return res.json({ success: true, message: 'Inventory berhasil dikosongkan!' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    localDb.inventory = localDb.inventory.filter(i => i.user_id !== userId);
    return res.json({ success: true, message: 'Inventory berhasil dikosongkan!' });
  }
}

// ─── Delete Item Handler ───────────────────────────────────────────────────────
async function handleDeleteItem(itemId: string | undefined, res: any) {
  if (!itemId) {
    return res.status(400).json({ error: 'Item ID required' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return res.json({ success: true, message: 'Item berhasil dihapus!' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const index = localDb.inventory.findIndex(i => i.id === itemId);
    if (index !== -1) {
      localDb.inventory.splice(index, 1);
      return res.json({ success: true, message: 'Item berhasil dihapus!' });
    }
    return res.status(404).json({ error: 'Item tidak ditemukan' });
  }
}

// ─── Update Config Handler ─────────────────────────────────────────────────────
async function handleUpdateConfig(gameType: string, body: any, res: any) {
  const configPayload = body.config;

  if (!configPayload) {
    return res.status(400).json({ error: 'Payload config data kosong' });
  }

  const client = supabaseAdmin || supabase;

  if (isSupabaseConfigured && client) {
    try {
      const { error } = await client
        .from('game_configs')
        .upsert({
          game_type: gameType,
          config_data: configPayload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'game_type' });

      if (error) throw error;
      return res.json({ success: true, message: `Berhasil mengupdate konfigurasi ${gameType}!` });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[gameType] = JSON.parse(JSON.stringify(configPayload));
    return res.json({ success: true, message: `Berhasil mengupdate konfigurasi ${gameType} di memori lokal!` });
  }
}

// ─── Reset Config Handler ──────────────────────────────────────────────────────
async function handleResetConfig(gameType: string, res: any) {
  let defaultConfig: any = null;
  if (gameType === 'cases') defaultConfig = caseOpeningDefault;
  else if (gameType === 'wheel') defaultConfig = rodaDefault;
  else if (gameType === 'crash') defaultConfig = permainanDefault;
  else return res.status(404).json({ error: 'Game type tidak dikenal' });

  const client = supabaseAdmin || supabase;

  if (isSupabaseConfigured && client) {
    try {
      await client
        .from('game_configs')
        .delete()
        .eq('game_type', gameType);

      const { error } = await client
        .from('game_configs')
        .insert({
          game_type: gameType,
          config_data: defaultConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return res.json({ success: true, message: `Config ${gameType} berhasil direset ke default!`, config: defaultConfig });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[gameType] = JSON.parse(JSON.stringify(defaultConfig));
    return res.json({ success: true, message: `Config ${gameType} berhasil direset!`, config: defaultConfig });
  }
}

// ─── Online Users Handler ──────────────────────────────────────────────────────
async function handleOnlineUsers(res: any) {
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
    'Membuka Golden Chest 🎁',
    'Memutar Roda Hadiah 🎡',
    'Bertaruh di Crash Game 🚀',
    'Mendapatkan 1.82x di Crash! 🎉',
    'Idle di Lobby 💬',
    'Deposit 200 WL ke staff 🏦',
    'Membuka Legendary Chest 👑',
    'Withdraw 1 DL sukses 💎',
    'Membuka Weapon Chest ⚔️'
  ];

  const virtualUsers = [
    { id: 'v1', username: 'GrowDev_Id', balance: 452300, is_staff: false, activity: activities[0] },
    { id: 'v2', username: 'WLSeller99', balance: 1250000, is_staff: false, activity: activities[2] },
    { id: 'v3', username: 'NandX_Rich', balance: 13540000, is_staff: false, activity: activities[3] }
  ];

  const combined = [...realUsers.slice(0, 5), ...virtualUsers];
  return res.json({ users: combined });
}
