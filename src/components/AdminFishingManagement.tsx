import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { Fish, Clock, UserPlus, UserMinus, RefreshCw, AlertCircle, LogIn, Settings, DollarSign, Save, RotateCcw, Worm } from 'lucide-react';
import fishingData from '../data/fishing.json';

interface AdminFishingManagementProps {
  onClose: () => void;
  onEnterFishingRoom?: () => void;
}

type TabType = 'access' | 'rods' | 'bait' | 'prices';

export function AdminFishingManagement({ onClose, onEnterFishingRoom }: AdminFishingManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('access');
  const [users, setUsers] = useState<any[]>([]);
  const [accessList, setAccessList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [duration, setDuration] = useState<number>(7);
  const [processing, setProcessing] = useState(false);

  // Rod Management States
  const [showRodModal, setShowRodModal] = useState(false);
  const [selectedRodUser, setSelectedRodUser] = useState<string>('');
  const [selectedRod, setSelectedRod] = useState<string>('');
  const [rodNotes, setRodNotes] = useState<string>('');
  const [userRods, setUserRods] = useState<Record<string, any[]>>({});

  // Price Config States
  const [priceConfig, setPriceConfig] = useState<any[]>([]);
  const [editingPrices, setEditingPrices] = useState(false);

  // Bait Management States
  const [showBaitModal, setShowBaitModal] = useState(false);
  const [selectedBaitUser, setSelectedBaitUser] = useState<string>('');
  const [baitAmount, setBaitAmount] = useState<number>(100);
  const [baitNotes, setBaitNotes] = useState<string>('');
  const [userBaitBalances, setUserBaitBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'rods') {
      loadAllUserRods();
    } else if (activeTab === 'prices') {
      loadPriceConfig();
    } else if (activeTab === 'bait') {
      loadUserBaitBalances();
    }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all users
      const usersResponse = await API.getAdminUsers();
      setUsers(usersResponse.users || []);

      // Load all fishing access
      const accessResponse = await API.getAdminFishingAccessList();
      setAccessList(accessResponse.access || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      // If unauthorized, redirect to login
      if (error.message?.includes('Token') || error.message?.includes('401')) {
        alert('Session expired. Please login again.');
        API.logout();
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAllUserRods = async () => {
    try {
      const rodsData: Record<string, any[]> = {};
      for (const user of users) {
        const response = await API.getUserRodAccess(user.id);
        rodsData[user.id] = response.rods || [];
      }
      setUserRods(rodsData);
    } catch (error) {
      console.error('Error loading user rods:', error);
    }
  };

  const loadPriceConfig = async () => {
    try {
      const response = await API.getFishingPriceConfig();
      setPriceConfig(response.config || []);
    } catch (error) {
      console.error('Error loading price config:', error);
    }
  };

  const loadUserBaitBalances = async () => {
    try {
      const balances: Record<string, number> = {};
      for (const user of users) {
        try {
          const response = await API.getUserFishingInventory(user.id);
          balances[user.id] = response.inventory?.bait_balance || 0;
        } catch (error) {
          balances[user.id] = 0;
        }
      }
      setUserBaitBalances(balances);
    } catch (error) {
      console.error('Error loading bait balances:', error);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedUser || !duration) {
      alert('Pilih user dan durasi!');
      return;
    }

    setProcessing(true);
    try {
      await API.grantFishingAccess(selectedUser, duration);

      alert('Akses fishing berhasil diberikan!');
      setShowGrantModal(false);
      setSelectedUser('');
      setDuration(7);
      loadData();
    } catch (error: any) {
      console.error('Error granting access:', error);
      alert('Gagal memberikan akses: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeAccess = async (accessId: string, username: string) => {
    if (!confirm(`Cabut akses fishing dari ${username}?`)) return;

    setProcessing(true);
    try {
      await API.revokeFishingAccess(accessId);

      alert('Akses fishing berhasil dicabut!');
      loadData();
    } catch (error: any) {
      console.error('Error revoking access:', error);
      alert('Gagal mencabut akses: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGrantRod = async () => {
    if (!selectedRodUser || !selectedRod) {
      alert('Pilih user dan rod!');
      return;
    }

    setProcessing(true);
    try {
      await API.grantRodAccess(selectedRodUser, selectedRod, rodNotes);

      alert('Rod berhasil diberikan!');
      setShowRodModal(false);
      setSelectedRodUser('');
      setSelectedRod('');
      setRodNotes('');
      loadAllUserRods();
    } catch (error: any) {
      console.error('Error granting rod:', error);
      const errorMsg = error.message || 'Unknown error';
      
      // Check if it's a token expiration error
      if (errorMsg.includes('Token tidak valid') || errorMsg.includes('kadaluarsa') || errorMsg.includes('Sesi tidak valid')) {
        alert('⚠️ Sesi Anda telah berakhir!\n\nSilakan logout dan login kembali untuk melanjutkan.');
        // Optionally auto-logout
        // API.logout();
        // window.location.href = '/';
      } else {
        alert('Gagal memberikan rod: ' + errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRevokeRod = async (userId: string, rodId: string, username: string) => {
    if (!confirm(`Cabut ${rodId} dari ${username}?`)) return;

    setProcessing(true);
    try {
      await API.revokeRodAccess(userId, rodId);

      alert('Rod berhasil dicabut!');
      loadAllUserRods();
    } catch (error: any) {
      console.error('Error revoking rod:', error);
      alert('Gagal mencabut rod: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleSavePrices = async () => {
    setProcessing(true);
    try {
      await API.updateFishingPriceConfig(priceConfig);

      alert('Harga berhasil diupdate!');
      setEditingPrices(false);
      loadPriceConfig();
    } catch (error: any) {
      console.error('Error updating prices:', error);
      alert('Gagal update harga: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleResetPrices = async () => {
    if (!confirm('Reset harga ke default?')) return;

    setProcessing(true);
    try {
      await API.resetFishingPriceConfig();

      alert('Harga berhasil direset ke default!');
      loadPriceConfig();
    } catch (error: any) {
      console.error('Error resetting prices:', error);
      alert('Gagal reset harga: ' + (error.message || 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleGrantBait = async () => {
    if (!selectedBaitUser || !baitAmount) {
      alert('Pilih user dan jumlah bait!');
      return;
    }

    if (baitAmount <= 0) {
      alert('Jumlah bait harus lebih dari 0!');
      return;
    }

    setProcessing(true);
    try {
      await API.grantBait(selectedBaitUser, baitAmount, baitNotes);

      alert(`Berhasil memberikan ${baitAmount} bait!`);
      setShowBaitModal(false);
      setSelectedBaitUser('');
      setBaitAmount(100);
      setBaitNotes('');
      loadUserBaitBalances();
    } catch (error: any) {
      console.error('Error granting bait:', error);
      const errorMsg = error.message || 'Unknown error';
      
      if (errorMsg.includes('Token tidak valid') || errorMsg.includes('kadaluarsa') || errorMsg.includes('Sesi tidak valid')) {
        alert('⚠️ Sesi Anda telah berakhir!\n\nSilakan logout dan login kembali untuk melanjutkan.');
      } else {
        alert('Gagal memberikan bait: ' + errorMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const updatePriceValue = (id: string, newPrice: number) => {
    setPriceConfig(prev => 
      prev.map(tier => 
        tier.id === id ? { ...tier, price_per_lb: newPrice } : tier
      )
    );
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading fishing management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">🎣 Fishing Management V2</h1>
              <p className="text-slate-400">Kelola akses, rod, dan harga fishing</p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
            >
              Kembali
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('access')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'access'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Access Management
            </button>
            <button
              onClick={() => setActiveTab('rods')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'rods'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Fish className="w-4 h-4 inline mr-2" />
              Rod Management
            </button>
            <button
              onClick={() => setActiveTab('bait')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'bait'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Worm className="w-4 h-4 inline mr-2" />
              Bait Management
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`px-4 py-2 rounded-lg font-bold transition-all ${
                activeTab === 'prices'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Price Configuration
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {activeTab === 'access' && (
              <>
                <button
                  onClick={() => setShowGrantModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
                >
                  <UserPlus className="w-5 h-5" />
                  Beri Akses Baru
                </button>
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </>
            )}
            {activeTab === 'rods' && (
              <>
                <button
                  onClick={() => setShowRodModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-lg transition-all"
                >
                  <Fish className="w-5 h-5" />
                  Grant Rod
                </button>
                <button
                  onClick={loadAllUserRods}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </>
            )}
            {activeTab === 'bait' && (
              <>
                <button
                  onClick={() => setShowBaitModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg transition-all"
                >
                  <Worm className="w-5 h-5" />
                  Grant Bait
                </button>
                <button
                  onClick={loadUserBaitBalances}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </>
            )}
            {activeTab === 'prices' && (
              <>
                {!editingPrices ? (
                  <button
                    onClick={() => setEditingPrices(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all"
                  >
                    <Settings className="w-5 h-5" />
                    Edit Prices
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSavePrices}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all"
                    >
                      <Save className="w-5 h-5" />
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditingPrices(false);
                        loadPriceConfig();
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={handleResetPrices}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-lg transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset to Default
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'access' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Fish className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-sm text-slate-400">Total Access</p>
                    <p className="text-2xl font-bold text-white">{accessList.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-sm text-slate-400">Active Access</p>
                    <p className="text-2xl font-bold text-white">
                      {accessList.filter(a => a.is_active && new Date(a.expires_at) > new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                  <div>
                    <p className="text-sm text-slate-400">Expired</p>
                    <p className="text-2xl font-bold text-white">
                      {accessList.filter(a => !a.is_active || new Date(a.expires_at) <= new Date()).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Access List Table */}
            <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Expires At</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Time Left</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {accessList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          Belum ada user dengan akses fishing
                        </td>
                      </tr>
                    ) : (
                      accessList.map((access) => {
                        const isActive = access.is_active && new Date(access.expires_at) > new Date();
                        const user = users.find(u => u.id === access.user_id);
                        
                        return (
                          <tr key={access.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-white">{user?.username || 'Unknown'}</p>
                                <p className="text-xs text-slate-400">{user?.email || '-'}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-300">{access.duration_days} hari</td>
                            <td className="px-6 py-4 text-slate-300">
                              {new Date(access.expires_at).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`font-bold ${isActive ? 'text-cyan-400' : 'text-red-400'}`}>
                                {formatTimeRemaining(access.expires_at)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {isActive ? (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">Active</span>
                              ) : (
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full border border-red-500/30">Expired</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {isActive && onEnterFishingRoom && (
                                  <button
                                    onClick={onEnterFishingRoom}
                                    className="flex items-center gap-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm rounded transition-all"
                                    title="Masuk ke Room AFK Fishing"
                                  >
                                    <LogIn className="w-4 h-4" />
                                    Masuk Room
                                  </button>
                                )}
                                {isActive && (
                                  <button
                                    onClick={() => handleRevokeAccess(access.id, user?.username || 'User')}
                                    disabled={processing}
                                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-sm rounded transition-all"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                    Cabut
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Rod Management Tab */}
        {activeTab === 'rods' && (
          <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Lico Rod</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Golden Rod</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Thanksgiving Rod</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada user
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const rods = userRods[user.id] || [];
                      const hasLico = rods.some(r => r.rod_id === 'lico_rod' && r.is_active);
                      const hasGolden = rods.some(r => r.rod_id === 'golden_rod' && r.is_active);
                      const hasThanksgiving = rods.some(r => r.rod_id === 'thanksgiving_rod' && r.is_active);
                      
                      return (
                        <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{user.username}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {hasLico ? (
                              <button
                                onClick={() => handleRevokeRod(user.id, 'lico_rod', user.username)}
                                disabled={processing}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs rounded transition-all"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-slate-500 text-xs">Not granted</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {hasGolden ? (
                              <button
                                onClick={() => handleRevokeRod(user.id, 'golden_rod', user.username)}
                                disabled={processing}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs rounded transition-all"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-slate-500 text-xs">Not granted</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {hasThanksgiving ? (
                              <button
                                onClick={() => handleRevokeRod(user.id, 'thanksgiving_rod', user.username)}
                                disabled={processing}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white text-xs rounded transition-all"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-slate-500 text-xs">Not granted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Price Configuration Tab */}
        {activeTab === 'prices' && (
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">💰 Fish Price Tiers</h2>
            <p className="text-slate-400 text-sm mb-6">
              Configure how much WL users get per LB of fish caught
            </p>

            <div className="space-y-4">
              {priceConfig.map((tier) => (
                <div key={tier.id} className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-white mb-1">{tier.label}</p>
                      <p className="text-xs text-slate-400">
                        {tier.lb_min} - {tier.lb_max} LB
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingPrices ? (
                        <input
                          type="number"
                          value={tier.price_per_lb}
                          onChange={(e) => updatePriceValue(tier.id, parseInt(e.target.value) || 0)}
                          className="w-24 bg-slate-600 border border-white/10 rounded px-3 py-2 text-white text-center focus:outline-none focus:border-cyan-500"
                          min="1"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-green-400">
                          {tier.price_per_lb}
                        </span>
                      )}
                      <span className="text-slate-400">WL/LB</span>
                    </div>
                  </div>
                  {editingPrices && (
                    <p className="text-xs text-slate-500 mt-2">
                      Example: {tier.lb_min} LB = {tier.lb_min * tier.price_per_lb} WL, {tier.lb_max} LB = {tier.lb_max * tier.price_per_lb} WL
                    </p>
                  )}
                </div>
              ))}
            </div>

            {!editingPrices && (
              <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Tip:</strong> Higher price tiers encourage users to use better rods for bigger fish!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Bait Management Tab */}
        {activeTab === 'bait' && (
          <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Bait Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        Tidak ada user
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const baitBalance = userBaitBalances[user.id] || 0;
                      
                      return (
                        <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-white">{user.username}</p>
                              <p className="text-xs text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Worm className="w-5 h-5 text-purple-400" />
                              <span className={`text-xl font-bold ${baitBalance > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                                {baitBalance}
                              </span>
                              <span className="text-slate-400 text-sm">bait</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => {
                                setSelectedBaitUser(user.id);
                                setShowBaitModal(true);
                              }}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded transition-all"
                            >
                              Grant Bait
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-cyan-500">
            <h2 className="text-2xl font-bold text-white mb-4">🎣 Beri Akses Fishing</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Pilih User</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Pilih User --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Durasi Akses</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={1}>1 Hari</option>
                  <option value={3}>3 Hari</option>
                  <option value={7}>7 Hari (1 Minggu)</option>
                  <option value={14}>14 Hari (2 Minggu)</option>
                  <option value={30}>30 Hari (1 Bulan)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGrantAccess}
                disabled={processing || !selectedUser}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all"
              >
                {processing ? 'Processing...' : 'Beri Akses'}
              </button>
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedUser('');
                  setDuration(7);
                }}
                disabled={processing}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-bold rounded-lg transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Rod Modal */}
      {showRodModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-green-500">
            <h2 className="text-2xl font-bold text-white mb-4">🎣 Grant Rod Access</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Pilih User</label>
                <select
                  value={selectedRodUser}
                  onChange={(e) => setSelectedRodUser(e.target.value)}
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">-- Pilih User --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Pilih Rod</label>
                <select
                  value={selectedRod}
                  onChange={(e) => setSelectedRod(e.target.value)}
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">-- Pilih Rod --</option>
                  {fishingData.rods
                    .filter(r => r.requiresAdmin)
                    .map((rod) => (
                      <option key={rod.id} value={rod.id}>
                        {rod.emoji} {rod.name} - {rod.description}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={rodNotes}
                  onChange={(e) => setRodNotes(e.target.value)}
                  placeholder="e.g., Granted for premium purchase"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGrantRod}
                disabled={processing || !selectedRodUser || !selectedRod}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all"
              >
                {processing ? 'Processing...' : 'Grant Rod'}
              </button>
              <button
                onClick={() => {
                  setShowRodModal(false);
                  setSelectedRodUser('');
                  setSelectedRod('');
                  setRodNotes('');
                }}
                disabled={processing}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-bold rounded-lg transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Bait Modal */}
      {showBaitModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border-2 border-purple-500">
            <h2 className="text-2xl font-bold text-white mb-4">🪱 Grant Bait</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Pilih User</label>
                <select
                  value={selectedBaitUser}
                  onChange={(e) => setSelectedBaitUser(e.target.value)}
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Pilih User --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email}) - Current: {userBaitBalances[user.id] || 0} bait
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Jumlah Bait</label>
                <input
                  type="number"
                  value={baitAmount}
                  onChange={(e) => setBaitAmount(parseInt(e.target.value) || 0)}
                  min="1"
                  placeholder="100"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  💡 Recommended: 100-500 bait per grant
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={baitNotes}
                  onChange={(e) => setBaitNotes(e.target.value)}
                  placeholder="e.g., Weekly bait grant"
                  className="w-full bg-slate-700 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGrantBait}
                disabled={processing || !selectedBaitUser || !baitAmount || baitAmount <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all"
              >
                {processing ? 'Processing...' : 'Grant Bait'}
              </button>
              <button
                onClick={() => {
                  setShowBaitModal(false);
                  setSelectedBaitUser('');
                  setBaitAmount(100);
                  setBaitNotes('');
                }}
                disabled={processing}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-bold rounded-lg transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
