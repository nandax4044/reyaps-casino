import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import { Fish, DollarSign, Package, X, ChevronLeft, Worm } from 'lucide-react';

interface FishingAFKLogsProps {
  user: any;
  onBack: () => void;
}

interface FishLog {
  id: string;
  fish_name: string;
  lb: number;
  base_lb: number;
  is_sold: boolean;
  sell_price: number;
  caught_at: string;
  sold_at: string | null;
}

interface FishTypeStats {
  count: number;
  totalLb: number;
  totalValue: number;
}

interface Statistics {
  totalCaught: number;
  totalSold: number;
  totalUnsold: number;
  totalValue: number;
  fishByType: Record<string, FishTypeStats>;
}

export function FishingAFKLogs({ user, onBack }: FishingAFKLogsProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<FishLog[]>([]);
  const [baitBalance, setBaitBalance] = useState<number>(0);
  const [statistics, setStatistics] = useState<Statistics>({
    totalCaught: 0,
    totalSold: 0,
    totalUnsold: 0,
    totalValue: 0,
    fishByType: {}
  });

  useEffect(() => {
    loadFishingLogs();
  }, []);

  const loadFishingLogs = async () => {
    try {
      const response = await API.getFishingLogs();
      console.log('[FISHING LOGS] Response:', response);
      console.log('[FISHING LOGS] First log:', response.logs?.[0]);
      setLogs(response.logs || []);
      setStatistics(response.statistics || {
        totalCaught: 0,
        totalSold: 0,
        totalUnsold: 0,
        totalValue: 0,
        fishByType: {}
      });

      // Load bait balance
      try {
        const inventoryResponse = await API.getFishingInventory();
        setBaitBalance(inventoryResponse.inventory?.bait_balance || 0);
      } catch (error) {
        console.error('Error loading bait balance:', error);
        setBaitBalance(0);
      }
    } catch (error) {
      console.error('Error loading fishing logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Memuat log fishing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <h1 className="text-3xl font-bold text-white mb-2"> Log Fishing AFK</h1>
        <p className="text-slate-400">Riwayat ikan yang didapat dan telah dijual ke World Lock</p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Fish className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Total Ikan</p>
                <p className="text-2xl font-bold text-white">{statistics.totalCaught}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-xs text-slate-400">Terjual</p>
                <p className="text-2xl font-bold text-white">{statistics.totalSold}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-xs text-slate-400">Belum Terjual</p>
                <p className="text-2xl font-bold text-white">{statistics.totalUnsold}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              <div>
                <p className="text-xs text-slate-400">Total Value (WL)</p>
                <p className="text-2xl font-bold text-white">{statistics.totalValue}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <Worm className="w-8 h-8 text-purple-400" />
              <div>
                <p className="text-xs text-purple-300">Bait Tersedia</p>
                <p className="text-2xl font-bold text-white">{baitBalance}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fish by Type */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">📊 Statistik per Jenis Ikan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(statistics.fishByType).map(([fishName, stats]) => (
              <div key={fishName} className="bg-slate-700/30 rounded-lg p-4 border border-white/5">
                <h3 className="font-bold text-white mb-2">{fishName}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah:</span>
                    <span className="text-white font-bold">{(stats as FishTypeStats).count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total LB:</span>
                    <span className="text-blue-400 font-bold">{(stats as FishTypeStats).totalLb}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Value:</span>
                    <span className="text-green-400 font-bold">{(stats as FishTypeStats).totalValue} WL</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-bold text-white mb-4">Riwayat Ikan Terbaru</h2>
          
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <Fish className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Belum ada riwayat fishing</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.is_sold
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🐟</span>
                      <div>
                        <p className="font-bold text-white">{log.fish_name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-blue-400 font-bold">
                            {/* Display LB with proper fallback */}
                            {(log.lb || log.base_lb || 0)} LB
                          </span>
                          {/* Show bonus breakdown if available and different from base */}
                          {log.lb && log.base_lb && log.lb !== log.base_lb && (
                            <span className="text-slate-500 text-xs">
                              (Base: {log.base_lb} LB, Bonus: +{log.lb - log.base_lb} LB)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${log.is_sold ? 'text-green-400' : 'text-yellow-400'}`}>
                        {log.is_sold ? `+${log.sell_price} WL` : 'Belum Terjual'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(log.caught_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
