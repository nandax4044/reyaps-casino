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

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
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
    }
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
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

  async getGameConfig(gameType: 'cases' | 'wheel' | 'crash') {
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

  async updateGameConfig(gameType: 'cases' | 'wheel' | 'crash', config: any) {
    return request(`/api/admin/config/${gameType}/update`, {
      method: 'POST',
      body: JSON.stringify({ config })
    });
  },

  async resetGameConfig(gameType: 'cases' | 'wheel' | 'crash') {
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
  }
};
