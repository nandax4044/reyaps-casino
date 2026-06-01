/**
 * AFK Fishing Worker - Server-Side Background Process
 * Runs fishing bot for users even when browser is closed
 */

import { createClient } from '@supabase/supabase-js';
import fishingData from './src/data/fishing.json' with { type: 'json' };

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

if (!isSupabaseConfigured) {
  console.warn('[AFK-FISHING] Supabase not configured. AFK fishing will not work.');
} else {
  console.log('[AFK-FISHING] Supabase configured ✅');
}

interface ActiveFisher {
  userId: string;
  username: string;
  equippedRod: string;
  intervalId: NodeJS.Timeout;
  startedAt: Date;
}

const activeFishers = new Map<string, ActiveFisher>();

// Calculate fish price: 5 LB = 1 WL
function calculateFishPrice(lb: number): number {
  return Math.floor(lb / 5); // 5 LB = 1 WL
}

// Generate random LB with weighted distribution
function generateWeightedLB(): number {
  const rand = Math.random();
  
  // 85% chance: 1-129 LB (common)
  if (rand < 0.85) {
    return Math.floor(Math.random() * 129) + 1;
  }
  
  // 15% chance: 130-200 LB (rare)
  return Math.floor(Math.random() * 71) + 130;
}

// Generate random fish catch with new system
function generateFish() {
  const fishList = fishingData.fish_types;
  const randomFish = fishList[Math.floor(Math.random() * fishList.length)];
  
  // Weighted LB distribution
  const lb = generateWeightedLB();
  
  // Calculate price: 5 LB = 1 WL
  const sellPrice = calculateFishPrice(lb);

  return {
    id: randomFish.id,
    name: randomFish.name,
    baseLb: lb,
    lb: lb,
    lbBonus: 0,
    emoji: randomFish.emoji,
    color: randomFish.color,
    sellPrice,
    isPerfect: lb >= 130 // Rare fish
  };
}

// Auto-catch and sell fish
async function catchAndSellFish(userId: string) {
  if (!supabase) {
    console.error('[AFK-FISHING] Supabase not configured');
    return null;
  }

  try {
    console.log(`[AFK-FISHING] ${userId}: Starting catch attempt...`);
    
    // CHECK BAIT FIRST
    const { data: inventory, error: inventoryError } = await supabase
      .from('user_fishing_inventory')
      .select('bait_balance, fishing_saldo, total_fish_caught')
      .eq('user_id', userId)
      .single();

    if (inventoryError) {
      console.error(`[AFK-FISHING] ${userId}: ❌ Error fetching inventory:`, inventoryError);
      return null;
    }

    if (!inventory) {
      console.log(`[AFK-FISHING] ${userId}: ❌ No inventory found, stopping fishing`);
      void stopAFKFishing(userId);
      return null;
    }

    console.log(`[AFK-FISHING] ${userId}: 📊 Current stats - Bait: ${inventory.bait_balance}, Balance: ${inventory.fishing_saldo} WL, Fish: ${inventory.total_fish_caught}`);

    if (inventory.bait_balance <= 0) {
      console.log(`[AFK-FISHING] ${userId}: ❌ No bait remaining (${inventory.bait_balance}), stopping fishing`);
      void stopAFKFishing(userId);
      return null;
    }

    const fish = generateFish();
    console.log(`[AFK-FISHING] ${userId}: 🎣 Generated fish: ${fish.name} ${fish.lb}LB → ${fish.sellPrice} WL`);

    // Insert fish record (auto-sold)
    console.log(`[AFK-FISHING] ${userId}: 💾 Inserting fish record...`);
    const { error: insertError } = await supabase
      .from('fish_inventory')
      .insert({
        user_id: userId,
        fish_id: fish.id,
        fish_name: fish.name,
        base_lb: fish.baseLb,
        lb: fish.lb,
        lb_bonus: fish.lbBonus,
        is_perfect: false, // Not used in V2
        is_sold: true,
        sell_price: fish.sellPrice,
        sold_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`[AFK-FISHING] ${userId}: ❌ Error inserting fish:`, insertError);
      throw insertError;
    }
    console.log(`[AFK-FISHING] ${userId}: ✅ Fish record inserted`);

    // Update fishing saldo
    console.log(`[AFK-FISHING] ${userId}: 💰 Updating balance (+${fish.sellPrice} WL)...`);
    const { error: updateError } = await supabase.rpc('increment_fishing_saldo', {
      p_user_id: userId,
      p_amount: fish.sellPrice
    });

    if (updateError) {
      console.error(`[AFK-FISHING] ${userId}: ❌ Error updating balance:`, updateError);
      throw updateError;
    }
    console.log(`[AFK-FISHING] ${userId}: ✅ Balance updated`);

    // Increment total fish caught
    console.log(`[AFK-FISHING] ${userId}: 🐟 Incrementing fish count...`);
    const { error: fishCountError } = await supabase.rpc('increment_fish_caught', { p_user_id: userId });
    if (fishCountError) {
      console.error(`[AFK-FISHING] ${userId}: ❌ Error incrementing fish count:`, fishCountError);
    } else {
      console.log(`[AFK-FISHING] ${userId}: ✅ Fish count incremented`);
    }

    // DECREASE BAIT BY 1
    console.log(`[AFK-FISHING] ${userId}: 🪱 Decreasing bait (${inventory.bait_balance} → ${inventory.bait_balance - 1})...`);
    const { error: baitError } = await supabase
      .from('user_fishing_inventory')
      .update({ bait_balance: inventory.bait_balance - 1 })
      .eq('user_id', userId);

    if (baitError) {
      console.error(`[AFK-FISHING] ${userId}: ❌ Error updating bait:`, baitError);
    } else {
      console.log(`[AFK-FISHING] ${userId}: ✅ Bait decreased`);
    }

    console.log(`[AFK-FISHING] ${userId}: ✅✅✅ Caught ${fish.name} ${fish.lb}LB → +${fish.sellPrice} WL (Bait: ${inventory.bait_balance} → ${inventory.bait_balance - 1})`);

    return fish;
  } catch (error) {
    console.error(`[AFK-FISHING] ${userId}: ❌❌❌ Error catching fish:`, error);
    return null;
  }
}

// Start AFK fishing for a user
export async function startAFKFishing(userId: string, username: string, rodId: string) {
  if (!supabase) {
    console.error('[AFK-FISHING] Supabase not configured');
    return { success: false, message: 'Database not configured' };
  }

  // Check if already fishing
  if (activeFishers.has(userId)) {
    console.log(`[AFK-FISHING] ${username} already fishing`);
    return { success: false, message: 'Already fishing' };
  }

  // Get rod data
  const rod = fishingData.rods.find(r => r.id === rodId);
  if (!rod) {
    return { success: false, message: 'Invalid rod' };
  }

  // Check fishing access
  const { data: access, error: accessError } = await supabase
    .from('afk_access')
    .select('*')
    .eq('user_id', userId)
    .eq('feature', 'fishing')
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (accessError || !access) {
    return { success: false, message: 'No active fishing access' };
  }

  // Check rod access (ez_rod is always available for users with fishing access)
  if (rodId !== 'ez_rod') {
    const { data: rodAccess } = await supabase
      .from('user_rod_access')
      .select('*')
      .eq('user_id', userId)
      .eq('rod_id', rodId)
      .eq('is_active', true)
      .single();

    if (!rodAccess) {
      return { success: false, message: 'No access to this rod' };
    }
  }

  // Update equipped rod
  await supabase.rpc('update_equipped_rod', { p_user_id: userId, p_rod: rodId });

  // Save session to database for persistence
  const { error: sessionError } = await supabase
    .from('afk_fishing_sessions')
    .upsert({
      user_id: userId,
      username: username,
      equipped_rod: rodId,
      is_active: true,
      started_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    });

  if (sessionError) {
    console.error(`[AFK-FISHING] Error saving session:`, sessionError);
  } else {
    console.log(`[AFK-FISHING] Session saved to database for ${username}`);
  }

  // Start fishing loop with error handling to prevent memory leaks
  const fishingLoop = async () => {
    try {
      if (!supabase) {
        console.error('[AFK-FISHING] Supabase not configured, stopping...');
        void stopAFKFishing(userId);
        return;
      }

      // Update heartbeat
      await supabase
        .from('afk_fishing_sessions')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('user_id', userId);

      // Check if access still valid
      const { data: currentAccess } = await supabase
        .from('afk_access')
        .select('*')
        .eq('user_id', userId)
        .eq('feature', 'fishing')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!currentAccess) {
        console.log(`[AFK-FISHING] ${username} access expired, stopping...`);
        void stopAFKFishing(userId);
        return;
      }

      await catchAndSellFish(userId);
    } catch (error) {
      console.error(`[AFK-FISHING] Error in fishing loop for ${username}:`, error);
      // Don't stop fishing on transient errors, just log and continue
    }
  };

  // Random interval based on rod
  const interval = Math.random() * (rod.intervalMax - rod.intervalMin) + rod.intervalMin;
  
  const intervalId = setInterval(fishingLoop, interval);

  activeFishers.set(userId, {
    userId,
    username,
    equippedRod: rodId,
    intervalId,
    startedAt: new Date()
  });

  console.log(`[AFK-FISHING] Started for ${username} with ${rod.name} (${rod.intervalMin/1000}-${rod.intervalMax/1000}s, +${Math.round(rod.lbBonus * 100)}% LB)`);
  
  return { success: true, message: 'AFK fishing started', rod: rod.name };
}

// Stop AFK fishing for a user
export async function stopAFKFishing(userId: string) {
  const fisher = activeFishers.get(userId);
  if (!fisher) {
    return { success: false, message: 'Not fishing' };
  }

  clearInterval(fisher.intervalId);
  activeFishers.delete(userId);

  // Remove session from database
  if (supabase) {
    try {
      await supabase
        .from('afk_fishing_sessions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      console.log(`[AFK-FISHING] Session removed from database for ${fisher.username}`);
    } catch (error: any) {
      console.error(`[AFK-FISHING] Error removing session:`, error);
    }
  }

  console.log(`[AFK-FISHING] Stopped for ${fisher.username}`);
  
  return { success: true, message: 'AFK fishing stopped' };
}

// Get AFK fishing status
export function getAFKStatus(userId: string) {
  const fisher = activeFishers.get(userId);
  if (!fisher) {
    return { isActive: false };
  }

  return {
    isActive: true,
    equippedRod: fisher.equippedRod,
    startedAt: fisher.startedAt,
    duration: Date.now() - fisher.startedAt.getTime()
  };
}

// Get all active fishers
export function getAllActiveFishers() {
  return Array.from(activeFishers.values()).map(f => ({
    userId: f.userId,
    username: f.username,
    equippedRod: f.equippedRod,
    startedAt: f.startedAt,
    duration: Date.now() - f.startedAt.getTime()
  }));
}

// Cleanup on process exit
process.on('SIGINT', () => {
  console.log('[AFK-FISHING] Shutting down...');
  activeFishers.forEach((fisher) => {
    clearInterval(fisher.intervalId);
  });
  process.exit(0);
});

// Auto-resume fishing sessions on server start
export async function resumeActiveSessions() {
  if (!supabase) {
    console.log('[AFK-FISHING] Supabase not configured, cannot resume sessions');
    return;
  }

  try {
    console.log('[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...');

    // Get all active sessions
    const { data: sessions, error } = await supabase
      .from('afk_fishing_sessions')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('[AFK-FISHING] Error fetching active sessions:', error);
      return;
    }

    if (!sessions || sessions.length === 0) {
      console.log('[AFK-FISHING] No active sessions to resume');
      return;
    }

    console.log(`[AFK-FISHING] Found ${sessions.length} active session(s) to resume`);

    // Resume each session
    for (const session of sessions) {
      // Check if session is stale (no heartbeat for 5 minutes)
      const lastHeartbeat = new Date(session.last_heartbeat);
      const now = new Date();
      const minutesSinceHeartbeat = (now.getTime() - lastHeartbeat.getTime()) / 1000 / 60;

      if (minutesSinceHeartbeat > 5) {
        console.log(`[AFK-FISHING] Session for ${session.username} is stale (${Math.round(minutesSinceHeartbeat)} min), marking as inactive`);
        await supabase
          .from('afk_fishing_sessions')
          .update({ is_active: false })
          .eq('user_id', session.user_id);
        continue;
      }

      // Resume fishing
      console.log(`[AFK-FISHING] Resuming fishing for ${session.username} with ${session.equipped_rod}`);
      const result = await startAFKFishing(session.user_id, session.username, session.equipped_rod);
      
      if (result.success) {
        console.log(`[AFK-FISHING] ✅ Successfully resumed fishing for ${session.username}`);
      } else {
        console.log(`[AFK-FISHING] ❌ Failed to resume fishing for ${session.username}: ${result.message}`);
        // Mark session as inactive if resume failed
        await supabase
          .from('afk_fishing_sessions')
          .update({ is_active: false })
          .eq('user_id', session.user_id);
      }
    }

    console.log('[AFK-FISHING] ✅ Session resume complete');
  } catch (error) {
    console.error('[AFK-FISHING] Error resuming sessions:', error);
  }
}

console.log('[AFK-FISHING] Worker initialized with V2 system (4 rods, LB 1-200, tiered pricing)');
