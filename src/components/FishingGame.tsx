import React, { useState, useEffect, useRef } from 'react';
import { API } from '../utils/api';
import fishingData from '../data/fishing.json';
import { ChevronLeft, Clock, Fish, Package, X, DollarSign, Backpack, Play, Pause, Zap, List } from 'lucide-react';
import { ToastContainer } from './ToastNotification';
import { FishingCharacterAnimation } from './FishingCharacterAnimation';
import { FishingAFKLogs } from './FishingAFKLogs';

interface FishingGameProps {
  user: any;
  onBack: () => void;
}

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  fishData?: any;
}

export function FishingGame({ user, onBack }: FishingGameProps) {
  // States
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessData, setAccessData] = useState<any>(null);
  const [inventory, setInventory] = useState<any>(null);
  const [userRods, setUserRods] = useState<any[]>([]);
  const [equippedRod, setEquippedRod] = useState<string | null>(null);
  const [isAFKActive, setIsAFKActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [afkDuration, setAfkDuration] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Load access and inventory
  useEffect(() => {
    checkAccess();
    loadInventory();
    loadUserRods();
    checkAFKStatus();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (accessData && accessData.expires_at) {
      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [accessData]);

  // AFK status polling
  useEffect(() => {
    if (isAFKActive) {
      statusCheckRef.current = setInterval(() => {
        checkAFKStatus();
        loadInventory(); // Refresh balance
      }, 5000); // Check every 5 seconds

      return () => {
        if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      };
    }
  }, [isAFKActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
    };
  }, []);

  const updateTimer = () => {
    if (!accessData) return;
    const now = new Date().getTime();
    const expires = new Date(accessData.expires_at).getTime();
    const diff = expires - now;

    if (diff <= 0) {
      setTimeRemaining('Expired');
      stopAFKFishing();
      setHasAccess(false);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
  };

  const checkAccess = async () => {
    try {
      const response = await API.checkFishingAccess();
      if (response.hasAccess) {
        setHasAccess(true);
        setAccessData(response.access);
      }
    } catch (error: any) {
      console.error('Error checking access:', error);
      // If unauthorized, redirect to login
      if (error.message?.includes('Token') || error.message?.includes('401')) {
        API.logout();
        window.location.href = '/';
      }
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await API.getFishingInventory();
      setInventory(response.inventory);
      setEquippedRod(response.inventory?.equipped_rod || null);
    } catch (error: any) {
      console.error('Error loading inventory:', error);
      // Silently fail, don't redirect
    }
  };

  const loadUserRods = async () => {
    try {
      const response = await API.getUserRods();
      setUserRods(response.rods || []);
    } catch (error: any) {
      console.error('Error loading user rods:', error);
      // Silently fail, don't redirect
    }
  };

  const checkAFKStatus = async () => {
    try {
      const response = await API.getAFKStatus();
      setIsAFKActive(response.isActive || false);
      
      if (response.isActive && response.startedAt) {
        const duration = Date.now() - new Date(response.startedAt).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        setAfkDuration(`${hours}h ${minutes}m`);
      } else {
        setAfkDuration('');
      }
    } catch (error: any) {
      console.error('Error checking AFK status:', error);
      // Silently fail, don't redirect
    }
  };

  const equipRod = async (rodId: string) => {
    try {
      await API.equipFishingRod(rodId);
      setEquippedRod(rodId);
      addToast('Rod equipped successfully!', 'success');
      
      // If AFK fishing is active, restart with new rod
      if (isAFKActive) {
        await stopAFKFishing();
        setTimeout(() => startAFKFishing(), 500);
      }
    } catch (error: any) {
      console.error('Error equipping rod:', error);
      addToast(error.message || 'Failed to equip rod', 'error');
    }
  };

  const startAFKFishing = async () => {
    if (!equippedRod) {
      addToast('Pilih rod terlebih dahulu!', 'warning');
      return;
    }

    try {
      const response = await API.startAFKFishing(equippedRod);
      
      if (response.success) {
        setIsAFKActive(true);
        addToast(`AFK Fishing started with ${response.rod}!`, 'success');
      } else {
        addToast(response.message || 'Failed to start AFK fishing', 'error');
      }
    } catch (error: any) {
      console.error('Error starting AFK fishing:', error);
      addToast(error.message || 'Failed to start AFK fishing', 'error');
    }
  };

  const stopAFKFishing = async () => {
    try {
      const response = await API.stopAFKFishing();
      
      if (response.success) {
        setIsAFKActive(false);
        setAfkDuration('');
        addToast('AFK Fishing stopped', 'info');
      }
    } catch (error: any) {
      console.error('Error stopping AFK fishing:', error);
      addToast(error.message || 'Failed to stop AFK fishing', 'error');
    }
  };

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info', fishData?: any) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, fishData }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check if user has access to a rod
  const hasRodAccess = (rodId: string) => {
    if (rodId === 'basic_rod') return true; // Basic rod always available
    return userRods.some(r => r.rod_id === rodId && r.is_active);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading fishing...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <FishingPackages onBack={onBack} />;
  }

  if (showLogs) {
    return <FishingAFKLogs user={user} onBack={() => setShowLogs(false)} />;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">🎣 AFK Fishing V2</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Waktu tersisa: <span className="text-cyan-400 font-bold">{timeRemaining}</span></span>
              </div>
              {isAFKActive && afkDuration && (
                <div className="flex items-center gap-2 text-sm text-green-400 mt-1">
                  <Zap className="w-4 h-4" />
                  <span>AFK Duration: <span className="font-bold">{afkDuration}</span></span>
                </div>
              )}
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors"
              >
                <List className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white">Log Fishing</span>
              </button>
              <div className="text-center">
                <p className="text-xs text-slate-400">Saldo</p>
                <p className="text-lg font-bold text-green-400">{inventory?.fishing_saldo || 0} WL</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">Total Ikan</p>
                <p className="text-lg font-bold text-blue-400">{inventory?.total_fish_caught || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rod Selection */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Pilih Rod</h2>
            <div className="space-y-3">
              {fishingData.rods.map((rod) => {
                const hasAccess = hasRodAccess(rod.id);
                const isEquipped = equippedRod === rod.id;
                
                return (
                  <button
                    key={rod.id}
                    onClick={() => hasAccess && equipRod(rod.id)}
                    disabled={!hasAccess}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isEquipped
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : hasAccess
                        ? 'border-white/10 bg-slate-700/30 hover:border-white/30'
                        : 'border-white/5 bg-slate-700/10 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{rod.emoji}</span>
                      <div className="flex-1">
                        <p className="font-bold text-white">{rod.name}</p>
                        <p className="text-xs text-slate-400">{rod.description}</p>
                      </div>
                      {!hasAccess && rod.requiresAdmin && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        {rod.intervalMin/1000}-{rod.intervalMax/1000}s
                      </span>
                      {rod.lbBonus > 0 && (
                        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          +{Math.round(rod.lbBonus * 100)}% LB
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 space-y-2">
              {!isAFKActive ? (
                <button
                  onClick={startAFKFishing}
                  disabled={!equippedRod}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start AFK Fishing
                </button>
              ) : (
                <button
                  onClick={stopAFKFishing}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Pause className="w-5 h-5" />
                  Stop AFK Fishing
                </button>
              )}
            </div>

            {/* Price Tiers Info */}
            <div className="mt-6 bg-slate-700/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-sm font-bold text-white mb-2">💰 Price Tiers</h3>
              <div className="space-y-1 text-xs text-slate-300">
                {fishingData.lb_price_tiers.map((tier) => (
                  <div key={tier.label} className="flex justify-between">
                    <span>{tier.label}:</span>
                    <span className="text-green-400 font-bold">{tier.pricePerLb} WL/LB</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Fishing Animation */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-b from-sky-900/30 to-blue-900/30 rounded-xl p-8 border border-white/10 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Water effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-500/10"></div>
            
            {/* Character fishing animation */}
            <div className="relative z-10">
              <FishingCharacterAnimation isActive={isAFKActive} className="mb-4" />
              
              <div className="text-center mt-6">
                <p className="text-2xl font-bold text-white mb-2">
                  {isAFKActive ? '🌊 AFK Fishing Active' : '⏸️ Ready to Fish'}
                </p>
                {equippedRod && (
                  <p className="text-slate-300">
                    Using: {fishingData.rods.find(r => r.id === equippedRod)?.name}
                  </p>
                )}
                {isAFKActive && (
                  <div className="mt-4 bg-black/30 backdrop-blur-sm rounded-lg px-6 py-3 inline-block">
                    <p className="text-cyan-400 text-sm">
                      ✨ Ikan akan otomatis terjual dan masuk ke saldo Anda
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Tutup browser tidak masalah, fishing tetap berjalan!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status indicator */}
            {isAFKActive && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500/20 backdrop-blur-sm border border-green-500/50 px-6 py-3 rounded-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-green-400 font-bold">Server-side fishing active</p>
                </div>
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-2">🎣 How It Works</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Pilih rod yang Anda miliki</li>
                <li>• Klik "Start AFK Fishing"</li>
                <li>• Ikan otomatis tertangkap & terjual</li>
                <li>• WL langsung masuk ke saldo</li>
                <li>• Bisa tutup browser!</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold text-white mb-2">🎯 Rod System</h3>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• <span className="text-slate-400">Basic:</span> Free, 8-10s</li>
                <li>• <span className="text-green-400">Lico:</span> 6-8s, +30% LB</li>
                <li>• <span className="text-yellow-400">Golden:</span> 5-6s, +30% LB</li>
                <li>• <span className="text-orange-400">Thanksgiving:</span> 4-5s, +70% LB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fishing Packages Component
function FishingPackages({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🎣 Paket AFK Fishing V2</h1>
          <p className="text-slate-400">Pilih paket yang sesuai dengan kebutuhan Anda</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {fishingData.packages.map((pkg: any) => (
            <div
              key={pkg.id}
              className={`bg-slate-800/50 rounded-xl p-6 border-2 ${
                pkg.popular ? 'border-cyan-500' : 'border-white/10'
              } relative`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 px-4 py-1 rounded-full">
                  <span className="text-xs font-bold text-white">POPULER</span>
                </div>
              )}
              <div className="text-center">
                <div className="text-5xl mb-4">{pkg.badge}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                <p className="text-3xl font-black text-cyan-400 mb-4">{pkg.duration_days} Hari</p>
                <p className="text-slate-400 text-sm mb-6">{pkg.description}</p>
                <button 
                  onClick={() => window.open(fishingData.admin_contact.discord, '_blank')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all"
                >
                  💬 Hubungi Admin
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-400 mb-3">📞 Cara Pembelian</h3>
          <div className="text-slate-300 space-y-2">
            <p>1. Transfer ke Admin: <span className="font-bold text-white">{fishingData.admin_contact.name}</span></p>
            <p>2. Discord: <span className="font-bold text-cyan-400">{fishingData.admin_contact.discord}</span></p>
            <p>3. Setelah transfer, hubungi admin untuk aktivasi akses</p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">✨ Fitur AFK Fishing V2</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎣</span>
              <div>
                <p className="font-bold text-white">4 Rod System</p>
                <p className="text-sm text-slate-400">Basic, Lico, Golden, Thanksgiving</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-white">Auto-Sell</p>
                <p className="text-sm text-slate-400">Ikan langsung terjual, WL masuk saldo</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌊</span>
              <div>
                <p className="font-bold text-white">Server-Side</p>
                <p className="text-sm text-slate-400">Tetap jalan walau browser ditutup</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-bold text-white">LB 1-200</p>
                <p className="text-sm text-slate-400">5 price tiers, bonus dari rod</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
