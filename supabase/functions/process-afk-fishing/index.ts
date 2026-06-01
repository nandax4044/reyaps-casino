import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role, bypass RLS
);

// Fish types configuration
const FISH_TYPES = [
  { id: 1, name: "Common Fish", emoji: "🐟", color: "#60a5fa" },
  { id: 2, name: "Rare Fish", emoji: "🐠", color: "#a78bfa" },
  { id: 3, name: "Epic Fish", emoji: "🐡", color: "#f59e0b" },
  { id: 4, name: "Legendary Fish", emoji: "🦈", color: "#ef4444" },
  { id: 5, name: "Mythic Fish", emoji: "🐋", color: "#ec4899" }
];

// Rod configurations (speed only, no LB bonus difference)
const ROD_CONFIG: Record<string, { intervalMin: number; intervalMax: number; lbBonus: number }> = {
  basic_rod: { intervalMin: 8, intervalMax: 10, lbBonus: 0 },
  lico_rod: { intervalMin: 6, intervalMax: 8, lbBonus: 0 },
  golden_rod: { intervalMin: 5, intervalMax: 6, lbBonus: 0 },
  thanksgiving_rod: { intervalMin: 4, intervalMax: 5, lbBonus: 0 }
};

Deno.serve(async () => {
  try {
    const now = new Date();

    // Ambil semua sesi AFK fishing yang aktif dan belum expired
    const { data: activeSessions, error: fetchError } = await supabase
      .from("afk_access")
      .select("*")
      .eq("feature", "fishing")
      .eq("is_active", true)
      .gt("expires_at", now.toISOString());

    if (fetchError) {
      console.error("Error fetching active sessions:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!activeSessions || activeSessions.length === 0) {
      return new Response(JSON.stringify({ message: "No active fishing sessions", processed: 0 }), { status: 200 });
    }

    let totalProcessed = 0;
    let totalFishGenerated = 0;

    for (const session of activeSessions) {
      try {
        const result = await processFishingSession(session, now);
        if (result.success) {
          totalProcessed++;
          totalFishGenerated += result.fishCount;
        }
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: "AFK fishing processed",
        sessionsProcessed: totalProcessed,
        totalFishGenerated
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Fatal error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function processFishingSession(session: any, now: Date) {
  // Get user's equipped rod
  const { data: inventory } = await supabase
    .from("user_fishing_inventory")
    .select("equipped_rod")
    .eq("user_id", session.user_id)
    .single();

  const rodId = inventory?.equipped_rod || "basic_rod";
  const rodConfig = ROD_CONFIG[rodId] || ROD_CONFIG.basic_rod;

  // Calculate seconds elapsed since last processing
  const lastProcessed = new Date(session.last_processed_at);
  const secondsElapsed = Math.floor((now.getTime() - lastProcessed.getTime()) / 1000);

  if (secondsElapsed < 1) {
    return { success: true, fishCount: 0 };
  }

  // Calculate average interval for this rod
  const avgInterval = (rodConfig.intervalMin + rodConfig.intervalMax) / 2;

  // Calculate how many fish should be generated
  const fishCount = Math.floor(secondsElapsed / avgInterval);

  if (fishCount === 0) {
    return { success: true, fishCount: 0 };
  }

  // Generate fish
  const fishLogs = [];
  let totalWL = 0;

  for (let i = 0; i < fishCount; i++) {
    const fish = generateFish(rodConfig.lbBonus);
    const price = calculatePrice(fish.finalLb, fish.isPerfect);
    
    fishLogs.push({
      user_id: session.user_id,
      fish_id: fish.id,
      fish_name: fish.name,
      base_lb: fish.baseLb,
      final_lb: fish.finalLb,
      lb_bonus: 0,
      rod_used: rodId,
      sell_price: price,
      caught_at: new Date(lastProcessed.getTime() + (i * avgInterval * 1000)).toISOString(),
      is_claimed: false
    });

    totalWL += price;
  }

  // Insert fish logs (batch)
  const { error: insertError } = await supabase
    .from("fishing_logs")
    .insert(fishLogs);

  if (insertError) {
    console.error("Error inserting fish logs:", insertError);
    throw insertError;
  }

  // Update user fishing saldo
  await supabase.rpc("increment_fishing_saldo", {
    p_user_id: session.user_id,
    p_amount: totalWL
  });

  // Update total fish caught
  await supabase.rpc("increment_fish_caught", {
    p_user_id: session.user_id,
    p_count: fishCount
  });

  // Update session last_processed_at and total_fish_generated
  await supabase
    .from("afk_access")
    .update({
      last_processed_at: now.toISOString(),
      total_fish_generated: (session.total_fish_generated || 0) + fishCount
    })
    .eq("id", session.id);

  console.log(`Processed user ${session.user_id}: ${fishCount} fish, ${totalWL} WL`);

  return { success: true, fishCount };
}

function generateFish(perfectChance: number) {
  // Random fish type
  const fish = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];

  // Weighted LB distribution
  const rand = Math.random();
  let lb: number;
  
  // 85% chance: 1-129 LB (common)
  if (rand < 0.85) {
    lb = Math.floor(Math.random() * 129) + 1;
  } else {
    // 15% chance: 130-200 LB (rare)
    lb = Math.floor(Math.random() * 71) + 130;
  }

  return {
    id: fish.id,
    name: fish.name,
    emoji: fish.emoji,
    color: fish.color,
    baseLb: lb,
    finalLb: lb,
    isPerfect: lb >= 130 // Rare fish
  };
}

function calculatePrice(lb: number, isPerfect: boolean): number {
  // Simple formula: 5 LB = 1 WL
  return Math.floor(lb / 5);
}
