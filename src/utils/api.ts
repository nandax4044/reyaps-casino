/**
 * Unified Client API Service Layer
 * Connects React UI components securely to the server.ts backend proxy
 */

const getAuthToken = () => localStorage.getItem('auth_token') || '';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let response = await fetch(endpoint, {
    ...options,
    headers
  });

  // If 401 and we have a refresh token, try to refresh ONCE
  if (response.status === 401 && localStorage.getItem('refresh_token')) {
    console.log('[API] Token expired, attempting refresh...');
    const refreshed = await refreshAuthToken();
    
    if (refreshed) {
      // Retry the original request with new token
      const newToken = getAuthToken();
      const newHeaders = {
        'Content-Type': 'application/json',
        ...(newToken ? { 'Authorization': `Bearer ${newToken}` } : {}),
        ...(options.headers || {})
      };
      
      response = await fetch(endpoint, {
        ...options,
        headers: newHeaders
      });
    } else {
      // Refresh failed, clear everything and throw error
      console.log('[API] Refresh failed, clearing tokens');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      throw new Error('Token tidak valid atau sudah kadaluarsa. Silakan login ulang.');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

async function refreshAuthToken(): Promise<boolean> {
  try {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) return false;

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token })
    });

    if (!response.ok) {
      // Refresh failed, clear tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      return false;
    }

    const data = await response.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      console.log('[API] Token refreshed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[API] Token refresh failed:', error);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    return false;
  }
}

export const API = {
  // Auth Operations
  async register(params: { email: string; username: string; password: string }) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    }
    return data;
  },

  async login(params: { loginKey: string; password: string }) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    }
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  isLoggedIn() {
    return !!getAuthToken();
  },

  async getProfile() {
    return request('/api/user/profile');
  },

  async getInventory() {
    return request('/api/user/inventory');
  },

  async requestWithdraw(itemId: string) {
    return request('/api/user/withdraw', {
      method: 'POST',
      body: JSON.stringify({ itemId })
    });
  },

  // Game Endpoints
  async deductBalance(cost: number) {
    return request('/api/user/deduct', {
      method: 'POST',
      body: JSON.stringify({ cost })
    });
  },

  async addWinningItem(params: {
    name: string;
    rarity: string;
    value: number;
    icon: string;
    image: string;
    addedBalance?: number;
    deductAmount?: number;
  }) {
    return request('/api/user/add-win', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getGameConfig(gameType: 'cases' | 'crash') {
    // Game config is public - try without token first, fallback with token
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`/api/games/config/${gameType}`, { headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  async getOnlinePlayers() {
    return request('/api/users/online');
  },

  // Staff/Admin Endpoints
  async getAdminUsers() {
    return request('/api/admin/users');
  },

  async updateUserBalance(userId: string, balance: number) {
    return request(`/api/admin/users/${userId}/balance`, {
      method: 'POST',
      body: JSON.stringify({ balance })
    });
  },

  async updateUserProfile(userId: string, params: { username?: string; email?: string; is_staff?: boolean }) {
    return request(`/api/admin/users/${userId}/edit`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getUserInventory(userId: string) {
    return request(`/api/admin/users/${userId}/inventory`);
  },

  async updateGameConfig(gameType: 'cases' | 'crash', config: any) {
    return request(`/api/admin/config/${gameType}/update`, {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  },

  async resetGameConfig(gameType: 'cases' | 'crash') {
    return request(`/api/admin/config/${gameType}/reset`, {
      method: 'POST'
    });
  },

  async clearUserInventory(userId: string) {
    return request(`/api/admin/users/${userId}/inventory/clear`, {
      method: 'DELETE'
    });
  },

  async deleteInventoryItem(itemId: string) {
    return request(`/api/admin/inventory/${itemId}`, {
      method: 'DELETE'
    });
  },

  // Withdrawal Endpoints
  async getWithdrawalLogs(status?: string) {
    const url = status 
      ? `/api/admin/withdrawals?status=${status}`
      : '/api/admin/withdrawals';
    return request(url);
  },

  async completeWithdrawal(withdrawalId: string, notes?: string) {
    return request(`/api/admin/withdrawals/${withdrawalId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes })
    });
  },

  async rejectWithdrawal(withdrawalId: string, reason: string) {
    return request(`/api/admin/withdrawals/${withdrawalId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async getUserWithdrawalHistory(userId: string) {
    return request(`/api/user/withdrawals/${userId}`);
  },

  // Fishing Endpoints
  async checkFishingAccess() {
    return request('/api/fishing/check-access');
  },

  async getFishingInventory() {
    return request('/api/fishing/inventory');
  },

  async equipFishingRod(rod: string) {
    return request('/api/fishing/equip-rod', {
      method: 'POST',
      body: JSON.stringify({ rod })
    });
  },

  async catchFish(params: { fish_id: number; fish_name: string; lb: number; is_perfect: boolean; action: 'sell' | 'save' }) {
    return request('/api/fishing/catch-fish', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async getFishInventory() {
    return request('/api/fishing/fish-inventory');
  },

  async sellFish(fishId: string) {
    return request('/api/fishing/sell-fish', {
      method: 'POST',
      body: JSON.stringify({ fish_id: fishId })
    });
  },

  async sellAllFish() {
    return request('/api/fishing/sell-all-fish', {
      method: 'POST'
    });
  },

  // AFK Fishing Endpoints
  async startAFKFishing(rod: string) {
    return request('/api/fishing/afk/start', {
      method: 'POST',
      body: JSON.stringify({ rod })
    });
  },

  async stopAFKFishing() {
    return request('/api/fishing/afk/stop', {
      method: 'POST'
    });
  },

  async getAFKStatus() {
    return request('/api/fishing/afk/status');
  },

  async getFishingLogs() {
    return request('/api/fishing/logs');
  },

  async claimPendingFish(limit: number = 10) {
    return request('/api/fishing/claim-pending', {
      method: 'POST',
      body: JSON.stringify({ limit })
    });
  },

  // Convert Fishing Saldo to Main Balance
  async convertFishingSaldo(amount: number) {
    return request('/api/fishing/convert-saldo', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  },

  // User Rod Access
  async getUserRods() {
    return request('/api/fishing/user-rods');
  },

  // Admin Fishing Endpoints
  async getAdminFishingAccessList() {
    return request('/api/admin/fishing/access-list');
  },

  async grantFishingAccess(userId: string, durationDays: number) {
    return request('/api/admin/fishing/grant-access', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, duration_days: durationDays })
    });
  },

  async revokeFishingAccess(accessId: string) {
    return request('/api/admin/fishing/revoke-access', {
      method: 'POST',
      body: JSON.stringify({ access_id: accessId })
    });
  },

  async getActiveFishers() {
    return request('/api/admin/fishing/active');
  },

  // Admin Rod Management
  async getUserRodAccess(userId: string) {
    return request(`/api/admin/fishing/user-rods/${userId}`);
  },

  async grantRodAccess(userId: string, rodId: string, notes?: string) {
    return request('/api/admin/fishing/grant-rod', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, rod_id: rodId, notes })
    });
  },

  async revokeRodAccess(userId: string, rodId: string) {
    return request('/api/admin/fishing/revoke-rod', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, rod_id: rodId })
    });
  },

  // Admin Bait Management
  async grantBait(userId: string, amount: number, notes?: string) {
    return request('/api/admin/fishing/grant-bait', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount, notes })
    });
  },

  async getUserFishingInventory(userId: string) {
    return request(`/api/admin/fishing/user-inventory/${userId}`);
  },

  // Admin Price Configuration
  async getFishingPriceConfig() {
    return request('/api/admin/fishing/price-config');
  },

  async updateFishingPriceConfig(config: Array<{ id: string; price_per_lb: number }>) {
    return request('/api/admin/fishing/price-config', {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  },

  async resetFishingPriceConfig() {
    return request('/api/admin/fishing/price-config/reset', {
      method: 'POST'
    });
  }
};
