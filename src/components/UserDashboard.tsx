import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import CurrencyDisplay from './CurrencyDisplay';
import { 
  FolderLock, Coins, CircleArrowUp, ExternalLink, RefreshCw, 
  Clock, Package, Check, ShieldAlert, Sparkles, LogOut, ArrowLeftRight 
} from 'lucide-react';

interface InventoryItem {
  id: string;
  item_name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  value: number;
  icon?: string;
  image?: string;
  obtained_at: string;
  status: 'available' | 'requested_withdraw' | 'withdrawn';
}

interface UserDashboardProps {
  user: any;
  onLogout: () => void;
  onCloseDashboard: () => void;
}

const RARITY_BADGE = {
  Common: "bg-slate-500/10 border-slate-500/30 text-slate-400",
  Rare: "bg-sky-500/10 border-sky-500/30 text-sky-400",
  Epic: "bg-purple-500/10 border-purple-500/30 text-purple-400",
  Legendary: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
  Mythic: "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
};

export function UserDashboard({ user, onLogout, onCloseDashboard }: UserDashboardProps) {
  const [profile, setProfile] = useState<any>(user);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [discordInviteLink, setDiscordInviteLink] = useState('https://discord.gg/ZHF2N94p5'); // Editable/Customisable JSON target or custom string value

  const fetchUserData = async () => {
    try {
      setLoadingInv(true);
      const profData = await API.getProfile();
      setProfile(profData.user);
      
      const invData = await API.getInventory();
      setInventory(invData.inventory || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInv(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleWithdrawItem = async (item: InventoryItem) => {
    if (item.status !== 'available') return;
    
    setErrorFeedback('');
    setFeedback('');
    setWithdrawingId(item.id);

    try {
      await API.requestWithdraw(item.id);
      
      // Instantly open staff Discord link in new tab to make withdrawal quick!
      window.open(discordInviteLink, '_blank');
      
      setFeedback(`Sukses mengajukan WD untuk ${item.item_name}! Silakan hubungi staff di Discord untuk mempercepat verifikasi.`);
      
      // Refresh list
      fetchUserData();
    } catch (err: any) {
      setErrorFeedback(err.message || 'Gagal melakukan Withdraw');
    } finally {
      setWithdrawingId(null);
    }
  };

  const [errorFeedback, setErrorFeedback] = useState('');

  const formatBalance = (bal: any) => {
    const val = parseFloat(bal);
    return isNaN(val) ? '0' : val.toLocaleString('id-ID');
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in p-2">
      {/* LEFT COLUMN: USER PANEL CARDS */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* User Card */}
        <div className="glass-panel-dark rounded-2xl p-6 border border-cyan-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-900/30">
              {profile?.username?.substring(0, 2).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white">{profile?.username}</h3>
                {profile?.is_staff && (
                  <span className="px-2 py-0.5 rounded text-[8px] font-mono tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    STAFF
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans">{profile?.email}</p>
            </div>
          </div>

          {/* Current Saldo / Balance Box */}
          <div className="bg-[#0b0f19] border border-white/5 rounded-xl p-4 mb-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-semibold flex items-center gap-1">
              <Coins className="w-3 text-cyan-400" /> SALDO BERMAIN
            </span>
            <div className="flex items-center mt-2.5">
              <CurrencyDisplay balance={profile?.balance} size="md" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchUserData}
              className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>REFRESH</span>
            </button>
            <button
              onClick={onLogout}
              className="py-2 px-3 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl active:scale-95 transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Deposit Info Alert Card */}
        <div className="glass-panel-light rounded-2xl p-5 border border-cyan-400/30 shadow-lg relative overflow-hidden flex flex-col gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 text-cyan-400">
            <CircleArrowUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-display font-bold text-sm text-cyan-200 uppercase tracking-wide">PENGISIAN SALDO (DEPOSIT)</h4>
            <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
              klik BUTTON HUBUNGI STAF lalu anda akan ke discord dan hubungi admin untuk mengisi, lalu anda akan diberikan name world untuk deposit, silakan deposit dengan lock, lalu ss dan berikan bukti ke admin.
            </p>
          </div>
          
          <a
            href={discordInviteLink}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-extrabold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(56,189,248,0.3)] cursor-pointer"
          >
            <span>HUBUNGI STAFF DEPOSIT</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* RIGHT COLUMN: INVENTORY MANAGEMENT */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Inventory Container Banner */}
        <div className="glass-panel-dark rounded-2xl p-6 border border-white/5 shadow-2xl flex-1 flex flex-col gap-5 min-h-[400px]">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-cyan-400" />
                DASHBOARD INVENTORY
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">buka discord dan ss inventory kamu dan berikan ke staff lalu staff aku memberikan item ke dalam game.</p>
            </div>
            
            <button
              onClick={onCloseDashboard}
              className="py-1.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl active:scale-95 border border-cyan-400/20 transition-all cursor-pointer shadow-md"
            >
              MASUK KE GAMEPLAY 🎮
            </button>
          </div>

          {feedback && (
            <div className="py-2.5 px-4 bg-emerald-950/40 border border-emerald-500/20 text-xs text-emerald-400 rounded-xl font-medium animate-fade-in flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          )}

          {errorFeedback && (
            <div className="py-2.5 px-4 bg-red-950/40 border border-red-500/20 text-xs text-red-400 rounded-xl font-medium animate-shake flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorFeedback}</span>
            </div>
          )}

          {loadingInv ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-mono">Memuat database inventory...</p>
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
              <Package className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <h4 className="font-display font-bold text-sm text-slate-300">Inventory Kosong</h4>
              <p className="text-xs text-slate-500 font-sans mt-1 leading-relaxed">
                Anda belum memenangkan item apapun. Silakan mainkan Game Roda, Bukakan Case, atau main Crash Game untuk memenangkan item!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
              {(() => {
                // Group items by name
                const groupedItems = inventory.reduce((acc: any[], item) => {
                  const existing = acc.find(i => i.item_name === item.item_name && i.status === item.status);
                  if (existing) {
                    existing.count = (existing.count || 1) + 1;
                    existing.ids = [...(existing.ids || [existing.id]), item.id];
                    existing.totalValue = (existing.totalValue || existing.value) + item.value;
                  } else {
                    acc.push({ 
                      ...item, 
                      count: 1, 
                      ids: [item.id],
                      totalValue: item.value
                    });
                  }
                  return acc;
                }, []);

                return groupedItems.map((item) => (
                  <div 
                    key={item.ids[0]}
                    className="bg-[#0b0f19]/60 border border-white/5 rounded-xl p-2.5 flex flex-col justify-between transition-all duration-200 hover:border-cyan-500/20 hover:shadow-[0_4px_20px_rgba(3,105,161,0.15)] group relative"
                  >
                    {/* Count Badge */}
                    {item.count > 1 && (
                      <div className="absolute top-1.5 right-1.5 bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-lg">
                        {item.count}x
                      </div>
                    )}

                    <div>
                      {/* Item Image Banner - Smaller Size */}
                      <div className="w-full aspect-square bg-[#030712] rounded-lg p-1 mb-1.5 border border-white/5 flex items-center justify-center overflow-hidden relative shadow-inner">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.item_name} 
                            className="object-contain w-full h-full transform group-hover:scale-110 transition duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-2xl select-none filter drop-shadow-md">🎁</div>
                        )}
                      </div>

                      {/* Rarity */}
                      <span className={`inline-block text-[7px] font-mono tracking-widest font-extrabold uppercase py-0.5 px-1.5 rounded-full border mb-1 ${RARITY_BADGE[item.rarity] || RARITY_BADGE.Common}`}>
                        {item.rarity}
                      </span>

                      {/* Name */}
                      <h4 className="font-sans font-bold text-[11px] text-slate-200 leading-tight line-clamp-2 mb-1">
                        {item.item_name}
                      </h4>

                      {/* Value */}
                      <p className="text-[9px] text-cyan-400/80 font-mono font-semibold">
                        {item.count > 1 ? `${item.totalValue} CC (${item.count}x)` : `${item.value} CC`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="mt-2">
                      {item.status === 'requested_withdraw' ? (
                        <div className="w-full py-1 px-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center flex items-center justify-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-yellow-400 animate-spin" />
                          <span className="text-[8px] font-mono font-bold text-yellow-400">PENDING</span>
                        </div>
                      ) : item.status === 'withdrawn' ? (
                        <div className="w-full py-1 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center flex items-center justify-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span className="text-[8px] font-mono font-bold text-emerald-400">TERKIRIM</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleWithdrawItem(item)}
                          disabled={withdrawingId !== null}
                          className="w-full py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-sans font-extrabold text-[8px] rounded-lg tracking-wider active:scale-95 uppercase transition-all flex items-center justify-center gap-1 cursor-pointer border border-[#c084fc]/10 shadow-md shadow-indigo-950/50"
                        >
                          {withdrawingId === item.id ? (
                            <span>PROSES...</span>
                          ) : (
                            <span>WITHDRAW</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
