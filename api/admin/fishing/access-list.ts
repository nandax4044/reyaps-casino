import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function authenticateToken(token: string) {
  try {
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData?.user) return null;
    const { data: user } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
    return user;
  } catch (e) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

    const { data, error } = await supabase
      .from('fishing_access')
      .select(`
        *,
        users:user_id (username, email)
      `)
      .order('granted_at', { ascending: false });

    if (error) throw error;
    return res.json({ access_list: data || [] });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
