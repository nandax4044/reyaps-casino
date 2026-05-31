import React, { useState } from 'react';
import { API } from '../utils/api';
import { Users } from 'lucide-react';

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
      className="min-h-screen flex items-center justify-center p-4 md:p-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(rgba(10, 15, 30, 0.75), rgba(0, 0, 0, 0.9)), url('/background.png') center / cover no-repeat fixed"
      }}
    >
      {/* Background gradient blur effects */}
      <div className="absolute top-1/4 left-1/4 w-[40%] aspect-square rounded-full bg-blue-600/20 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[40%] aspect-square rounded-full bg-cyan-500/15 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[50%] aspect-square rounded-full bg-blue-900/10 blur-[180px] pointer-events-none" />

      {/* Main Container - Split Screen with Glass Effect */}
      <div className="w-full max-w-4xl backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] relative z-10 border border-cyan-500/20"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%)"
        }}
      >
        
        {/* LEFT SIDE - Form Section with Blue Glass */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative backdrop-blur-sm"
          style={{
            background: "linear-gradient(135deg, rgba(30, 58, 138, 0.3) 0%, rgba(29, 78, 216, 0.25) 50%, rgba(37, 99, 235, 0.2) 100%)"
          }}
        >
          {/* Logo - BIGGER */}
          <div className="mb-6 flex items-center gap-3">
            
            
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              REYABET.
            </h1>
          </div>

          {/* Welcome Text */}
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 drop-shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {isLogin ? 'Hi Mayers!' : 'Join Us!'}
            </h2>
            <p className="text-xs text-cyan-200">
              {isLogin ? 'Welcome to Reyabet Gaming Dashboard' : 'Create your gaming account'}
            </p>
          </div>

          {/* Toggle Buttons - Top Right */}
          <div className="absolute top-6 right-6 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                isLogin
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-white/10 text-cyan-200 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                !isLogin
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-white/10 text-cyan-200 hover:bg-white/20 backdrop-blur-sm'
              }`}
            >
              Join us
            </button>
          </div>

          {error && (
            <div className="mb-3 py-2.5 px-3 bg-red-500/20 border border-red-400/30 text-xs text-red-200 rounded-xl backdrop-blur-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* EMAIL (Sign Up Only) */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-white/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl py-3 px-4 font-sans text-sm text-white placeholder-cyan-300/50 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            )}

            {/* USERNAME (Sign Up Only) */}
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  required
                  pattern="[a-zA-Z0-9_]{3,16}"
                  title="Username harus 3-16 karakter"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-white/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl py-3 px-4 font-sans text-sm text-white placeholder-cyan-300/50 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            )}

            {/* USERNAME / EMAIL (Login Only) */}
            {isLogin && (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  required
                  value={loginKey}
                  onChange={(e) => setLoginKey(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-white/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl py-3 px-4 font-sans text-sm text-white placeholder-cyan-300/50 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                />
              </div>
            )}

            {/* PASSWORD */}
            <div className="flex flex-col gap-1.5">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/10 backdrop-blur-sm border border-cyan-500/30 rounded-xl py-3 px-4 font-sans text-sm text-white placeholder-cyan-300/50 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Forgot Password Link (Login Only) */}
            {isLogin && (
              <div className="text-right -mt-1">
                <button type="button" className="text-xs text-cyan-300 hover:text-cyan-200 font-medium">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/30 active:scale-[0.98] transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>PROCESSING...</span>
                </div>
              ) : (
                <span>{isLogin ? 'Log in' : 'Sign up'}</span>
              )}
            </button>

            {/* Sign up link */}
            <div className="text-center mt-2">
              <span className="text-xs text-cyan-200/70">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-xs text-cyan-300 hover:text-cyan-200 font-bold"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT SIDE - Character Image Section */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-gray-900 via-blue-950 to-black items-end justify-center p-0 pb-0 relative overflow-hidden">
          {/* Gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-cyan-900/20 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-black/50 via-transparent to-blue-950/30"></div>
          
          {/* Gaming Spaces Community Badge */}
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
              <Users className="w-4 h-4 text-gray-900" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white">Gaming Spaces</div>
              <div className="text-[10px] text-gray-300">Community</div>
            </div>
          </div>

          {/* Character Image - ALIGNED TO BOTTOM */}
          <div className="relative w-full h-full flex items-end justify-center z-10">
            <img 
              src="/banner2.png" 
              alt="Gaming Character" 
              className="w-full h-full object-contain object-bottom drop-shadow-2xl"
              style={{
                maxWidth: '84%',
                marginBottom: '0'
              }}
              onError={(e) => {
                // Fallback to a placeholder if image not found
                (e.target as HTMLImageElement).src = '/';
                (e.target as HTMLImageElement).className = 'w-20 h-30 object-contain opacity-20 mb-8';
              }}
            />
          </div>

          {/* Decorative gradient at bottom - subtle */}
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
          
          {/* Subtle glow effects */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
