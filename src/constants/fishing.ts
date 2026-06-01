/**
 * Fishing System Constants
 * Centralized configuration for fishing game mechanics
 */

export const FISHING_CONSTANTS = {
  // Timing
  STATUS_CHECK_INTERVAL: 5000, // 5 seconds
  AUTO_RESUME_DELAY: 2000, // 2 seconds after server start
  STALE_SESSION_TIMEOUT: 300000, // 5 minutes (5 * 60 * 1000)
  
  // Conversion
  LB_TO_WL_RATIO: 5, // 5 LB = 1 WL
  
  // LB Generation Weights
  LB_COMMON_CHANCE: 0.85, // 85% chance for 1-129 LB
  LB_RARE_CHANCE: 0.15, // 15% chance for 130-200 LB
  LB_COMMON_MIN: 1,
  LB_COMMON_MAX: 129,
  LB_RARE_MIN: 130,
  LB_RARE_MAX: 200,
  
  // Reel Configuration
  REEL_TOTAL_SIZE: 65,
  REEL_TARGET_INDEX: 52,
  
  // Default Rods
  DEFAULT_ROD: 'ez_rod',
  FREE_RODS: ['ez_rod', 'basic_rod']
} as const;

export const FISHING_MESSAGES = {
  NO_BAIT: 'Bait habis! Silakan hubungi admin untuk mendapatkan bait.',
  NO_ACCESS: 'Anda tidak memiliki akses fishing. Hubungi admin.',
  INVALID_ROD: 'Rod tidak valid atau Anda tidak memiliki akses ke rod ini.',
  SESSION_EXPIRED: 'Sesi fishing Anda telah berakhir.',
  ALREADY_FISHING: 'Anda sudah sedang fishing.',
  NOT_FISHING: 'Anda tidak sedang fishing.'
} as const;
