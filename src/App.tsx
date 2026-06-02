import React, { useState, useEffect } from 'react';
import CaseOpeningGame from './components/CaseOpeningGame';
import { FishingGameV3 } from './components/FishingGameV3';
import { AuthScreen } from './components/AuthScreen';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { API } from './utils/api';
import { OnlinePlayers } from './components/OnlinePlayers';
import { GlobalChat } from './components/GlobalChat';
import { Lobby } from './components/Lobby';
import { ResponsiveNavbar } from './components/ResponsiveNavbar';
import { Users, MessageCircle } from 'lucide-react';

export const PngEmoji = ({ src, alt, className = "w-4 h-4 inline-block object-contain" }: { src: string; alt: string; className?: string }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  if (hasError) {
    return <span className="inline-block font-sans">{alt}</span>;
  }
  
  return (
    <>
      {isLoading && (
        <span className="inline-block animate-pulse bg-slate-700/50 rounded" style={{ width: '1rem', height: '1rem' }}></span>
      )}
      <img 
        src={src} 
        alt={alt} 
        className={`${className} align-middle inline-block ${isLoading ? 'hidden' : ''}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }} 
      />
    </>
  );
};

export default function App() {
  // --- 1. User Account authentication state management ---
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Fetch the logged-in user profile from Supabase
  const [authError, setAuthError] = useState<string>('');
  
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }
    try {
      const profile = await API.getProfile();
      setUser(profile.user);
      setAuthError('');
    } catch (e: any) {
      console.warn('Session expired or parsing issues. Clearing token.', e);
      const errorMsg = e?.message || 'Sesi Anda telah berakhir. Silakan login kembali.';
      setAuthError(errorMsg);
      // Clear ALL auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    // Clear old tokens on first load to force fresh login
    const hasRefreshToken = localStorage.getItem('refresh_token');
    if (!hasRefreshToken && localStorage.getItem('auth_token')) {
      // Old token without refresh_token, clear it
      console.log('[APP] Clearing old token without refresh_token');
      localStorage.removeItem('auth_token');
    }
    fetchUserProfile();
  }, []);

  // Logout action handler with custom modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  
  const confirmLogout = () => {
    API.logout();
    setUser(null);
    setActiveGame('lobby');
    setShowLogoutModal(false);
  };

  // --- Dynamic Tab Selector ---
  const [activeGame, setActiveGame] = useState<'lobby' | 'cases' | 'fishing' | 'profile' | 'admin'>('lobby');
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'players' | 'chat'>('players');

  // --- Games Published Status ---
  const [casesPublished, setCasesPublished] = useState<boolean>(true);

  const loadGamesPublishedStatus = async () => {
    try {
      // Load cases published status
      const casesData = await API.getGameConfig('cases');
      if (casesData.published !== undefined) {
        setCasesPublished(casesData.published);
      }
    } catch (e) {
      console.warn('Failed to load games published status', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadGamesPublishedStatus();
    }
  }, [user]);

  // --- Render Splash screen loader ---
  if (loadingUser) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(rgba(10, 15, 30, 0.75), rgba(5, 8, 22, 0.85)), url('/background.png') center / cover no-repeat fixed"
        }}
      >
        {/* Ambient Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1D4ED8] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#38BDF8] rounded-full mix-blend-multiply filter blur-[128px] opacity-10 animate-pulse delay-700"></div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          {/* Logo with Glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#38BDF8] to-[#1D4ED8] rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <img src="/logo.png" alt="Logo" className="relative w-24 h-24 object-contain filter drop-shadow-2xl" />
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-3">
            <h2 className="text-sm font-bold bg-gradient-to-r from-white via-[#67E8F9] to-white bg-clip-text text-transparent tracking-[0.3em] uppercase">
              Loading Application
            </h2>
            
            {/* Loading Bar */}
            <div className="w-64 h-1 bg-white/[0.05] rounded-full overflow-hidden backdrop-blur-sm">
              <div className="h-full bg-gradient-to-r from-[#38BDF8] to-[#1D4ED8] rounded-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render Authentication if not logged in ---
  if (!user) {
    return (
      <>
        {authError && (
          <div className="fixed top-4 right-4 z-50 bg-red-500/90 text-white px-4 py-3 rounded-lg shadow-lg max-w-md">
            <p className="text-sm font-semibold">{authError}</p>
          </div>
        )}
        <AuthScreen onAuthSuccess={fetchUserProfile} />
      </>
    );
  }

  return (
    <div
      id="outer-shell"
      className="min-h-screen text-white selection:bg-[#38BDF8]/30 selection:text-white flex flex-col relative overflow-x-hidden"
      style={{
        background: "linear-gradient(rgba(10, 15, 30, 0.75), rgba(5, 8, 22, 0.85)), url('/background.png') center / cover no-repeat fixed"
      }}
    >
      {/* Ambient Background Effects - Subtle untuk tidak menutupi background.png */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1D4ED8] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#38BDF8] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 animate-pulse delay-700"></div>
      </div>

      {/* TOP HEADER BRAND BAR - NEW RESPONSIVE NAVBAR */}
      <ResponsiveNavbar 
          user={user}
          activeGame={activeGame}
          onNavigate={setActiveGame}
          onLogout={handleLogout}
          gamesPublished={{
            cases: casesPublished
          }}
        />

      {/* MAIN LAYOUT BODY */}
      <main className="flex-1 w-full p-3 md:p-6 lg:p-8 relative z-10 flex flex-col justify-start">
        <div className="max-w-7xl mx-auto w-full">
        {activeGame === 'lobby' && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start">
            {/* LEFT: Online Players */}
            <div className="hidden lg:block lg:col-span-3 col-span-12 w-full lg:sticky lg:top-[100px]">
              <OnlinePlayers currentUser={user} />
            </div>

            {/* CENTER: Lobby Content */}
            <div className="lg:col-span-6 col-span-12 flex flex-col gap-4 md:gap-6 w-full">
              <Lobby 
                user={user}
                onSelectGame={(game) => setActiveGame(game)}
                onOpenProfile={() => setActiveGame('profile')}
                onOpenAdmin={() => setActiveGame('admin')}
                onLogout={handleLogout}
                gamesPublished={{
                  cases: casesPublished
                }}
              />
            </div>

            {/* RIGHT: Global Chat */}
            <div className="hidden lg:block lg:col-span-3 col-span-12 w-full lg:sticky lg:top-[100px]">
              <GlobalChat currentUser={user} />
            </div>

            {/* MOBILE: Tabs for Online Players & Chat */}
            <div className="lg:hidden col-span-12 w-full mt-4">
              <div className="flex gap-2 mb-3">
                <button 
                  onClick={() => setMobileSidebarTab('players')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mobileSidebarTab === 'players'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" />
                  Pemain Online
                </button>
                <button 
                  onClick={() => setMobileSidebarTab('chat')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    mobileSidebarTab === 'chat'
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                  Global Chat
                </button>
              </div>
              {mobileSidebarTab === 'players' && <OnlinePlayers currentUser={user} />}
              {mobileSidebarTab === 'chat' && <GlobalChat currentUser={user} />}
            </div>
          </div>
        )}

        {/* ========== GAME PAGES - NO SIDEBAR ========== */}
        {(activeGame === 'cases' || activeGame === 'fishing') && (
          <div className="w-full">
            {activeGame === 'cases' && (
              <div className="w-full animate-fade-in">
                <CaseOpeningGame user={user} refreshUser={fetchUserProfile} />
              </div>
            )}

            {activeGame === 'fishing' && (
              <div className="w-full animate-fade-in">
                <FishingGameV3 user={user} onBack={() => setActiveGame('lobby')} />
              </div>
            )}
          </div>
        )}

        {/* ========== DASHBOARD PAGES - NO SIDEBAR ========== */}
        {(activeGame === 'profile' || activeGame === 'admin') && (
          <div className="w-full">
            {activeGame === 'profile' && (
              <div className="w-full animate-fade-in">
                <UserDashboard 
                  user={user} 
                  onLogout={handleLogout} 
                  onCloseDashboard={() => setActiveGame('lobby')} 
                />
              </div>
            )}

            {activeGame === 'admin' && user.is_staff && (
              <div className="w-full animate-fade-in">
                <AdminDashboard 
                  onCloseAdmin={() => setActiveGame('lobby')} 
                  onNavigateToFishing={() => setActiveGame('fishing')}
                />
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-5 text-center text-[10px] text-slate-500 font-mono mt-auto relative z-10 glass-panel-dark">
        WHEEL SPINNER CASINO &copy; 2026 &bull; Private Premium Client Build
      </footer>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-cyan-500/20">
            <h3 className="text-xl font-bold text-white mb-3">Konfirmasi Logout</h3>
            <p className="text-slate-400 mb-6">Apakah Anda yakin ingin keluar dari akun Anda?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
