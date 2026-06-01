/**
 * Game System Constants
 * Centralized configuration for game mechanics
 */

export const GAME_CONSTANTS = {
  // Crash Game
  CRASH: {
    MIN_BET: 10,
    EARLY_CRASH_CHANCE: 0.50, // 50%
    MEDIUM_CRASH_CHANCE: 0.30, // 30%
    HIGH_CRASH_CHANCE: 0.15, // 15%
    JACKPOT_CHANCE: 0.05, // 5%
    EARLY_MIN: 1.00,
    EARLY_MAX: 2.99,
    MEDIUM_MIN: 3.00,
    MEDIUM_MAX: 6.00,
    HIGH_MIN: 6.00,
    HIGH_MAX: 9.00,
    JACKPOT_MIN: 9.00,
    JACKPOT_MAX: 10.00
  },
  
  // Case Opening
  CASE: {
    RARITY_WEIGHTS: {
      Common: 0.60, // 60%
      Rare: 0.25, // 25%
      Epic: 0.10, // 10%
      Legendary: 0.04, // 4%
      Mythic: 0.01 // 1%
    },
    SPIN_DURATION_MS: 5500,
    FAST_SPIN_DURATION_MS: 1500,
    CHEST_SHAKE_DURATION_MS: 1000,
    AUTO_SPIN_DELAY_MS: 2200
  },
  
  // General
  BALANCE_INSUFFICIENT_MESSAGE: 'Saldo tidak mencukupi! Silakan hubungi staff untuk deposit.',
  SESSION_EXPIRED_MESSAGE: 'Sesi Anda telah berakhir. Silakan login kembali.'
} as const;
