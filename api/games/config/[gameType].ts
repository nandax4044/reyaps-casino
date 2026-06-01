import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Default configs
const defaultConfigs: any = {
  cases: { published: true },
  crash: { published: true }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameType } = req.query;
    
    if (!gameType || (gameType !== 'cases' && gameType !== 'crash')) {
      return res.status(400).json({ error: 'Config type unknown' });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('game_configs')
        .select('*')
        .eq('game_type', gameType)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return res.json(data.config || defaultConfigs[gameType as string]);
      }
    }

    return res.json(defaultConfigs[gameType as string] || { published: true });
  } catch (e: any) {
    console.error('[GAME_CONFIG] Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
