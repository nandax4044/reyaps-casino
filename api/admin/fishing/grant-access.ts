import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function authenticateToken(token: string) {
  try {
    const isJWT = token.length > 100 && token.startsWith('eyJ');
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
    
    let userId: string | null = null;
    
    if (isJWT) {
      const { data: authData } = await supabase.auth.getUser(token);
      if (!authData?.user) return null;
      userId = authData.user.id;
    } else if (isUUID) {
      userId = token;
    } else {
      return null;
    }

    const { data: user } = await supabaseAdmin.from('users').select('*').eq('id', userId).single();
    return user;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const user = await authenticateToken(token);
    
    if (!user || !user.is_staff) {
      return res.status(403).json({ error: 'Forbidden - Admin only' });
    }

    const { user_id, duration_days } = req.body;

    if (!user_id || !duration_days) {
      return res.status(400).json({ error: 'user_id and duration_days required' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(duration_days));

    const { data, error } = await supabaseAdmin
      .from('fishing_access')
      .upsert({
        user_id,
        expires_at: expiresAt.toISOString(),
        granted_by: user.id,
        granted_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, access: data });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
