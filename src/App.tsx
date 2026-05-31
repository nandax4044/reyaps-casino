import React, { useState, useEffect } from 'react';
import CrashGame from './components/CrashGame';
import CaseOpeningGame from './components/CaseOpeningGame';
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
  
  if (hasError) {
    return <span className="inline-block font-sans">{alt}</span>;
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${className} align-middle inline-block`}
      onError={() => setHasError(true)} 
    />
  );
};

export default function App() {
  // --- 1. User Account authentication state management ---
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Fetch the logged-in user profile from Supabase
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
    } catch (e) {
      console.warn('Session expired or parsing issues. Clearing token.', e);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Logout action handler
  const handleLogout = () => {
    if (window.confirm('Keluar dari akun Anda?')) {
      API.logout();
      setUser(null);
      setActiveGame('lobby');
    }
  };

  // --- Dynamic Tab Selector ---
  const [activeGame, setActiveGame] = useState<'lobby' | 'crash' | 'cases' | 'profile' | 'admin'>('lobby');
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'players' | 'chat'>('players');

  // --- Games Published Status ---
  const [casesPublished, setCasesPublished] = useState<boolean>(true);
  const [crashPublished, setCrashPublished] = useState<boolean>(true);

  const loadGamesPublishedStatus = async () => {
    try {
      // Load cases published status
      const casesData = await API.getGameConfig('cases');
      if (casesData.published !== undefined) {
        setCasesPublished(casesData.published);
      }

      // Load crash published status
      const crashData = await API.getGameConfig('crash');
      if (crashData.published !== undefined) {
        setCrashPublished(crashData.published);
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
        className="min-h-screen text-slate-100 flex flex-col items-center justify-center font-sans p-6 select-none relative overflow-hidden" 
        style={{
          background: "linear-gradient(rgba(10, 10, 18, 0.45), rgba(10, 10, 18, 0.85)), url('/background.png') center / cover no-repeat fixed"
        }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-500/5 blur-[90px] pointer-events-none" />
        <div className="flex flex-col items-center gap-6 animate-pulse z-10">
          <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain filter drop-shadow-[0_12px_24px_rgba(30,144,255,0.45)]" />
          <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 tracking-[0.2em] font-mono">LOADING APPLICATION...</h2>
        </div>
      </div>
    );
  }

  // --- Render Authentication if not logged in ---
  if (!user) {
    return <AuthScreen onAuthSuccess={fetchUserProfile} />;
  }

  return (
    <div
      id="outer-shell"
      style={{ 
        fontFamily: "Inter, sans-serif",
        background: "linear-gradient(rgba(10, 15, 30, 0.55), rgba(10, 15, 30, 0.8)), url('/background.png') center / cover no-repeat fixed"
      }}
      className="min-h-screen text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col relative overflow-x-hidden blur-background-ambient"
    >
      {/* Dynamic Background visual blur orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-indigo-950/10 blur-[150px] pointer-events-none" />

      {/* TOP HEADER BRAND BAR - NEW RESPONSIVE NAVBAR */}
      <ResponsiveNavbar 
          user={user}
          activeGame={activeGame}
          onNavigate={setActiveGame}
          onLogout={handleLogout}
          gamesPublished={{
            crash: crashPublished,
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
                  crash: crashPublished,
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
        {(activeGame === 'cases' || activeGame === 'crash') && (
          <div className="w-full">
            {activeGame === 'crash' && (
              <div className="w-full animate-fade-in">
                <CrashGame user={user} refreshUser={fetchUserProfile} />
              </div>
            )}

            {activeGame === 'cases' && (
              <div className="w-full animate-fade-in">
                <CaseOpeningGame user={user} refreshUser={fetchUserProfile} />
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
                <AdminDashboard onCloseAdmin={() => setActiveGame('lobby')} />
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
    </div>
  );
}
