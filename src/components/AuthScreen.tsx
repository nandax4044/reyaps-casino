import React, { useState } from 'react';
import { API } from '../utils/api';
import { Sparkles, User, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loginKey, setLoginKey] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        if (!loginKey || !password) {
          throw new Error('Semua input wajib diisi!');
        }
        const data = await API.login({ loginKey, password });
        onAuthSuccess(data.user);
      } else {
        if (!email || !username || !password) {
          throw new Error('Semua input wajib diisi!');
        }
        const data = await API.register({ email, username, password });
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen text-slate-100 flex flex-col items-center justify-center font-sans p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(rgba(10, 15, 30, 0.6), rgba(6, 10, 20, 0.85)), url('/background.png') center / cover no-repeat fixed"
      }}
    >
      {/* Background neon blur effects */}
      <div className="absolute top-1/4 left-1/4 w-[35%] aspect-square rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[35%] aspect-square rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Auth Card Container */}
      <div className="w-full max-w-md z-10 animate-fade-in">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl border border-cyan-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.35)] mb-3 group transition-transform hover:scale-105 duration-300">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }} />
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 tracking-tight">
            Reya Bet
          </h1>
          <p className="text-xs text-slate-400 font-mono tracking-widest mt-1 uppercase">
           
          </p>
        </div>

        {/* Form panel utilizing glass config */}
        <div className="glass-panel-dark rounded-2xl p-6 md:p-8 border border-cyan-500/20 shadow-[0_0_50px_rgba(3,105,161,0.25)] relative overflow-hidden">
          {/* Top subtle visual strip */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600" />

          {/* Toggle buttons */}
          <div className="flex bg-slate-950/65 p-1 border border-white/5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isLogin
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>MASUK AKUN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isLogin
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>DAFTAR BARU</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 py-2.5 px-3.5 bg-red-950/40 border border-red-500/30 text-xs text-red-300 rounded-xl font-medium animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* EMAIL (Sign Up Only) */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-[#0b0f19]/80 border border-white/10 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 font-sans text-sm text-white placeholder-slate-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                  />
                </div>
              </div>
            )}

            {/* USERNAME (Sign Up Only) */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    pattern="[a-zA-Z0-9_]{3,16}"
                    title="Username harus 3-16 karakter, hanya huruf, angka, dan undescored (_)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user_gacor"
                    className="w-full bg-[#0b0f19]/80 border border-white/10 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 font-sans text-sm text-white placeholder-slate-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                  />
                </div>
              </div>
            )}

            {/* USERNAME / EMAIL (Login Only) */}
            {isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Username / Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={loginKey}
                    onChange={(e) => setLoginKey(e.target.value)}
                    placeholder="Email atau Username Anda"
                    className="w-full bg-[#0b0f19]/80 border border-white/10 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 font-sans text-sm text-white placeholder-slate-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                  />
                </div>
              </div>
            )}

            {/* PASSWORD */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0b0f19]/80 border border-white/10 focus:border-cyan-500/50 rounded-xl py-2.5 pl-10 pr-4 font-sans text-sm text-white placeholder-slate-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:via-blue-400 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-900 disabled:text-slate-500 text-white rounded-xl font-sans font-bold text-sm tracking-wider shadow-[0_4px_25px_rgba(3,105,161,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
            >
              {loading ? (
                <>
                  <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>MEMPROSES...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'MASUK KE GATES' : 'DAFTAR SEKARANG'}</span>
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Subtle footer */}
        <p className="text-center text-[10px] text-slate-500 font-mono mt-6">
          Reyabet SYSTEM CORE v2.8 &bull; PRIVATE CLIENT
        </p>
      </div>
    </div>
  );
}
