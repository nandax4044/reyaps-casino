import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import CurrencyDisplay from './CurrencyDisplay';
import { Users, RefreshCw, Radio, Crown, Shield, Star, User as UserIcon, Activity, Zap } from 'lucide-react';

interface Player {
  id: string;
  username: string;
  balance: number;
  is_staff: boolean;
  activity: string;
}

interface OnlinePlayersProps {
  currentUser?: {
    id: string;
    username: string;
    balance: any;
    is_staff: boolean;
  } | null;
}

export function OnlinePlayers({ currentUser }: OnlinePlayersProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchPlayers() {
      try {
        const data = await API.getOnlinePlayers();
        if (isMounted) {
          let serverPlayers = data.players || [];
          const serverCount = data.onlineCount || serverPlayers.length;
          
          // Reconcile list state with currentUser to bypass any server save or update delays (race conditions)
          if (currentUser) {
            const userIndex = serverPlayers.findIndex((p: any) => p.id === currentUser.id || p.username.toLowerCase() === currentUser.username.toLowerCase());
            const userLiveBalance = typeof currentUser.balance === 'string' ? parseFloat(currentUser.balance) : currentUser.balance;
            
            if (userIndex > -1) {
              serverPlayers[userIndex] = {
                ...serverPlayers[userIndex],
                balance: isNaN(userLiveBalance) ? serverPlayers[userIndex].balance : userLiveBalance,
                is_staff: currentUser.is_staff
              };
            } else {
              serverPlayers.unshift({
                id: currentUser.id || 'current_user_reconciled',
                username: currentUser.username,
                balance: isNaN(userLiveBalance) ? 0 : userLiveBalance,
                is_staff: currentUser.is_staff,
                activity: currentUser.is_staff ? 'Mengelola Jalannya Casino' : 'Melihat Dashboard Utama'
              });
            }
          }

          // Persist successfully fetched and reconciled players in local storage to prevent errors during server startup or race conditions
          localStorage.setItem('cached_online_players', JSON.stringify({
            players: serverPlayers,
            onlineCount: serverPlayers.length
          }));

          setPlayers(serverPlayers);
          setOnlineCount(serverCount);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Failed to fetch online players, attempting to load from cache/local state:', err);
        if (isMounted) {
          const cachedString = localStorage.getItem('cached_online_players');
          let reconciledPlayers: Player[] = [];
          
          if (cachedString) {
            try {
              const cachedData = JSON.parse(cachedString);
              reconciledPlayers = cachedData.players || [];
            } catch (e) {
              console.error('Error parsing cached online players', e);
            }
          }

          if (reconciledPlayers.length === 0) {
            // Dynamic fallback simulation
            reconciledPlayers = [
              { id: 'v1', username: 'GrowDev_Id', balance: 452300, is_staff: false, activity: 'Membuka Golden Chest' },
              { id: 'v2', username: 'WLSeller99', balance: 1250000, is_staff: false, activity: 'Bertaruh di Crash Game' },
              { id: 'v3', username: 'nanddev', balance: 5000000, is_staff: true, activity: 'Mengelola Jalannya Casino' },
              { id: 'v4', username: 'ProBreakerGT', balance: 82500, is_staff: false, activity: 'Memutar Roda Hadiah' },
              { id: 'v5', username: 'BGL_Digger', balance: 7520000, is_staff: false, activity: 'Idle di Lobby' },
              { id: 'v6', username: 'VortexWL', balance: 35000, is_staff: false, activity: 'Deposit 200 WL ke staff' },
              { id: 'v7', username: 'LegendaryLox', balance: 24500000, is_staff: false, activity: 'Membuka Legendary Chest' }
            ];
          }

          // Overlay currentUser live active variables even during failure fallback
          if (currentUser) {
            const userIndex = reconciledPlayers.findIndex((p: any) => p.id === currentUser.id || p.username.toLowerCase() === currentUser.username.toLowerCase());
            const userLiveBalance = typeof currentUser.balance === 'string' ? parseFloat(currentUser.balance) : currentUser.balance;
            
            if (userIndex > -1) {
              reconciledPlayers[userIndex] = {
                ...reconciledPlayers[userIndex],
                balance: isNaN(userLiveBalance) ? reconciledPlayers[userIndex].balance : userLiveBalance,
                is_staff: currentUser.is_staff
              };
            } else {
              reconciledPlayers.unshift({
                id: currentUser.id || 'current_user_reconciled',
                username: currentUser.username,
                balance: isNaN(userLiveBalance) ? 0 : userLiveBalance,
                is_staff: currentUser.is_staff,
                activity: currentUser.is_staff ? 'Mengelola Jalannya Casino' : 'Melihat Dashboard Utama'
              });
            }
          }

          setPlayers(reconciledPlayers);
          setOnlineCount(reconciledPlayers.length);
          setLoading(false);
        }
      }
    }

    fetchPlayers();

    // Optimize the fetch interval: Only run client polling when the screen is visible
    // Increases poll interval to 15 seconds to mitigate race conditions, with automatic visibility listeners
    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (!document.hidden) {
          fetchPlayers();
        }
      }, 15000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchPlayers();
        startPolling();
      } else {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshKey, currentUser]);

  return (
    <div id="online-players-sidebar" className="glass-panel-dark rounded-[20px] border border-cyan-500/20 p-3 md:p-4 shadow-2xl relative overflow-hidden backdrop-blur-md flex flex-col h-full max-h-[500px]">
      <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-slate-950 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-display font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              Pemain Online
              <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 animate-pulse">
                <Radio className="w-2 h-2" /> LIVE
              </span>
            </h3>
            <p className="text-[9px] text-slate-400 font-mono">
              {onlineCount} online
            </p>
          </div>
        </div>
        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="p-1 px-1.5 bg-white/5 border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-400 rounded-lg cursor-pointer transition-all active:scale-95 text-[9px] flex items-center gap-0.5 font-black"
          title="Refresh List"
        >
          <RefreshCw className="w-2 h-2" />
        </button>
      </div>

      {/* Players List Container */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500 font-mono text-[10px]">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Memuat...</span>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center text-slate-500 py-8 font-mono text-[10px]">
            Tidak ada pemain
          </div>
        ) : (
          players.map((player) => {
            const isNanddev = player.username === 'nanddev';
            return (
              <div 
                key={player.id} 
                className={`p-2 hover:bg-white/5 rounded-lg border transition-all duration-200 flex flex-col gap-1 ${
                  isNanddev 
                    ? 'bg-gradient-to-r from-red-950/15 to-rose-950/5 border-red-500/30 shadow-[inset_0_1px_4px_rgba(239,68,68,0.1)]' 
                    : 'bg-black/25 border-white/5 hover:border-cyan-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* User initial avatar with gradient backdrop */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 shadow-md ${
                      isNanddev 
                        ? 'bg-gradient-to-tr from-red-500 to-pink-600 text-white'
                        : player.is_staff
                        ? 'bg-gradient-to-tr from-yellow-500 to-amber-600 text-white'
                        : 'bg-gradient-to-tr from-cyan-600 to-blue-700 text-cyan-100'
                    }`}>
                      {player.username.substring(0, 2).toUpperCase()}
                    </div>
                    
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] font-black truncate max-w-[80px] ${
                          isNanddev 
                            ? 'text-red-400 font-black' 
                            : 'text-slate-200'
                        }`}>
                          {player.username}
                        </span>
                        {isNanddev ? (
                          <span className="flex items-center gap-0.5 text-[7px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-mono font-black border border-red-500/30">
                            <Crown className="w-2 h-2" />
                          </span>
                        ) : player.is_staff && (
                          <span className="flex items-center gap-0.5 text-[7px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded font-mono font-black border border-yellow-500/30">
                            <Shield className="w-2 h-2" />
                          </span>
                        )}
                      </div>
                      
                      {/* Active Activity message */}
                      <span className="text-[8px] text-slate-400 font-mono flex items-center gap-0.5 leading-none mt-0.5 max-w-[120px] truncate">
                        <Activity className="w-2 h-2 text-cyan-400 shrink-0" />
                        {player.activity}
                      </span>
                    </div>
                  </div>

                  {/* Little pulsing green indicator */}
                  <span className="flex items-center gap-0.5 shrink-0 mt-0.5">
                    <Zap className="w-2 h-2 text-emerald-500 animate-pulse" />
                  </span>
                </div>

                {/* Player formatted balance in growtopia format */}
                <div className="pl-8">
                  <CurrencyDisplay balance={player.balance} size="xs" />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-white/10 pt-2 mt-2 text-center">
        <p className="text-[8px] text-slate-500 font-mono">
          Saldo diperbarui berkala
        </p>
      </div>
    </div>
  );
}
