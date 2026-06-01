// Vercel Serverless Function Handler
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLETE HARDCODED DATA FOR VERCEL DEPLOYMENT (ALL 15 CHESTS)
// ═══════════════════════════════════════════════════════════════════════════════

const caseOpeningDefault: any = {
  "chests": [
    {
      "id": "fishing",
      "name": "Fishing Chest",
      "price": 50,
      "icon": "🎣",
      "color": "from-cyan-500 to-blue-600",
      "background": "linear-gradient(135deg, #091728 0%, #0d273c 100%)",
      "image": "/images/fishing_chest.png",
      "items": [
        { "name": "Wigly", "rarity": "Common", "chance": 60, "value": 5, "icon": "🥾", "color": "#a1a1aa", "image": "/images/wigly.png" },
        { "name": "Cotd", "rarity": "Rare", "chance": 25, "value": 30, "icon": "🐟", "color": "#3b82f6", "image": "/images/cotd.png" },
        { "name": "Golden Rod", "rarity": "Epic", "chance": 4, "value": 2500, "icon": "🧵", "color": "#a855f7", "image": "/images/goldenrod.png" },
        { "name": "Fishing Hat", "rarity": "Legendary", "chance": 2, "value": 7000, "icon": "🎣", "color": "#eab308", "image": "/images/hatfishing.png" },
        { "name": "Thanks Giving Rod", "rarity": "Mythic", "chance": 1, "value": 10000, "icon": "🔱", "color": "#ef4444", "image": "/images/tgrod.png" }
      ]
    },
    {
      "id": "farm",
      "name": "Farm Chest",
      "price": 80,
      "icon": "🌾",
      "color": "from-[#38bdf8] to-[#0369a1]",
      "background": "linear-gradient(135deg, #04121d 0%, #0f2d45 100%)",
      "image": "/images/farmchest.png",
      "items": [
        { "name": "Rusty Pitchfork", "rarity": "Common", "chance": 60, "value": 10, "icon": "🔱", "color": "#a1a1aa", "image": "https://picsum.photos/seed/rust_fork/150/150" },
        { "name": "Oversized Pumpkin", "rarity": "Rare", "chance": 25, "value": 45, "icon": "🎃", "color": "#3b82f6", "image": "https://picsum.photos/seed/gargantuan_pumpkin/150/150" },
        { "name": "Tractor Keys", "rarity": "Epic", "chance": 10, "value": 180, "icon": "🔑", "color": "#a855f7", "image": "https://picsum.photos/seed/tractor_key/150/150" },
        { "name": "Golden Harvest Apple", "rarity": "Legendary", "chance": 4, "value": 650, "icon": "🍎", "color": "#eab308", "image": "https://picsum.photos/seed/gold_apple/150/150" },
        { "name": "Abundance Demeter Scythe", "rarity": "Mythic", "chance": 1, "value": 3200, "icon": "⚔️", "color": "#ef4444", "image": "/images/prize_farm.png" }
      ]
    },
    {
      "id": "citem",
      "name": "Citem Chest",
      "price": 120,
      "icon": "⚔️",
      "color": "from-sky-400 to-indigo-600",
      "background": "linear-gradient(135deg, #081123 0%, #0d2346 100%)",
      "image": "/images/citemchest.png",
      "items": [
        { "name": "Iron Dagger", "rarity": "Common", "chance": 60, "value": 15, "icon": "🗡️", "color": "#a1a1aa", "image": "https://picsum.photos/seed/iron_blade/150/150" },
        { "name": "Carbon Steel Katana", "rarity": "Rare", "chance": 25, "value": 70, "icon": "⚔️", "color": "#3b82f6", "image": "https://picsum.photos/seed/steel_katana/150/150" },
        { "name": "Cyber Laser Carbine", "rarity": "Epic", "chance": 10, "value": 280, "icon": "🔫", "color": "#a855f7", "image": "https://picsum.photos/seed/laser_carb/150/150" },
        { "name": "Plasma Radiant Sword", "rarity": "Legendary", "chance": 4, "value": 950, "icon": "⚡", "color": "#eab308", "image": "https://picsum.photos/seed/plasma_sword/150/150" },
        { "name": "Asgardian Thunder Hammer", "rarity": "Mythic", "chance": 1, "value": 4800, "icon": "🔨", "color": "#ef4444", "image": "/images/prize_weapon.png" }
      ]
    },
    {
      "id": "magic",
      "name": "Magic Chest",
      "price": 150,
      "icon": "🔮",
      "color": "from-cyan-400 to-blue-600",
      "background": "linear-gradient(135deg, #06111f 0%, #0b223d 100%)",
      "image": "/images/magic_chest.png",
      "items": [
        { "name": "Initiate Crystal Wand", "rarity": "Common", "chance": 60, "value": 20, "icon": "🪄", "color": "#a1a1aa", "image": "https://picsum.photos/seed/crystal_wand/150/150" },
        { "name": "Luminous Mana Elixir", "rarity": "Rare", "chance": 25, "value": 90, "icon": "🧪", "color": "#3b82f6", "image": "https://picsum.photos/seed/mana_pot/150/150" },
        { "name": "Grimoire of Fireball", "rarity": "Epic", "chance": 10, "value": 350, "icon": "📖", "color": "#a855f7", "image": "https://picsum.photos/seed/grimoire_fire/150/150" },
        { "name": "Robe of Archmage", "rarity": "Legendary", "chance": 4, "value": 1100, "icon": "🥋", "color": "#eab308", "image": "https://picsum.photos/seed/mage_robe/150/150" },
        { "name": "Sorcerer Supreme Staff", "rarity": "Mythic", "chance": 1, "value": 5500, "icon": "🔮", "color": "#ef4444", "image": "/images/prize_magic.png" }
      ]
    },
    {
      "id": "animal",
      "name": "Animal Chest",
      "price": 60,
      "icon": "🦊",
      "color": "from-blue-400 to-sky-700",
      "background": "linear-gradient(135deg, #051421 0%, #0b243b 100%)",
      "image": "/images/animal_chest.png",
      "items": [
        { "name": "Farmyard Chick Egg", "rarity": "Common", "chance": 60, "value": 8, "icon": "🥚", "color": "#a1a1aa", "image": "https://picsum.photos/seed/chick_egg/150/150" },
        { "name": "Fierce Timber Wolf Pup", "rarity": "Rare", "chance": 25, "value": 35, "icon": "🐺", "color": "#3b82f6", "image": "https://picsum.photos/seed/wolf_pup/150/150" },
        { "name": "Crystalline Night Owl", "rarity": "Epic", "chance": 10, "value": 140, "icon": "🦉", "color": "#a855f7", "image": "https://picsum.photos/seed/night_owl/150/150" },
        { "name": "Golden Griffin Mount", "rarity": "Legendary", "chance": 4, "value": 520, "icon": "🦁", "color": "#eab308", "image": "https://picsum.photos/seed/griffin_mount/150/150" },
        { "name": "Eternity Phoenix Soul", "rarity": "Mythic", "chance": 1, "value": 2800, "icon": "🦅", "color": "#ef4444", "image": "/images/prize_animal.png" }
      ]
    },
    {
      "id": "treasure",
      "name": "Treasure Chest",
      "price": 200,
      "icon": "👑",
      "color": "from-cyan-500 to-sky-600",
      "background": "linear-gradient(135deg, #041423 0%, #0c2a47 100%)",
      "image": "/images/treasure_chest.png",
      "items": [
        { "name": "Verdigris Copper Coin", "rarity": "Common", "chance": 60, "value": 25, "icon": "🪙", "color": "#a1a1aa", "image": "https://picsum.photos/seed/copper_coin/150/150" },
        { "name": "Heavy Silver Ingot", "rarity": "Rare", "chance": 25, "value": 120, "icon": "🥈", "color": "#3b82f6", "image": "https://picsum.photos/seed/silver_ingot/150/150" },
        { "name": "Royal Ruby Crest", "rarity": "Epic", "chance": 10, "value": 480, "icon": "👑", "color": "#a855f7", "image": "https://picsum.photos/seed/ruby_crest/150/150" },
        { "name": "Cursed Pirate King Crown", "rarity": "Legendary", "chance": 4, "value": 1600, "icon": "👑", "color": "#eab308", "image": "https://picsum.photos/seed/pirate_crown/150/150" },
        { "name": "Sacred El Dorado Idol", "rarity": "Mythic", "chance": 1, "value": 8500, "icon": "🗿", "color": "#ef4444", "image": "/images/prize_treasure.png" }
      ]
    },
    {
      "id": "space",
      "name": "Space Chest",
      "price": 250,
      "icon": "🚀",
      "color": "from-sky-500 to-[#1d4ed8]",
      "background": "linear-gradient(135deg, #030a1c 0%, #0a1f4a 100%)",
      "image": "/images/space_chest.png",
      "items": [
        { "name": "Raw Meteorite Shard", "rarity": "Common", "chance": 60, "value": 30, "icon": "☄️", "color": "#a1a1aa", "image": "https://picsum.photos/seed/meteor_shard/150/150" },
        { "name": "Zero-G Magneto Boots", "rarity": "Rare", "chance": 25, "value": 150, "icon": "🥾", "color": "#3b82f6", "image": "https://picsum.photos/seed/zero_boot/150/150" },
        { "name": "High-Yield Ion Thruster", "rarity": "Epic", "chance": 10, "value": 600, "icon": "⚙️", "color": "#a855f7", "image": "https://picsum.photos/seed/ion_thruster/150/150" },
        { "name": "Hyper-Gravity Gauntlets", "rarity": "Legendary", "chance": 4, "value": 2000, "icon": "🥊", "color": "#eab308", "image": "https://picsum.photos/seed/grav_gloves/150/150" },
        { "name": "Cosmic Supernova Core", "rarity": "Mythic", "chance": 1, "value": 10000, "icon": "💥", "color": "#ef4444", "image": "/images/prize_space.png" }
      ]
    },
    {
      "id": "ocean",
      "name": "Ocean Chest",
      "price": 100,
      "icon": "🌊",
      "color": "from-sky-400 to-blue-600",
      "background": "linear-gradient(135deg, #031424 0%, #0c2b47 100%)",
      "image": "/images/ocean_chest.png",
      "items": [
        { "name": "Iridescent Sea Glass", "rarity": "Common", "chance": 60, "value": 12, "icon": "💎", "color": "#a1a1aa", "image": "https://picsum.photos/seed/sea_glass/150/150" },
        { "name": "Deep Reef Coral Blade", "rarity": "Rare", "chance": 25, "value": 55, "icon": "🗡️", "color": "#3b82f6", "image": "https://picsum.photos/seed/coral_blade/150/150" },
        { "name": "Black Conch Pearl Ring", "rarity": "Epic", "chance": 10, "value": 220, "icon": "💍", "color": "#a855f7", "image": "https://picsum.photos/seed/pearl_ring/150/150" },
        { "name": "Sub ocean Neptune Trident", "rarity": "Legendary", "chance": 4, "value": 800, "icon": "🔱", "color": "#eab308", "image": "https://picsum.photos/seed/nep_trident/150/150" },
        { "name": "Poseidon Sea-Core Shard", "rarity": "Mythic", "chance": 1, "value": 4000, "icon": "🌀", "color": "#ef4444", "image": "/images/prize_ocean.png" }
      ]
    },
    {
      "id": "dragon",
      "name": "Dragon Chest",
      "price": 300,
      "icon": "🐉",
      "color": "from-[#0284c7] via-[#0369a1] to-[#075985]",
      "background": "linear-gradient(135deg, #02101e 0%, #0b2641 100%)",
      "image": "/images/dragon_chest.png",
      "items": [
        { "name": "Hardened Dragon Scale Shield", "rarity": "Common", "chance": 60, "value": 35, "icon": "🛡️", "color": "#a1a1aa", "image": "https://picsum.photos/seed/dragon_shield/150/150" },
        { "name": "Razor-Sharp Wyvern Wing", "rarity": "Rare", "chance": 25, "value": 180, "icon": "🪽", "color": "#3b82f6", "image": "https://picsum.photos/seed/dragon_wing/150/150" },
        { "name": "Furnace Dragon Claw", "rarity": "Epic", "chance": 10, "value": 750, "icon": "🐾", "color": "#a855f7", "image": "https://picsum.photos/seed/dragon_claw/150/150" },
        { "name": "Ancient Volcanic Wyrm Staff", "rarity": "Legendary", "chance": 4, "value": 2400, "icon": "🪄", "color": "#eab308", "image": "https://picsum.photos/seed/volcanic_staff/150/150" },
        { "name": "Heart of the Dragon Lord", "rarity": "Mythic", "chance": 1, "value": 12500, "icon": "❤️", "color": "#ef4444", "image": "/images/prize_dragon.png" }
      ]
    },
    {
      "id": "tech",
      "name": "Tech Chest",
      "price": 180,
      "icon": "💻",
      "color": "from-cyan-400 to-blue-500",
      "background": "linear-gradient(135deg, #0a1628 0%, #0f2744 100%)",
      "image": "https://picsum.photos/seed/tech_chest/400/400",
      "items": [
        { "name": "Broken Circuit Board", "rarity": "Common", "chance": 60, "value": 18, "icon": "🔌", "color": "#a1a1aa", "image": "https://picsum.photos/seed/circuit_board/150/150" },
        { "name": "Quantum Processor", "rarity": "Rare", "chance": 25, "value": 95, "icon": "🖥️", "color": "#3b82f6", "image": "https://picsum.photos/seed/quantum_cpu/150/150" },
        { "name": "Holographic Display", "rarity": "Epic", "chance": 10, "value": 380, "icon": "📱", "color": "#a855f7", "image": "https://picsum.photos/seed/holo_display/150/150" },
        { "name": "AI Neural Core", "rarity": "Legendary", "chance": 4, "value": 1300, "icon": "🤖", "color": "#eab308", "image": "https://picsum.photos/seed/ai_core/150/150" },
        { "name": "Singularity Supercomputer", "rarity": "Mythic", "chance": 1, "value": 6800, "icon": "⚡", "color": "#ef4444", "image": "https://picsum.photos/seed/supercomputer/150/150" }
      ]
    },
    {
      "id": "candy",
      "name": "Candy Chest",
      "price": 70,
      "icon": "🍬",
      "color": "from-pink-400 to-rose-500",
      "background": "linear-gradient(135deg, #2d0a1f 0%, #4a1230 100%)",
      "image": "https://picsum.photos/seed/candy_chest/400/400",
      "items": [
        { "name": "Sour Gummy Worm", "rarity": "Common", "chance": 60, "value": 9, "icon": "🐛", "color": "#a1a1aa", "image": "https://picsum.photos/seed/gummy_worm/150/150" },
        { "name": "Rainbow Lollipop", "rarity": "Rare", "chance": 25, "value": 42, "icon": "🍭", "color": "#3b82f6", "image": "https://picsum.photos/seed/lollipop/150/150" },
        { "name": "Chocolate Diamond Bar", "rarity": "Epic", "chance": 10, "value": 165, "icon": "🍫", "color": "#a855f7", "image": "https://picsum.photos/seed/choco_bar/150/150" },
        { "name": "Golden Candy Cane", "rarity": "Legendary", "chance": 4, "value": 580, "icon": "🍬", "color": "#eab308", "image": "https://picsum.photos/seed/candy_cane/150/150" },
        { "name": "Eternal Sugar Crystal", "rarity": "Mythic", "chance": 1, "value": 3100, "icon": "💎", "color": "#ef4444", "image": "https://picsum.photos/seed/sugar_crystal/150/150" }
      ]
    },
    {
      "id": "sports",
      "name": "Sports Chest",
      "price": 110,
      "icon": "⚽",
      "color": "from-green-400 to-emerald-600",
      "background": "linear-gradient(135deg, #0a1f0d 0%, #0f3318 100%)",
      "image": "https://picsum.photos/seed/sports_chest/400/400",
      "items": [
        { "name": "Worn Baseball Glove", "rarity": "Common", "chance": 60, "value": 14, "icon": "🥎", "color": "#a1a1aa", "image": "https://picsum.photos/seed/baseball_glove/150/150" },
        { "name": "Championship Trophy", "rarity": "Rare", "chance": 25, "value": 68, "icon": "🏆", "color": "#3b82f6", "image": "https://picsum.photos/seed/trophy/150/150" },
        { "name": "Pro Athlete Jersey", "rarity": "Epic", "chance": 10, "value": 270, "icon": "👕", "color": "#a855f7", "image": "https://picsum.photos/seed/jersey/150/150" },
        { "name": "Olympic Gold Medal", "rarity": "Legendary", "chance": 4, "value": 920, "icon": "🥇", "color": "#eab308", "image": "https://picsum.photos/seed/gold_medal/150/150" },
        { "name": "Legendary World Cup", "rarity": "Mythic", "chance": 1, "value": 4600, "icon": "🏆", "color": "#ef4444", "image": "https://picsum.photos/seed/world_cup/150/150" }
      ]
    },
    {
      "id": "music",
      "name": "Music Chest",
      "price": 140,
      "icon": "🎵",
      "color": "from-purple-400 to-violet-600",
      "background": "linear-gradient(135deg, #1a0a2e 0%, #2d1548 100%)",
      "image": "https://picsum.photos/seed/music_chest/400/400",
      "items": [
        { "name": "Rusty Harmonica", "rarity": "Common", "chance": 60, "value": 16, "icon": "🎶", "color": "#a1a1aa", "image": "https://picsum.photos/seed/harmonica/150/150" },
        { "name": "Electric Guitar Pick", "rarity": "Rare", "chance": 25, "value": 78, "icon": "🎸", "color": "#3b82f6", "image": "https://picsum.photos/seed/guitar_pick/150/150" },
        { "name": "Platinum Record Disc", "rarity": "Epic", "chance": 10, "value": 310, "icon": "💿", "color": "#a855f7", "image": "https://picsum.photos/seed/platinum_disc/150/150" },
        { "name": "Legendary Stradivarius", "rarity": "Legendary", "chance": 4, "value": 1050, "icon": "🎻", "color": "#eab308", "image": "https://picsum.photos/seed/stradivarius/150/150" },
        { "name": "Divine Symphony Baton", "rarity": "Mythic", "chance": 1, "value": 5200, "icon": "🎼", "color": "#ef4444", "image": "https://picsum.photos/seed/symphony_baton/150/150" }
      ]
    },
    {
      "id": "ancient",
      "name": "Ancient Chest",
      "price": 220,
      "icon": "🏛️",
      "color": "from-amber-400 to-orange-600",
      "background": "linear-gradient(135deg, #1f1408 0%, #3a2410 100%)",
      "image": "https://picsum.photos/seed/ancient_chest/400/400",
      "items": [
        { "name": "Cracked Clay Pot", "rarity": "Common", "chance": 60, "value": 22, "icon": "🏺", "color": "#a1a1aa", "image": "https://picsum.photos/seed/clay_pot/150/150" },
        { "name": "Roman Gladius Sword", "rarity": "Rare", "chance": 25, "value": 110, "icon": "⚔️", "color": "#3b82f6", "image": "https://picsum.photos/seed/gladius/150/150" },
        { "name": "Egyptian Scarab Amulet", "rarity": "Epic", "chance": 10, "value": 440, "icon": "🪲", "color": "#a855f7", "image": "https://picsum.photos/seed/scarab/150/150" },
        { "name": "Pharaoh's Golden Mask", "rarity": "Legendary", "chance": 4, "value": 1500, "icon": "👑", "color": "#eab308", "image": "https://picsum.photos/seed/pharaoh_mask/150/150" },
        { "name": "Atlantis Trident of Power", "rarity": "Mythic", "chance": 1, "value": 7800, "icon": "🔱", "color": "#ef4444", "image": "https://picsum.photos/seed/atlantis_trident/150/150" }
      ]
    },
    {
      "id": "crystal",
      "name": "Crystal Chest",
      "price": 270,
      "icon": "💎",
      "color": "from-teal-400 to-cyan-600",
      "background": "linear-gradient(135deg, #051f1f 0%, #0a3838 100%)",
      "image": "https://picsum.photos/seed/crystal_chest/400/400",
      "items": [
        { "name": "Cloudy Quartz Shard", "rarity": "Common", "chance": 60, "value": 28, "icon": "🪨", "color": "#a1a1aa", "image": "https://picsum.photos/seed/quartz/150/150" },
        { "name": "Sapphire Gemstone", "rarity": "Rare", "chance": 25, "value": 135, "icon": "💠", "color": "#3b82f6", "image": "https://picsum.photos/seed/sapphire/150/150" },
        { "name": "Amethyst Geode", "rarity": "Epic", "chance": 10, "value": 540, "icon": "🔮", "color": "#a855f7", "image": "https://picsum.photos/seed/amethyst/150/150" },
        { "name": "Flawless Diamond", "rarity": "Legendary", "chance": 4, "value": 1800, "icon": "💎", "color": "#eab308", "image": "https://picsum.photos/seed/diamond/150/150" },
        { "name": "Prismatic Infinity Stone", "rarity": "Mythic", "chance": 1, "value": 9500, "icon": "✨", "color": "#ef4444", "image": "https://picsum.photos/seed/infinity_stone/150/150" }
      ]
    }
  ],
  "gameSettings": {
    "defaultSpinDurationMs": 5500,
    "fastSpinDurationMs": 1500,
    "soundEnabled": true,
    "enableMotionBlur": true,
    "enableRarityGlow": true,
    "classicRealisticEasing": true,
    "spinEasing": "cubic-bezier(0.04, 0.84, 0.12, 1)",
    "soundTickFrequencyHz": 220,
    "showInteractiveSettings": true,
    "maxTapeSize": 65,
    "winningTargetIndex": 52,
    "pointerShadowGlowHex": "#38bdf8",
    "winRateMultiplier": 1.0,
    "mythicChanceBoost": 0.0
  }
};

const permainanDefault: any = {
  "crashSettings": {
    "countdownSeconds": 3,
    "defaultPickMultiplier": "2.00",
    "multiplierTickIntervalMs": 100,
    "growthCoefficient": 0.00012,
    "soundVolumeMultiplier": 0.1,
    "maxPossibleMultiplier": 100.0,
    "enableStarsBackground": true,
    "starDensityCount": 95,
    "starsDriftWarpSpeed": 1.4,
    "cometParticleColor": "#38bdf8",
    "chartGlowBorderHex": "#38bdf8",
    "houseEdgeFactor": 1.0,
    "probabilityWeights": {
      "earlyCrashChance": 0.45,
      "earlyCrashMax": 2.99,
      "mediumCrashChance": 0.35,
      "mediumCrashMax": 6.99,
      "highCrashChance": 0.16,
      "highCrashMax": 15.99,
      "jackpotCrashChance": 0.04,
      "jackpotCrashMax": 100.0
    }
  },
  "prizes": [
    { "id": "c1", "name": "Star Dust Vial 🧪", "rarity": "Common", "value": 25, "icon": "🧪", "image": "https://picsum.photos/seed/stardust/150/150" },
    { "id": "c2", "name": "Cosmic Voyager Helmet 🪖", "rarity": "Rare", "value": 150, "icon": "🪖", "image": "https://picsum.photos/seed/cosmic_helmet/150/150" },
    { "id": "c3", "name": "Space Cadet Thruster Pack 🚀", "rarity": "Epic", "value": 450, "icon": "🚀", "image": "https://picsum.photos/seed/jetpack/150/150" },
    { "id": "c4", "name": "Asteroid Golden Bullet 🪙", "rarity": "Legendary", "value": 1200, "icon": "🪙", "image": "https://picsum.photos/seed/asteroid_gold/150/150" },
    { "id": "c5", "name": "Quantum Warp Engine Core ⚡", "rarity": "Mythic", "value": 5000, "icon": "⚡", "image": "https://picsum.photos/seed/quantum_core/150/150" }
  ],
  "leaderboard": [
    { "name": "Dewajitu_Gacor", "score": 9840, "date": "2026-05-28" },
    { "name": "Sutan_Jackpot", "score": 7520, "date": "2026-05-28" },
    { "name": "Raja_Scatter", "score": 4900, "date": "2026-05-28" }
  ]
};

console.log('[CONFIG] Loaded complete default configs:', {
  chests: caseOpeningDefault.chests?.length || 0,
  crashPrizes: permainanDefault.prizes?.length || 0
});

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
    crash: JSON.parse(JSON.stringify(permainanDefault))
  } as Record<string, any>
};

// ── Global Chat Store (in-memory, resets on cold start) ──────────────────────
const globalChatMessages: Array<{
  id: string;
  userId: string;
  username: string;
  is_staff: boolean;
  message: string;
  timestamp: string;
}> = [
  { id: '1', userId: 'sys', username: 'System', is_staff: true, message: '🎉 Selamat datang di ReyaBet! Chat global aktif.', timestamp: new Date().toISOString() }
];

// ── Site Config Store (in-memory, admin editable) ────────────────────────────
const siteConfig: Record<string, any> = {
  siteName: 'ReyaBet',
  siteSubtitle: 'Online gacha in ReyaPs',
  footerText: 'WHEEL SPINNER CASINO © 2026 • Private Premium Client Build',
  discordLink: 'https://discord.gg/ZHF2N94p5',
  depositText: 'Silakan hubungi staff admin untuk melakukan top-up deposit saldo agar bisa bermain.',
  logoUrl: '/logo.png',
  welcomeMessage: 'Selamat datang di ReyaBet! Mainkan game seru dan menangkan hadiah.',
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

    // ── PUBLIC: Game config routes (no auth needed) ──────────────────────────
    if (path.startsWith('/games/config/') && method === 'GET') {
      const gameType = path.split('/').pop();
      return await handleGetConfig(gameType, res);
    }

    // ── PUBLIC: Online users (no auth needed) ────────────────────────────────
    if (path === '/users/online' && method === 'GET') {
      return await handleOnlineUsers(res);
    }

    // ── PUBLIC: Global Chat (read no auth, post needs auth) ──────────────────
    if (path === '/chat/messages' && method === 'GET') {
      return res.json({ messages: globalChatMessages.slice(-50) });
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

      // Site content config (admin only)
      if (path === '/admin/site-config' && method === 'GET') {
        return res.json({ config: siteConfig });
      }

      if (path === '/admin/site-config' && method === 'POST') {
        const { config } = body;
        if (config) {
          Object.assign(siteConfig, config);
          return res.json({ success: true, config: siteConfig });
        }
        return res.status(400).json({ error: 'Config data required' });
      }

      // Fishing admin endpoints
      if (path === '/admin/fishing/grant-access' && method === 'POST') {
        return await handleGrantFishingAccess(user.id, body, res);
      }

      if (path === '/admin/fishing/grant-bait' && method === 'POST') {
        return await handleGrantBait(user.id, body, res);
      }

      if (path.match(/\/admin\/fishing\/user-inventory\/[^/]+$/) && method === 'GET') {
        const userId = path.split('/').pop();
        return await handleGetFishingInventory(userId, res);
      }
    }

    // Chat post (requires auth)
    if (path === '/chat/messages' && method === 'POST') {
      const { message } = body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong!' });
      }
      if (message.trim().length > 200) {
        return res.status(400).json({ error: 'Pesan maksimal 200 karakter!' });
      }
      const chatMsg = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        is_staff: user.is_staff,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };
      globalChatMessages.push(chatMsg);
      if (globalChatMessages.length > 100) globalChatMessages.shift();
      return res.json({ success: true, message: chatMsg });
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
  const { balance } = body;

  if (balance === undefined || balance < 0) {
    return res.status(400).json({ error: 'Saldo tidak valid!' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({ balance: parseFloat(balance) })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      const { password: _, ...safeUser } = updatedUser as any;
      return res.json({ success: true, user: safeUser });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan!' });
    user.balance = parseFloat(balance);
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  }
}

// ─── Edit User Handler ─────────────────────────────────────────────────────────
async function handleEditUser(userId: string, body: any, res: any) {
  const { username, email, is_staff } = body;

  if (!username && !email && is_staff === undefined) {
    return res.status(400).json({ error: 'Tidak ada data yang diubah!' });
  }

  const updates: any = {};
  if (username) updates.username = username.trim().toLowerCase();
  if (email) updates.email = email.trim().toLowerCase();
  if (is_staff !== undefined) updates.is_staff = is_staff;

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      const { password: _, ...safeUser } = updatedUser as any;
      return res.json({ success: true, user: safeUser });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    const user = localDb.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan!' });
    Object.assign(user, updates);
    const { password: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
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
    return res.status(400).json({ error: 'Item ID diperlukan!' });
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
    if (index === -1) return res.status(404).json({ error: 'Item tidak ditemukan!' });
    localDb.inventory.splice(index, 1);
    return res.json({ success: true, message: 'Item berhasil dihapus!' });
  }
}

// ─── Update Config Handler ─────────────────────────────────────────────────────
async function handleUpdateConfig(gameType: string, body: any, res: any) {
  const { config } = body;

  if (!config) {
    return res.status(400).json({ error: 'Config data diperlukan!' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('game_configs')
        .select('id')
        .eq('game_type', gameType)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabaseAdmin
          .from('game_configs')
          .update({ config_data: config })
          .eq('game_type', gameType)
          .select('*')
          .single();

        if (error) throw error;
        return res.json({ success: true, config: updated.config_data });
      } else {
        const { data: inserted, error } = await supabaseAdmin
          .from('game_configs')
          .insert({ game_type: gameType, config_data: config })
          .select('*')
          .single();

        if (error) throw error;
        return res.json({ success: true, config: inserted.config_data });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[gameType] = config;
    return res.json({ success: true, config });
  }
}

// ─── Reset Config Handler ──────────────────────────────────────────────────────
async function handleResetConfig(gameType: string, res: any) {
  let defaultConfig: any = null;

  if (gameType === 'cases') defaultConfig = JSON.parse(JSON.stringify(caseOpeningDefault));
  else if (gameType === 'crash') defaultConfig = JSON.parse(JSON.stringify(permainanDefault));
  else return res.status(400).json({ error: 'Game type tidak dikenal!' });

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('game_configs')
        .select('id')
        .eq('game_type', gameType)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabaseAdmin
          .from('game_configs')
          .update({ config_data: defaultConfig })
          .eq('game_type', gameType)
          .select('*')
          .single();

        if (error) throw error;
        return res.json({ success: true, config: updated.config_data });
      } else {
        const { data: inserted, error } = await supabaseAdmin
          .from('game_configs')
          .insert({ game_type: gameType, config_data: defaultConfig })
          .select('*')
          .single();

        if (error) throw error;
        return res.json({ success: true, config: inserted.config_data });
      }
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  } else {
    localDb.configs[gameType] = defaultConfig;
    return res.json({ success: true, config: defaultConfig });
  }
}

// ─── Online Users Handler ──────────────────────────────────────────────────────
async function handleOnlineUsers(res: any) {
  // Generate mock online players with realistic activities
  const activities = [
    'Membuka Golden Chest',
    'Bertaruh di Crash Game',
    'Idle di Lobby',
    'Melihat Dashboard',
    'Membuka Legendary Chest',
    'Bermain Case Opening',
    'Mengelola Jalannya Casino'
  ];

  const mockPlayers = [
    { id: 'v1', username: 'GrowDev_Id', balance: 452300, is_staff: false, activity: activities[0] },
    { id: 'v2', username: 'WLSeller99', balance: 1250000, is_staff: false, activity: activities[1] },
    { id: 'v3', username: 'nanddev', balance: 5000000, is_staff: true, activity: activities[6] },
    { id: 'v4', username: 'ProBreakerGT', balance: 82500, is_staff: false, activity: activities[2] },
    { id: 'v5', username: 'BGL_Digger', balance: 7520000, is_staff: false, activity: activities[3] },
    { id: 'v6', username: 'VortexWL', balance: 35000, is_staff: false, activity: activities[4] },
    { id: 'v7', username: 'LegendaryLox', balance: 24500000, is_staff: false, activity: activities[5] }
  ];

  if (isSupabaseConfigured && supabase) {
    try {
      // Try to get real online sessions from database
      const { data: sessions, error } = await supabase
        .from('online_sessions')
        .select('user_id, username, role, activity, last_heartbeat')
        .gte('last_heartbeat', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order('last_heartbeat', { ascending: false })
        .limit(20);

      if (!error && sessions && sessions.length > 0) {
        // Get user details for each session
        const userIds = sessions.map(s => s.user_id);
        const { data: users } = await supabase
          .from('users')
          .select('id, username, balance, is_staff')
          .in('id', userIds);

        if (users) {
          const players = sessions.map(session => {
            const user = users.find(u => u.id === session.user_id);
            return {
              id: session.user_id,
              username: session.username,
              balance: user?.balance || 0,
              is_staff: user?.is_staff || false,
              activity: session.activity || 'Online'
            };
          });
          return res.json({ players, onlineCount: players.length });
        }
      }
    } catch (e: any) {
      console.error('[ONLINE] Database error:', e);
    }
  }

  // Fallback to mock data
  return res.json({ players: mockPlayers, onlineCount: mockPlayers.length });
}


// ─── FISHING ADMIN HANDLERS ────────────────────────────────────────────────────

async function handleGrantFishingAccess(adminId: string, body: any, res: any) {
  const { user_id, duration_days } = body;

  if (!user_id || !duration_days) {
    return res.status(400).json({ error: 'Missing required fields: user_id and duration_days' });
  }

  if (duration_days <= 0) {
    return res.status(400).json({ error: 'Duration must be greater than 0' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration_days);

      // Upsert fishing access
      const { data, error } = await supabaseAdmin
        .from('afk_access')
        .upsert({
          user_id: user_id,
          feature: 'fishing',
          granted_by: adminId,
          granted_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true
        }, {
          onConflict: 'user_id,feature'
        })
        .select('*')
        .single();

      if (error) throw error;

      console.log(`[ADMIN] Granted fishing access to user ${user_id} for ${duration_days} days`);
      return res.json({ success: true, access: data });
    } catch (error: any) {
      console.error('[ADMIN] Grant fishing access error:', error);
      return res.status(500).json({ error: 'Failed to grant fishing access: ' + error.message });
    }
  } else {
    return res.json({ success: true, message: 'Fishing access granted (local mode)' });
  }
}

async function handleGrantBait(adminId: string, body: any, res: any) {
  const { user_id, amount, notes } = body;

  if (!user_id || !amount) {
    return res.status(400).json({ error: 'Missing required fields: user_id and amount' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      // Call grant_bait function
      const { data, error } = await supabaseAdmin.rpc('grant_bait', {
        p_user_id: user_id,
        p_amount: amount,
        p_granted_by: adminId,
        p_notes: notes || null
      });

      if (error) throw error;

      console.log(`[ADMIN] Granted ${amount} bait to user ${user_id}, new balance: ${data}`);
      return res.json({ success: true, new_balance: data });
    } catch (error: any) {
      console.error('[ADMIN] Grant bait error:', error);
      return res.status(500).json({ error: 'Failed to grant bait: ' + error.message });
    }
  } else {
    return res.json({ success: true, new_balance: amount });
  }
}

async function handleGetFishingInventory(userId: string, res: any) {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_fishing_inventory')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return res.json({ success: true, inventory: data });
    } catch (error: any) {
      console.error('[ADMIN] Get user inventory error:', error);
      return res.status(500).json({ error: 'Failed to get user inventory' });
    }
  } else {
    return res.json({ success: true, inventory: { bait_balance: 0 } });
  }
}
