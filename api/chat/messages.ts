import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory chat storage (will reset on each deployment)
const globalChatMessages: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({ messages: globalChatMessages.slice(-50) });
  }

  if (req.method === 'POST') {
    // For POST, would need authentication - for now just return empty
    return res.json({ messages: globalChatMessages.slice(-50) });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
