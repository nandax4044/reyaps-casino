import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import CurrencyDisplay from './CurrencyDisplay';
import { AdminFishingManagement } from './AdminFishingManagement';
import { 
  Users, Bot, Sliders, ShieldAlert, Plus, Trash2, Edit, Save, 
  Coins, Package, ArrowLeft, RefreshCw, Layers, Check, Info, Settings, RotateCcw, Fish
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  username: string;
  balance: number;
  is_staff: boolean;
  created_at: string;
}

interface AdminDashboardProps {
  onCloseAdmin: () => void;
  onNavigateToFishing?: () => void;
}

export function AdminDashboard({ onCloseAdmin, onNavigateToFishing }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'fishing'>('users');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // User Actions Editing States
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIsStaff, setEditIsStaff] = useState(false);
  const [editingBalanceId, setEditingBalanceId] = useState<string | null>(null);
  const [adjustBalanceVal, setAdjustBalanceVal] = useState('500');
  const [auditingUser, setAuditingUser] = useState<UserItem | null>(null);
  const [userInventory, setUserInventory] = useState<any[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);

  // Game Settings Editing States
  const [activeGameType, setActiveGameType] = useState<'cases' | 'wheel' | 'crash'>('cases');
  const [gameConfig, setGameConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await API.getAdminUsers();
      setUsers(data.users || []);
    } catch (e: any) {
      setErrorFeedback('Gagal memuat daftar user: ' + e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchGameConfig = async () => {
    try {
      setLoadingConfig(true);
      const config = await API.getGameConfig(activeGameType);
      setGameConfig(config);
    } catch (e: any) {
      setErrorFeedback('Gagal memuat konfigurasi game: ' + e.message);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'games') {
      fetchGameConfig();
    }
    // fishing tab handles its own data loading
  }, [activeTab, activeGameType]);

  // Handle Edit User Form Submit
  const handleEditUserSubmit = async (userId: string) => {
    setErrorFeedback('');
    setFeedback('');
    try {
      const resp = await API.updateUserProfile(userId, {
        username: editUsername,
        email: editEmail,
        is_staff: editIsStaff
      });
      setFeedback(`Berhasil memperbarui profile user ${resp.user?.username}!`);
      setEditingUserId(null);
      fetchUsers();
    } catch (e: any) {
      setErrorFeedback('Gagal mengupdate profile: ' + e.message);
    }
  };

  // Handle Balance Adjust
  const handleAdjustBalance = async (userId: string) => {
    setErrorFeedback('');
    setFeedback('');
    try {
      const amt = parseFloat(adjustBalanceVal);
      if (isNaN(amt)) throw new Error('Harap input jumlah saldo angka valid!');
      const resp = await API.updateUserBalance(userId, amt);
      setFeedback(`Sukses menyetel saldo ${resp.user?.username} menjadi ${amt.toLocaleString()} WL!`);
      setEditingBalanceId(null);
      fetchUsers();
    } catch (e: any) {
      setErrorFeedback('Gagal menyetujui saldo: ' + e.message);
    }
  };

  // Audit Inventory of Specific User
  const handleAuditInventory = async (user: UserItem) => {
    setErrorFeedback('');
    setFeedback('');
    setAuditingUser(user);
    setLoadingInv(true);
    setUserInventory([]);
    try {
      const resp = await API.getUserInventory(user.id);
      setUserInventory(resp.inventory || []);
    } catch (e: any) {
      setErrorFeedback('Gagal memuat inventory user: ' + e.message);
    } finally {
      setLoadingInv(false);
    }
  };

  // --- Game Config Sub-Form Operations ---
  const handleSaveGameConfig = async () => {
    setErrorFeedback('');
    setFeedback('');
    try {
      await API.updateGameConfig(activeGameType, gameConfig);
      setFeedback(`Sukses memperbarui konfigurasi permainan ${activeGameType} di Database Supabase!`);
    } catch (e: any) {
      setErrorFeedback('Gagal menyimpan konfigurasi: ' + e.message);
    }
  };

  // CASES chest item edit helpers
  const handleAddChestItem = (chestIndex: number) => {
    const defaultItem = {
      name: "Item Baru Gacor",
      rarity: "Common",
      chance: 10,
      value: 100,
      icon: "🎁",
      image: "https://picsum.photos/seed/placeholder/150/150",
      color: "#a1a1aa"
    };
    
    const updated = { ...gameConfig };
    const chestsArray = updated.cases || updated.chests || updated;
    const chest = Array.isArray(chestsArray) ? chestsArray[chestIndex] : null;
    if (chest && chest.items) {
      chest.items.push(defaultItem);
      // Redrive chances sum
      setGameConfig(updated);
    }
  };

  const handleDeleteChestItem = (chestIndex: number, itemIndex: number) => {
    const updated = { ...gameConfig };
    const chestsArray = updated.cases || updated.chests || updated;
    const chest = Array.isArray(chestsArray) ? chestsArray[chestIndex] : null;
    if (chest && chest.items) {
      chest.items.splice(itemIndex, 1);
      setGameConfig(updated);
    }
  };

  const handleUpdateChestValue = (field: string, value: any, chestIndex: number) => {
    const updated = { ...gameConfig };
    const chestsArray = updated.cases || updated.chests || updated;
    const chest = Array.isArray(chestsArray) ? chestsArray[chestIndex] : null;
    if (chest) {
      chest[field] = value;
      setGameConfig(updated);
    }
  };

  const handleUpdateChestItemValue = (field: string, value: any, chestIndex: number, itemIndex: number) => {
    const updated = { ...gameConfig };
    const chestsArray = updated.cases || updated.chests || updated;
    const chest = Array.isArray(chestsArray) ? chestsArray[chestIndex] : null;
    if (chest && chest.items && chest.items[itemIndex]) {
      chest.items[itemIndex][field] = value;
      setGameConfig(updated);
    }
  };

  // WHEEL prize edit helpers
  const handleAddWheelPrize = () => {
    const defaults = {
      id: crypto.randomUUID(),
      name: "Grand Prize 🎁",
      image: "https://picsum.photos/seed/prizew/150/150",
      color: "#38bdf8",
      chance: 10
    };
    const updated = { ...gameConfig };
    if (updated.prizes) {
      updated.prizes.push(defaults);
      setGameConfig(updated);
    }
  };

  const handleDeleteWheelPrize = (idx: number) => {
    const updated = { ...gameConfig };
    if (updated.prizes) {
      updated.prizes.splice(idx, 1);
      setGameConfig(updated);
    }
  };

  const handleUpdateWheelPrizeValue = (field: string, value: any, idx: number) => {
    const updated = { ...gameConfig };
    if (updated.prizes && updated.prizes[idx]) {
      updated.prizes[idx][field] = value;
      setGameConfig(updated);
    }
  };

  // CRASH config edits
  const handleAddCrashPrize = () => {
    const defaults = {
      id: crypto.randomUUID(),
      name: "Space Bounty Item 🌌",
      rarity: "Epic",
      value: 300,
      icon: "🌌",
      image: "https://picsum.photos/seed/crashpri/150/150"
    };
    const updated = { ...gameConfig };
    if (updated.prizes) {
      updated.prizes.push(defaults);
      setGameConfig(updated);
    } else {
      updated.prizes = [defaults];
      setGameConfig(updated);
    }
  };

  const handleDeleteCrashPrize = (idx: number) => {
    const updated = { ...gameConfig };
    if (updated.prizes) {
      updated.prizes.splice(idx, 1);
      setGameConfig(updated);
    }
  };

  const handleUpdateCrashPrizeValue = (field: string, value: any, idx: number) => {
    const updated = { ...gameConfig };
    if (updated.prizes && updated.prizes[idx]) {
      updated.prizes[idx][field] = value;
      setGameConfig(updated);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-2">
      {/* Brand Header */}
      <div className="glass-panel-noir rounded-2xl p-5 border border-red-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="font-display font-black text-lg md:text-xl text-red-400">STAFF DASHBOARD</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Admin System Controller Mode</p>
          </div>
        </div>
        
        <button
          onClick={onCloseAdmin}
          className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>KEMBALI KE GAMEPLAY</span>
        </button>
      </div>

      {feedback && (
        <div className="py-2.5 px-4 bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-400 rounded-xl font-medium animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {errorFeedback && (
        <div className="py-2.5 px-4 bg-red-950/40 border border-red-500/30 text-xs text-red-400 rounded-xl font-medium animate-shake flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* Main Sections Navigation */}
      <div className="flex bg-slate-950/65 p-1 border border-white/5 rounded-2xl select-none max-w-2xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-md shadow-red-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>KONTROL USER</span>
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'games'
              ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-md shadow-red-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>EDIT GAME APPS</span>
        </button>
        <button
          onClick={() => setActiveTab('fishing')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'fishing'
              ? 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-md shadow-red-950/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fish className="w-3.5 h-3.5" />
          <span>FISHING ACCESS</span>
        </button>
      </div>

      {/* TAB 1: USERS CONTROL PANEL */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* User List Panel */}
          <div className="lg:col-span-8 bg-[#100E1C]/80 border border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto">
            <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
              <div>
                <h3 className="font-display font-bold text-base text-white">Akun Player Terdaftar</h3>
                <p className="text-[11px] text-slate-400">Total terdaftar di Supabase database.</p>
              </div>
              <button onClick={fetchUsers} className="p-2 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-xl transition cursor-pointer">
                <RefreshCw className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {loadingUsers ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-mono">Memuat database Supabase...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 font-semibold font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3 text-center">Privilage</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-3 font-semibold text-slate-200">{item.username}</td>
                      <td className="py-3 px-3 text-slate-400">{item.email}</td>
                      <td className="py-3 px-3 text-right">
                        <CurrencyDisplay balance={item.balance} size="xs" className="justify-end" />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`py-0.5 px-2 rounded font-mono text-[9px] font-extrabold uppercase ${item.is_staff ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}>
                          {item.is_staff ? 'STAFF' : 'USER'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingUserId(item.id);
                            setEditUsername(item.username);
                            setEditEmail(item.email);
                            setEditIsStaff(item.is_staff);
                          }}
                          className="p-1 px-2 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 rounded cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingBalanceId(item.id);
                            setAdjustBalanceVal(item.balance.toString());
                          }}
                          className="p-1 px-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/60 rounded cursor-pointer"
                          title="Beri Saldo"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAuditInventory(item)}
                          className="p-1 px-2 bg-blue-950/40 border border-blue-500/20 text-blue-400 hover:bg-blue-950/60 rounded cursor-pointer"
                          title="Audit Inventory"
                        >
                          <Package className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveTab('fishing')}
                          className="p-1 px-2 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-950/60 rounded cursor-pointer"
                          title="Kelola Fishing Access"
                        >
                          <Fish className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Action Drawer */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Editing Account Form */}
            {editingUserId && (
              <div className="glass-panel-dark rounded-2xl p-5 border border-cyan-500/20 shadow-xl animate-fade-in">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                  <h4 className="font-display font-bold text-sm text-cyan-400 flex items-center gap-1.5">
                    <Edit className="w-4 h-4" /> Edit Profile Akun
                  </h4>
                  <button onClick={() => setEditingUserId(null)} className="text-slate-500 hover:text-slate-300 text-xs font-bold sm:text-right font-mono">X</button>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Username</label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between p-2 bg-black/30 rounded-lg border border-white/5 mt-1">
                    <span className="text-xs text-slate-300">Staff Privilage Level</span>
                    <input
                      type="checkbox"
                      checked={editIsStaff}
                      onChange={(e) => setEditIsStaff(e.target.checked)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => handleEditUserSubmit(editingUserId)}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl mt-2 transition duration-150 cursor-pointer"
                  >
                    SIMPAN PERBAIKAN AKUN
                  </button>
                </div>
              </div>
            )}

            {/* Adjust Balance Terminal */}
            {editingBalanceId && (
              <div className="glass-panel-dark rounded-2xl p-5 border border-emerald-500/20 shadow-xl animate-fade-in">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                  <h4 className="font-display font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4" /> Beri/Deduct Saldo User
                  </h4>
                  <button onClick={() => setEditingBalanceId(null)} className="text-slate-500 hover:text-slate-300 text-xs font-bold sm:text-right font-mono">X</button>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] text-slate-400 leading-relaxed">Setel total angka dompet saldo untuk player bersangkutan.</p>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Saldo Baru (Rupiah)</label>
                    <input
                      type="number"
                      value={adjustBalanceVal}
                      onChange={(e) => setAdjustBalanceVal(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-lg py-2.5 px-3.5 text-sm text-emerald-400 font-mono font-bold outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleAdjustBalance(editingBalanceId)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl mt-2 transition duration-150 cursor-pointer"
                  >
                    UPDATE SALDO PLAYER
                  </button>
                </div>
              </div>
            )}

            {/* Player Audited Inventory Audit List */}
            {auditingUser && (
              <div className="glass-panel-dark rounded-2xl p-5 border border-blue-500/20 shadow-xl animate-fade-in">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                  <h4 className="font-display font-bold text-sm text-blue-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4" /> Auditing: {auditingUser.username}
                  </h4>
                  <div className="flex items-center gap-2">
                    {userInventory.length > 0 && (
                      <button 
                        onClick={async () => {
                          if (!confirm(`Hapus semua ${userInventory.length} item dari inventory ${auditingUser.username}?`)) return;
                          try {
                            await API.clearUserInventory(auditingUser.id);
                            alert('Inventory berhasil dikosongkan!');
                            setUserInventory([]);
                          } catch (e: any) {
                            alert('Error: ' + e.message);
                          }
                        }}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded text-[10px] font-bold transition"
                      >
                        Clear All
                      </button>
                    )}
                    <button onClick={() => setAuditingUser(null)} className="text-slate-500 hover:text-slate-300 text-xs font-mono">X</button>
                  </div>
                </div>
                {loadingInv ? (
                  <div className="py-8 flex flex-col items-center justify-center">
                    <div className="w-5 h-5 border border-t-blue-400 rounded-full animate-spin mb-2" />
                    <span className="text-[10px] text-slate-500 font-mono">Scanning inventory...</span>
                  </div>
                ) : userInventory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6 font-sans">User ini tidak memiliki item di inventory-nya.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                    {userInventory.map((item: any) => (
                      <div key={item.id} className="bg-slate-950/50 border border-white/5 p-2 rounded-lg text-xs flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-200">{item.item_name}</p>
                          <div className="flex gap-1.5 items-center mt-0.5">
                            <span className="text-[8px] font-bold text-cyan-400/80 font-mono">{item.rarity}</span>
                            <span className="text-[8px] text-slate-500 font-mono">&bull; Value: {item.value}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] py-0.5 px-1.5 rounded font-mono font-bold ${
                            item.status === 'requested_withdraw' ? 'bg-yellow-500/10 text-yellow-400' :
                            item.status === 'withdrawn' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {item.status === 'requested_withdraw' ? 'WAIT WD' :
                             item.status === 'withdrawn' ? 'SENT' : 'AVAILABLE'}
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm(`Hapus item "${item.item_name}"?`)) return;
                              try {
                                await API.deleteInventoryItem(item.id);
                                setUserInventory(prev => prev.filter(i => i.id !== item.id));
                              } catch (e: any) {
                                alert('Error: ' + e.message);
                              }
                            }}
                            className="p-1 bg-red-950/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition text-[10px]"
                            title="Hapus item"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quick Helper Panel */}
            <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2 text-xs text-slate-400 font-sans">
              <div className="flex gap-1.5 items-center text-slate-200 font-bold">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Navigasi Admin Utama</span>
              </div>
              <p className="leading-relaxed text-[11px]">Semua data tersimpan aman secara real-time di database Supabase yang Anda hubungkan. Gunakan menu di kiri untuk mengatur saldo, mengaudit atau mengedit info user.</p>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: GAMES CONFIGURATION AND PRIZES EDITOR */}
      {activeTab === 'games' && (
        <div className="glass-panel-dark rounded-2xl p-5 border border-white/5 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Modifikasi Item Roda, Chest & Crash</h3>
              <p className="text-xs text-slate-400">Pilih game di bawah, tambahkan prize item, klik Simpan ke DB untuk render langsung!</p>
            </div>
            
            {/* Inline Subtabs Selector */}
            <div className="flex bg-[#0b0c15] p-1 border border-white/10 rounded-xl shrink-0 select-none">
              {(['cases', 'wheel', 'crash'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGameType(g)}
                  className={`py-1.5 px-3.5 rounded-lg text-xs font-bold leading-none transition-all cursor-pointer ${
                    activeGameType === g
                      ? 'bg-red-600 text-white shadow shadow-red-900/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {g === 'cases' ? 'Case Opening' : g === 'wheel' ? 'Prize Wheel' : 'Crash Game'}
                </button>
              ))}
            </div>
          </div>

          {loadingConfig ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-mono">Memuat database konfigurasi {activeGameType}...</p>
            </div>
          ) : !gameConfig ? (
            <p className="text-xs text-slate-500 italic text-center py-10 font-sans">Konfigurasi tidak dapat di-load.</p>
          ) : (
            <div className="flex flex-col gap-5">
              
              {/* --- CASES CONFIGURATION FORM --- */}
              {activeGameType === 'cases' && (
                <div className="flex flex-col gap-6 max-h-[500px] overflow-y-auto pr-2">
                  {((gameConfig.cases || gameConfig.chests || gameConfig) as any[]).map((chest: any, chestIdx: number) => (
                    <div key={chest.id || chestIdx} className="bg-slate-950/50 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                      
                      {/* Chest header fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-black/40 p-3 rounded-lg border border-white/5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Nama Chest</label>
                          <input
                            type="text"
                            value={chest.name}
                            onChange={(e) => handleUpdateChestValue('name', e.target.value, chestIdx)}
                            className="bg-[#121121] border border-white/10 rounded py-1 px-2 text-xs text-white outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Harga Spin (CC)</label>
                          <input
                            type="number"
                            value={chest.price}
                            onChange={(e) => handleUpdateChestValue('price', parseInt(e.target.value) || 0, chestIdx)}
                            className="bg-[#121121] border border-white/10 rounded py-1 px-2 text-xs text-orange-400 font-bold outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold">Gambar Asset URI</label>
                          <input
                            type="text"
                            value={chest.image}
                            onChange={(e) => handleUpdateChestValue('image', e.target.value, chestIdx)}
                            className="bg-[#121121] border border-white/10 rounded py-1 px-2 text-xs text-slate-300 outline-none"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => handleAddChestItem(chestIdx)}
                            className="py-1.5 px-3 bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Item Baru
                          </button>
                        </div>
                      </div>

                      {/* Items table list inside current chest */}
                      <div className="flex flex-col gap-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Item Drop Lists ({chest.items?.length || 0})</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {chest.items?.map((item: any, itemIdx: number) => (
                            <div key={itemIdx} className="bg-[#141224] border border-white/5 rounded-lg p-3 flex gap-2.5 items-start justify-between group">
                              <div className="flex gap-2 items-start overflow-hidden">
                                <span className="text-xl shrink-0 p-1 bg-black/40 border border-white/5 rounded mt-1">{item.icon || '🎁'}</span>
                                <div className="flex flex-col gap-2 font-sans w-full">
                                  <input
                                    type="text"
                                    value={item.name}
                                    placeholder="Nama Item"
                                    onChange={(e) => handleUpdateChestItemValue('name', e.target.value, chestIdx, itemIdx)}
                                    className="bg-black/30 border border-white/5 rounded px-2 py-0.5 text-xs text-slate-200 font-bold outline-none"
                                  />
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[9px] text-slate-500 font-mono uppercase">Rarity</span>
                                      <select
                                        value={item.rarity}
                                        onChange={(e) => handleUpdateChestItemValue('rarity', e.target.value, chestIdx, itemIdx)}
                                        className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-cyan-400 outline-none"
                                      >
                                        <option value="Common">Common</option>
                                        <option value="Rare">Rare</option>
                                        <option value="Epic">Epic</option>
                                        <option value="Legendary">Legendary</option>
                                        <option value="Mythic">Mythic</option>
                                      </select>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[9px] text-slate-500 font-mono uppercase">Rate (%)</span>
                                      <input
                                        type="number"
                                        value={item.chance}
                                        onChange={(e) => handleUpdateChestItemValue('chance', parseFloat(e.target.value) || 0, chestIdx, itemIdx)}
                                        className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-bold outline-none"
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-[9px] text-slate-500 font-mono uppercase">Value</span>
                                      <input
                                        type="number"
                                        value={item.value}
                                        onChange={(e) => handleUpdateChestItemValue('value', parseInt(e.target.value) || 0, chestIdx, itemIdx)}
                                        className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-orange-400 font-bold outline-none"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Item Photo URI */}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] text-slate-500 font-mono uppercase">Asset URL / Image</span>
                                    <input
                                      type="text"
                                      value={item.image}
                                      onChange={(e) => handleUpdateChestItemValue('image', e.target.value, chestIdx, itemIdx)}
                                      className="bg-black/40 border border-white/5 rounded px-2 py-0.5 text-[10px] text-slate-400 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteChestItem(chestIdx, itemIdx)}
                                className="p-1.5 bg-red-950/20 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition cursor-pointer self-start"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {/* --- WHEEL PRIZES FORM --- */}
              {activeGameType === 'wheel' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-black/25 p-3 rounded-lg border border-white/5">
                    <span className="text-xs font-semibold text-slate-300 font-sans">Semua Segmen Hadiah Roda Spinner ({gameConfig.prizes?.length || 0})</span>
                    <button
                      type="button"
                      onClick={handleAddWheelPrize}
                      className="py-1 px-3 bg-red-600 text-white rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Segmen Hadiah
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
                    {gameConfig.prizes?.map((prize: any, idx: number) => (
                      <div key={prize.id || idx} className="bg-[#141224] border border-white/10 rounded-xl p-3.5 flex gap-3 relative justify-between group">
                        <div className="flex flex-col gap-2.5 font-sans w-full">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Nama Hadiah</span>
                              <input
                                type="text"
                                value={prize.name}
                                onChange={(e) => handleUpdateWheelPrizeValue('name', e.target.value, idx)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1 text-xs text-white font-bold outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Probabilitas Rate (%)</span>
                              <input
                                type="number"
                                value={prize.chance}
                                onChange={(e) => handleUpdateWheelPrizeValue('chance', parseFloat(e.target.value) || 0, idx)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1 text-xs text-yellow-400 font-mono font-bold outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Warna Sektor (Hex)</span>
                              <div className="flex gap-1.5">
                                <input
                                  type="color"
                                  value={prize.color}
                                  onChange={(e) => handleUpdateWheelPrizeValue('color', e.target.value, idx)}
                                  className="w-8 h-6 rounded border border-white/5 cursor-pointer bg-transparent"
                                />
                                <input
                                  type="text"
                                  value={prize.color}
                                  onChange={(e) => handleUpdateWheelPrizeValue('color', e.target.value, idx)}
                                  className="bg-black/40 border border-white/5 rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none w-full"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 uppercase font-mono font-bold">Asset Link / Upload File</span>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={prize.image}
                                  onChange={(e) => handleUpdateWheelPrizeValue('image', e.target.value, idx)}
                                  placeholder="/images/wheel_item.png"
                                  className="flex-1 bg-black/40 border border-white/5 rounded px-2.5 py-1 text-xs text-slate-400 outline-none"
                                />
                                <label className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold cursor-pointer transition flex items-center gap-1">
                                  <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      
                                      // Check file size (max 2MB)
                                      if (file.size > 2 * 1024 * 1024) {
                                        alert('File terlalu besar! Maksimal 2MB');
                                        return;
                                      }
                                      
                                      // Convert to base64 or upload to server
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const base64 = event.target?.result as string;
                                        handleUpdateWheelPrizeValue('image', base64, idx);
                                      };
                                      reader.readAsDataURL(file);
                                    }}
                                    className="hidden"
                                  />
                                  📁 Upload
                                </label>
                              </div>
                              {prize.image && (
                                <div className="mt-1 p-2 bg-black/20 border border-white/5 rounded flex items-center gap-2">
                                  <img 
                                    src={prize.image} 
                                    alt="Preview" 
                                    className="w-12 h-12 object-contain bg-white/5 rounded border border-white/10"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <span className="text-[9px] text-slate-500 truncate flex-1">{prize.image.substring(0, 50)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteWheelPrize(idx)}
                          className="p-2 bg-red-950/20 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition cursor-pointer self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- CRASH PRIZES FORM --- */}
              {activeGameType === 'crash' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-black/25 p-3 rounded-lg border border-white/5">
                    <span className="text-xs font-semibold text-slate-300 font-sans">Semua Item Hadiah Crash Game ({gameConfig.prizes?.length || 0})</span>
                    <button
                      type="button"
                      onClick={handleAddCrashPrize}
                      className="py-1 px-3 bg-red-600 text-white rounded text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Item Crash
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1 animate-fade-in">
                    {gameConfig.prizes?.map((prize: any, idx: number) => (
                      <div key={prize.id || idx} className="bg-[#141224] border border-white/10 rounded-xl p-3 flex gap-2.5 items-start justify-between group">
                        <span className="text-2xl p-1 bg-black/50 border border-white/5 rounded">{prize.icon || '🌌'}</span>
                        <div className="flex flex-col gap-2 font-sans w-full">
                          <input
                            type="text"
                            value={prize.name}
                            onChange={(e) => handleUpdateCrashPrizeValue('name', e.target.value, idx)}
                            className="bg-black/30 border border-white/5 rounded px-2.5 py-0.5 text-xs text-slate-200 font-bold outline-none"
                          />
                          <div className="grid grid-cols-3 gap-1.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-500 font-mono uppercase">Rarity</span>
                              <select
                                value={prize.rarity}
                                onChange={(e) => handleUpdateCrashPrizeValue('rarity', e.target.value, idx)}
                                className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-cyan-400 outline-none font-bold"
                              >
                                <option value="Common">Common</option>
                                <option value="Rare">Rare</option>
                                <option value="Epic">Epic</option>
                                <option value="Legendary">Legendary</option>
                                <option value="Mythic">Mythic</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-500 font-mono uppercase">Value</span>
                              <input
                                type="number"
                                value={prize.value}
                                onChange={(e) => handleUpdateCrashPrizeValue('value', parseInt(e.target.value) || 0, idx)}
                                className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-orange-400 font-bold outline-none"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] text-slate-500 font-mono uppercase">Icon</span>
                              <input
                                type="text"
                                value={prize.icon}
                                onChange={(e) => handleUpdateCrashPrizeValue('icon', e.target.value, idx)}
                                className="bg-black/40 border border-white/5 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-bold outline-none"
                              />
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-slate-500 font-mono uppercase">Asset URL</span>
                            <input
                              type="text"
                              value={prize.image}
                              onChange={(e) => handleUpdateCrashPrizeValue('image', e.target.value, idx)}
                              className="bg-black/40 border border-white/5 rounded px-2.5 py-0.5 text-[10px] text-slate-400 outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCrashPrize(idx)}
                          className="p-1.5 bg-red-950/20 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded transition cursor-pointer self-start"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAVE & RESET BUTTONS FOR ACTIVE CONFIG */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveGameConfig}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-sans font-bold text-sm tracking-wider rounded-xl transition duration-150 shadow-lg shadow-red-950/45 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>SAVE {activeGameType.toUpperCase()} TO DB</span>
                </button>
                
                <button
                  onClick={async () => {
                    if (!confirm(`Reset config ${activeGameType} ke default dari file JSON?`)) return;
                    setErrorFeedback('');
                    setFeedback('');
                    try {
                      const result = await API.resetGameConfig(activeGameType);
                      setGameConfig(result.config);
                      setFeedback(`Config ${activeGameType} berhasil direset ke default (${result.config.chests?.length || result.config.prizes?.length || 0} items)!`);
                    } catch (e: any) {
                      setErrorFeedback('Error reset config: ' + e.message);
                    }
                  }}
                  className="py-3 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-sans font-bold text-sm tracking-wider rounded-xl transition duration-150 shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                  title="Reset ke default dari file JSON (15 chests untuk cases)"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET</span>
                </button>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: FISHING ACCESS MANAGEMENT */}
      {activeTab === 'fishing' && (
        <AdminFishingManagement 
          onClose={() => setActiveTab('users')} 
          onEnterFishingRoom={onNavigateToFishing ? () => {
            onCloseAdmin();
            onNavigateToFishing();
          } : undefined}
        />
      )}

    </div>
  );
}
