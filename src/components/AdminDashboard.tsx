import React, { useState, useEffect } from 'react';
import { API } from '../utils/api';
import CurrencyDisplay from './CurrencyDisplay';
import { AdminFishingManagement } from './AdminFishingManagement';
import { 
  Users, Bot, ShieldAlert, Plus, Trash2, Edit, Save, 
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
  const [activeTab, setActiveTab] = useState<'users' | 'fishing'>('users');
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

  const [feedback, setFeedback] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await API.getAdminUsers();
      setUsers(data.users || []);
    } catch (e: any) {
      if (e.message.includes('Token tidak valid') || e.message.includes('kadaluarsa')) {
        // Token expired, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return;
      }
      setErrorFeedback('Gagal memuat daftar user: ' + e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    // fishing tab handles its own data loading
  }, [activeTab]);

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
      if (e.message.includes('Token tidak valid') || e.message.includes('kadaluarsa')) {
        // Token expired, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return;
      }
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
      if (e.message.includes('Token tidak valid') || e.message.includes('kadaluarsa')) {
        // Token expired, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return;
      }
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
      if (e.message.includes('Token tidak valid') || e.message.includes('kadaluarsa')) {
        // Token expired, redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return;
      }
      setErrorFeedback('Gagal memuat inventory user: ' + e.message);
    } finally {
      setLoadingInv(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in p-2">
      {/* Brand Header */}
      <div className="glass-panel-noir rounded-2xl p-5 border border-red-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl border border-red-500/30 flex items-center justify-center">
            <Settings className="w-5 h-5 text-red-500 animate-pulse" />
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
          <span>Kembali ke Lobby</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          {feedback}
        </div>
      )}
      
      {errorFeedback && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <ShieldAlert className="w-4 h-4" />
          {errorFeedback}
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

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="glass-panel-dark rounded-2xl p-5 border border-white/5 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="font-display font-bold text-base text-white">Manajemen Pengguna</h3>
              <p className="text-xs text-slate-400">Kelola akun user, saldo, dan akses staff</p>
            </div>
            <button
              onClick={fetchUsers}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-3" />
              <p className="text-xs text-slate-500 font-mono">Memuat database user...</p>
            </div>
          ) : users.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-10 font-sans">Tidak ada user ditemukan.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-2">Username</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-2">Email</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-2">Balance</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-2">Role</th>
                    <th className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="py-3 px-2">
                        {editingUserId === user.id ? (
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white outline-none w-full"
                          />
                        ) : (
                          <span className="text-xs text-white font-semibold">{user.username}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {editingUserId === user.id ? (
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none w-full"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">{user.email}</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {editingBalanceId === user.id ? (
                          <input
                            type="number"
                            value={adjustBalanceVal}
                            onChange={(e) => setAdjustBalanceVal(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-orange-400 font-bold outline-none w-24"
                          />
                        ) : (
                          <CurrencyDisplay balance={user.balance} />
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {editingUserId === user.id ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsStaff}
                              onChange={(e) => setEditIsStaff(e.target.checked)}
                              className="w-4 h-4 rounded"
                            />
                            <span className="text-xs text-slate-300">Staff</span>
                          </label>
                        ) : (
                          <span className={`text-xs font-bold px-2 py-1 rounded ${user.is_staff ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {user.is_staff ? 'STAFF' : 'USER'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1.5">
                          {editingUserId === user.id ? (
                            <>
                              <button
                                onClick={() => handleEditUserSubmit(user.id)}
                                className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded transition cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="p-1.5 bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500 hover:text-white rounded transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingUserId(user.id);
                                  setEditUsername(user.username);
                                  setEditEmail(user.email);
                                  setEditIsStaff(user.is_staff);
                                }}
                                className="p-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white rounded transition cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBalanceId(user.id);
                                  setAdjustBalanceVal(user.balance.toString());
                                }}
                                className="p-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500 hover:text-white rounded transition cursor-pointer"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>
                              {editingBalanceId === user.id && (
                                <button
                                  onClick={() => handleAdjustBalance(user.id)}
                                  className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded transition cursor-pointer"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleAuditInventory(user)}
                                className="p-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500 hover:text-white rounded transition cursor-pointer"
                              >
                                <Package className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* User Inventory Audit Modal */}
          {auditingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-2xl p-6 max-w-4xl w-full mx-4 shadow-2xl shadow-cyan-500/20 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Inventory Audit: {auditingUser.username}</h3>
                  <button
                    onClick={() => setAuditingUser(null)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {loadingInv ? (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
                    <p className="text-xs text-slate-500 font-mono">Memuat inventory...</p>
                  </div>
                ) : userInventory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-10">Inventory kosong.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {userInventory.map((item: any) => (
                      <div key={item.id} className="bg-slate-800/50 border border-white/10 rounded-lg p-3 flex gap-3">
                        <span className="text-2xl">{item.icon || '🎁'}</span>
                        <div className="flex-1">
                          <p className="text-xs text-white font-semibold">{item.item_name}</p>
                          <p className="text-[10px] text-slate-400">{item.rarity}</p>
                          <p className="text-[10px] text-orange-400 font-bold">{item.value} WL</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FISHING MANAGEMENT */}
      {activeTab === 'fishing' && (
        <AdminFishingManagement onClose={() => setActiveTab('users')} />
      )}
    </div>
  );
}
