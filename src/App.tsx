import React, { useState, useEffect, useRef } from 'react';
import { Prize, SpinSettings, SpinHistory } from './types';
import { DEFAULT_PRIZES } from './utils/defaults';
import { PrizeWheel } from './components/PrizeWheel';
import { PrizeManager } from './components/PrizeManager';
import { Confetti } from './components/Confetti';
import { SoundEffects } from './components/SoundEffects';
import CrashGame from './components/CrashGame';
import CaseOpeningGame from './components/CaseOpeningGame';
import { AuthScreen } from './components/AuthScreen';
import { UserDashboard } from './components/UserDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { API } from './utils/api';
import CurrencyDisplay from './components/CurrencyDisplay';
import { OnlinePlayers } from './components/OnlinePlayers';
import { GlobalChat } from './components/GlobalChat';
import { Lobby } from './components/Lobby';
import { ResponsiveNavbar } from './components/ResponsiveNavbar';
import {
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Settings,
  History,
  Maximize2,
  Minimize2,
  Clock,
  Gauge,
  CheckCircle,
  HelpCircle,
  Gift,
  X,
  TrendingUp,
  User,
  ShieldCheck,
  LogOut,
  Coins,
  ShieldAlert,
  Users,
  MessageCircle
} from 'lucide-react';

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
  const [wheelError, setWheelError] = useState<string>('');

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
  const [activeGame, setActiveGame] = useState<'lobby' | 'wheel' | 'crash' | 'cases' | 'profile' | 'admin'>('lobby');
  const [mobileSidebarTab, setMobileSidebarTab] = useState<'players' | 'chat'>('players');

  // --- Wheel Game Configuration Loading ---
  const [showSettings, setShowSettings] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [wheelPublished, setWheelPublished] = useState<boolean>(true);
  const [casesPublished, setCasesPublished] = useState<boolean>(true);
  const [crashPublished, setCrashPublished] = useState<boolean>(true);

  const loadWheelConfig = async () => {
    try {
      // First set default prizes immediately so wheel always has data
      const saved = localStorage.getItem('wheel_spinner_prizes');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPrizes(parsed);
          }
        } catch (e) {}
      } else {
        setPrizes(DEFAULT_PRIZES);
      }
      // Then try API for admin-updated config
      const data = await API.getGameConfig('wheel');
      
      // Check published status
      if (data.published !== undefined) {
        setWheelPublished(data.published);
      }
      
      const apiPrizes = data.prizes || data;
      if (Array.isArray(apiPrizes) && apiPrizes.length > 0) {
        setPrizes(apiPrizes);
      }
    } catch (e) {
      console.warn('Dynamic config wheel failed, using fallback.', e);
      if (prizes.length === 0) {
        setPrizes(DEFAULT_PRIZES);
      }
    }
  };

  const loadGamesPublishedStatus = async () => {
    try {
      // Load wheel published status
      const wheelData = await API.getGameConfig('wheel');
      if (wheelData.published !== undefined) {
        setWheelPublished(wheelData.published);
      }

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
      loadWheelConfig();
      loadGamesPublishedStatus();
    }
  }, [user]);

  const [settings, setSettings] = useState<SpinSettings>(() => {
    const saved = localStorage.getItem('wheel_spinner_settings');
    if (saved) {
      try {
        return { ...JSON.parse(saved) };
      } catch (e) {}
    }
    return {
      speed: 'normal',
      duration: 6,
      autoRemove: false,
      soundEnabled: true,
    };
  });

  const [history, setHistory] = useState<SpinHistory[]>(() => {
    const saved = localStorage.getItem('wheel_spinner_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Flow control states
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut listener for toggling settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire if typing inside inputs, textareas, or design editors
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || activeEl.hasAttribute('contenteditable')) {
          return;
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setShowSettings((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync sound setting on load
  useEffect(() => {
    SoundEffects.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Persist arrays to local storage on mutation
  useEffect(() => {
    if (prizes.length > 0) {
      localStorage.setItem('wheel_spinner_prizes', JSON.stringify(prizes));
    }
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem('wheel_spinner_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wheel_spinner_history', JSON.stringify(history));
  }, [history]);

  // --- 2. Prize Wheel Action Handlers ---
  const handleAddPrize = (newPrize: Omit<Prize, 'id'>) => {
    const fresh: Prize = {
      ...newPrize,
      id: crypto.randomUUID()
    };
    const updated = [...prizes, fresh];
    setPrizes(updated);
    // sync setting to DB config for Admin to save!
    API.updateGameConfig('wheel', { prizes: updated })
      .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
  };

  const handleUpdatePrize = (id: string, updated: Partial<Prize>) => {
    const updatedPrizes = prizes.map((p) => (p.id === id ? { ...p, ...updated } : p));
    setPrizes(updatedPrizes);
    API.updateGameConfig('wheel', { prizes: updatedPrizes })
      .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
  };

  const handleDeletePrize = (id: string) => {
    const filtered = prizes.filter((p) => p.id !== id);
    setPrizes(filtered);
    API.updateGameConfig('wheel', { prizes: filtered })
      .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
  };

  const handleReorderPrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    API.updateGameConfig('wheel', { prizes: newPrizes })
      .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Muat ulang hadiah bawaan pabrik? Data hadiah Anda saat ini akan di-overwrite di database.')) {
      setPrizes(DEFAULT_PRIZES);
      API.updateGameConfig('wheel', { prizes: DEFAULT_PRIZES })
        .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua hadiah pada roda?')) {
      setPrizes([]);
      API.updateGameConfig('wheel', { prizes: [] })
        .catch((e) => console.error('Gagal simpan wheel config ke database:', e));
    }
  };

  // WHEEL SPIN COST
  const WHEEL_SPIN_COST = 2000;

  const handleSpinStart = () => {
    if (isSpinning || prizes.length < 2) return;

    if (parseFloat(user.balance) < WHEEL_SPIN_COST) {
      setWheelError(`Saldo tidak mencukupi untuk memutar roda! Biaya: ${WHEEL_SPIN_COST.toLocaleString()} WL, Saldo Anda: ${parseFloat(user.balance).toLocaleString()} WL. silakan hubungi staff untuk deposit.`);
      return;
    }
    setWheelError('');

    // Deduct coins balance from database
    API.deductBalance(WHEEL_SPIN_COST)
      .then(() => {
        fetchUserProfile(); // update header balance smoothly
        setIsSpinning(true);
        setWinner(null);
        setShowWinnerModal(false);
      })
      .catch((err) => {
        setWheelError(err.message || 'Gagal memotong saldo bermain.');
      });
  };

  const handleSpinComplete = (winningPrize: Prize) => {
    setIsSpinning(false);
    setWinner(winningPrize);
    setShowWinnerModal(true);

    // Save won item into player's database inventory securely!
    API.addWinningItem({
      name: winningPrize.name,
      rarity: ((winningPrize as any).rarity) || 'Common',
      value: ((winningPrize as any).value) || 5000,
      icon: ((winningPrize as any).icon) || '🎁',
      image: winningPrize.image
    })
      .then(() => {
        fetchUserProfile(); // Sync profile and inventory list
      })
      .catch((err) => {
        console.error('Gagal menyimpan hadiah roda ke inventory database:', err);
      });

    // Append to Local History Logs
    const logItem: SpinHistory = {
      id: crypto.randomUUID(),
      prizeId: winningPrize.id,
      prizeName: winningPrize.name,
      prizeImage: winningPrize.image,
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setHistory((prev) => [logItem, ...prev].slice(0, 10)); // Keep last 10
  };

  // Close winning popup & optionally remove winning slice
  const handleCloseWinnerModal = () => {
    setShowWinnerModal(false);
    setWinner(null);
  };

  const toggleSound = () => {
    setSettings((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const toggleFullscreen = () => {
    const appEl = document.getElementById('outer-shell');
    if (!appEl) return;

    if (!document.fullscreenElement) {
      appEl.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Fullscreen container check
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const clearHistoryLog = () => {
    if (window.confirm('Kosongkan riwayat spin terakhir?')) {
      setHistory([]);
    }
  };

  // Convert speed values back to legible percentage strings
  const getSpeedLabel = (sp: SpinSettings['speed']) => {
    switch (sp) {
      case 'slow': return 'Lambat';
      case 'normal': return 'Normal';
      case 'fast': return 'Cepat';
      case 'turbo': return 'Turbo ⚡';
    }
  };


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
        background: isFullscreen 
          ? "linear-gradient(rgba(8, 10, 20, 0.65), rgba(8, 10, 20, 0.85)), url('/background.png') center / cover no-repeat fixed"
          : "linear-gradient(rgba(10, 15, 30, 0.55), rgba(10, 15, 30, 0.8)), url('/background.png') center / cover no-repeat fixed"
      }}
      className={`min-h-screen text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col relative overflow-x-hidden blur-background-ambient ${
        isFullscreen ? 'p-6 justify-center' : ''
      }`}
    >
      {/* Dynamic Background visual blur orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-indigo-950/10 blur-[150px] pointer-events-none" />

      {/* Confetti Explosion Layer overlaying viewport */}
      <Confetti active={showWinnerModal} />

      {/* WINNER MODAL DRAWER POPUP */}
      {showWinnerModal && winner && (
        <div
          id="winner-overlay-modal"
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[90] animate-fade-in"
        >
          <div
            id="winner-modal-body"
            className="bg-[#0b0c15]/95 border-2 border-yellow-400/40 w-full max-w-md p-6 rounded-[32px] flex flex-col items-center text-center shadow-[0_0_40px_rgba(234,179,8,0.3)] relative overflow-hidden transition-all duration-300 transform scale-100"
          >
            {/* Blinking gold light border strip */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-yellow-400 to-indigo-600 animate-pulse" />
            
            {/* Crown Icon */}
            <div className="w-14 h-14 bg-yellow-500/10 rounded-full border border-yellow-400/30 flex items-center justify-center mb-3 animate-bounce">
              <Sparkles className="w-7 h-7 text-yellow-400" />
            </div>

            <h3 className="font-display font-black text-2xl text-yellow-400 mb-1 flex items-center justify-center gap-1.5 tracking-tight uppercase">
              SELAMAT! <PngEmoji src="/images/emoji_trophy.png" alt="🏆" className="w-6 h-6" />
            </h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-sans mb-5 font-bold">
              Hadiah ini berhasil masuk ke inventory Anda:
            </p>

            {/* Winning Image Thumbnail */}
            <div className="relative w-40 h-40 bg-black/60 rounded-3xl p-2 border-2 border-yellow-400/40 shadow-inner flex items-center justify-center overflow-hidden mb-4 group">
              <img
                src={winner.image}
                alt={winner.name}
                className="object-contain w-full h-full transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Winning Title Text label */}
            <h4 className="font-display text-xl font-black text-white mb-6 bg-white/5 py-2 px-6 rounded-xl border border-white/5 shadow-inner">
              {winner.name}
            </h4>

            {/* CTA action button */}
            <button
              onClick={handleCloseWinnerModal}
              className="w-full font-display font-black py-3 px-6 rounded-xl cursor-pointer bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-[#0F0F1A] shadow-[0_4px_25px_rgba(245,158,11,0.45)] transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide text-xs"
            >
              Putar Lagi <PngEmoji src="/images/emoji_spin.png" alt="🔄" className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER BRAND BAR - NEW RESPONSIVE NAVBAR */}
      {!isFullscreen && (
        <ResponsiveNavbar 
          user={user}
          activeGame={activeGame}
          onNavigate={setActiveGame}
          onLogout={handleLogout}
          gamesPublished={{
            wheel: wheelPublished,
            crash: crashPublished,
            cases: casesPublished
          }}
        />
      )}

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
                  wheel: wheelPublished,
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
        {(activeGame === 'cases' || activeGame === 'wheel' || activeGame === 'crash') && (
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

            {activeGame === 'wheel' && (
              (() => {
                // Check if wheel game is published
                const isWheelPublished = wheelPublished !== false;

                if (!isWheelPublished) {
                  return (
                    <div className="w-full flex flex-col items-center justify-center gap-4 py-16 px-4">
                      <div className="text-center">
                        <div className="text-6xl mb-4">🔧</div>
                        <h2 className="text-2xl font-black text-white mb-2">Roda Hadiah Sedang Dalam Perbaikan</h2>
                        <p className="text-slate-400 text-sm max-w-md">
                          Roda Hadiah sedang dalam pemeliharaan. Silakan coba lagi nanti atau mainkan game lain.
                        </p>
                      </div>
                      <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs text-center max-w-md">
                        ℹ️ Hubungi admin jika Anda memiliki pertanyaan
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full animate-fade-in">
            
            {/* LEFT COLUMN: THE CENTRAL WHEEL VIEWPORT & SPIN TRIGGER PANEL */}
            <section className={`${
              showSettings 
                ? 'lg:col-span-7 xl:col-span-6' 
                : 'col-span-12 lg:col-span-8 lg:col-start-2 xl:col-span-6 xl:col-start-3 mx-auto w-full max-w-xl'
            } flex flex-col items-center justify-center gap-6 bg-[#000000]/30 backdrop-blur-md p-4 md:p-8 rounded-[36px] border border-white/10 shadow-2.5xl transition-all duration-300`}>
              
              {wheelError && (
                <div className="w-full py-2.5 px-4 bg-red-950/40 border border-red-500/20 text-xs text-red-400 rounded-xl font-medium animate-shake flex items-center gap-1.5 leading-relaxed">
                  <ShieldAlert className="w-4.5 h-4.5 text-red-500 shrink-0" />
                  <span>{wheelError}</span>
                </div>
              )}

              {isFullscreen && (
                <div className="w-full flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Gift className="w-6 h-6 text-yellow-400" />
                    <h2 className="font-display font-medium text-lg text-white">Prize Spinner Active</h2>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-slate-900/80 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <Minimize2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              {/* Canvas WebGL/Draw engine widget container */}
              <PrizeWheel
                prizes={prizes}
                isSpinning={isSpinning}
                speed={settings.speed}
                duration={settings.duration}
                onSpinStart={handleSpinStart}
                onSpinComplete={handleSpinComplete}
              />

              {/* Trigger button array row */}
              <div className="w-full max-w-sm flex flex-col gap-3">
                
                {prizes.length < 2 ? (
                  <div className="text-center py-2 px-4 bg-red-950/30 rounded-xl border border-red-500/20 text-[11px] text-red-300 font-sans flex items-center justify-center gap-1.5">
                    <PngEmoji src="/images/emoji_warning.png" alt="⚠️" className="w-3.5 h-3.5" /> Harap tambahkan minimal 2 hadiah untuk memutar roda!
                  </div>
                ) : null}

                {/* Large glowing main SPIN trigger button */}
                <button
                  onClick={handleSpinStart}
                  disabled={isSpinning || prizes.length < 2}
                  className={`w-full font-display font-black text-base py-4 md:py-4 px-8 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 select-none uppercase tracking-wide border-2 ${
                    isSpinning
                      ? 'bg-[#151326]/60 border-white/5 text-slate-500 cursor-not-allowed shadow-none'
                      : prizes.length < 2
                      ? 'bg-blue-950/10 border-white/5 text-blue-400/20 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 hover:from-yellow-300 hover:via-amber-300 hover:to-orange-400 text-[#0F0F1A] border-yellow-300/40 shadow-[0_10px_35px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_45px_rgba(245,158,11,0.5)] active:scale-95 duration-200 animate-pulse-light'
                  }`}
                >
                  <Play className={`w-5 h-5 fill-current ${isSpinning ? 'opacity-30' : ''}`} />
                  {isSpinning ? 'SEDANG MEMUTAR...' : `PUTAR RODA (${WHEEL_SPIN_COST.toLocaleString()} WL)`}
                </button>

                {/* Quick action buttons beneath the wheel spinner */}
                <div className="flex gap-2 w-full justify-between mt-1 text-slate-400 text-[10px] font-sans">
                  <span className="flex items-center gap-1 bg-slate-900/40 border border-white/5 py-1.5 px-3 rounded-lg font-bold">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mata: <strong className="text-white">{getSpeedLabel(settings.speed)}</strong></span>
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900/40 border border-white/5 py-1.5 px-3 rounded-lg font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Durasi: <strong className="text-white">{settings.duration}s</strong></span>
                  </span>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: PRIZE LIST & SETTINGS EDITOR PANELS (Hidden by default / Toggled via 'F') */}
            {showSettings && (
              <section className="lg:col-span-5 xl:col-span-6 flex flex-col gap-8 animate-fade-in">
                
                {/* 1. General Controls Settings Panel */}
                <div className="bg-[#0b0c15]/80 p-6 rounded-2xl border border-white/10 flex flex-col gap-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400 flex items-center gap-2 uppercase tracking-wide">
                      <Settings className="w-4.5 h-4.5 text-blue-400" />
                      <PngEmoji src="/images/emoji_settings.png" alt="🎛️" className="w-4 h-4" /> Pengaturan Roda
                    </h3>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition"
                      title="Sembunyikan Pengaturan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Speed slider block */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 font-sans">Kecepatan Putaran</label>
                      <span className="text-xs text-blue-400 font-mono font-bold">
                        {getSpeedLabel(settings.speed)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 bg-[#0F0F1A] p-1 border border-white/5 rounded-lg select-none">
                      {(['slow', 'normal', 'fast', 'turbo'] as const).map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setSettings((prev) => ({ ...prev, speed: sp }))}
                          className={`cursor-pointer capitalize py-1.5 px-2 rounded-md text-xs font-semibold font-sans transition-all duration-150 ${
                            settings.speed === sp
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duration slider */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-300 font-sans">Durasi Berputar (Detik)</label>
                      <span className="text-xs text-sky-400 font-mono font-bold">
                        {settings.duration} Detik
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={settings.duration}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            duration: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full accent-blue-500 h-2 bg-[#0F0F1A] rounded-lg cursor-pointer border border-white/5"
                      />
                    </div>
                  </div>

                  {/* Switch option for default auto-delete */}
                  <div className="flex items-center justify-between gap-3 bg-[#0F0F1A] p-3 border border-white/5 rounded-xl">
                    <div className="flex flex-col gap-0.5">
                      <label
                        htmlFor="auto-remove-switch"
                        className="text-xs font-semibold text-slate-200 cursor-pointer select-none font-sans"
                      >
                        Mode Eliminasi Otomatis
                      </label>
                      <span className="text-[10px] text-slate-400 font-sans">
                        Keluarkan pemenang dari roda secara instan sesudah spin.
                      </span>
                    </div>
                    <input
                      id="auto-remove-switch"
                      type="checkbox"
                      checked={settings.autoRemove}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, autoRemove: e.target.checked }))
                      }
                      className="w-4.5 h-4.5 text-blue-600 rounded bg-[#100E1C] border-white/10 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Prize List Manager Panel section */}
                <div className="bg-[#0b0c15]/80 p-6 rounded-2xl border border-white/10 shadow-xl">
                  <PrizeManager
                    prizes={prizes}
                    onAddPrize={handleAddPrize}
                    onUpdatePrize={handleUpdatePrize}
                    onDeletePrize={handleDeletePrize}
                    onReorderPrizes={handleReorderPrizes}
                    onResetToDefault={handleResetToDefault}
                    onClearAll={handleClearAll}
                  />
                </div>

                {/* 3. History Spinner Logs widget */}
                <div className="bg-[#0b0c15]/80 p-6 rounded-2xl border border-white/10 flex flex-col gap-4 shadow-xl mb-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h3 className="font-display text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
                      <History className="w-4 h-4 text-emerald-400" />
                      <PngEmoji src="/images/emoji_history.png" alt="📋" className="w-4 h-4" /> Riwayat Putaran Terakhir
                    </h3>
                    {history.length > 0 && (
                      <button
                        onClick={clearHistoryLog}
                        className="text-[10px] text-slate-400 hover:text-red-400 transition-colors font-mono cursor-pointer"
                      >
                        CLEAR LOG
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-4 font-sans">
                      Belum ada putaran dilakukan. Klik SPIN untuk memulai!
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                      {history.map((h) => (
                        <div
                          key={h.id}
                          className="flex items-center justify-between bg-[#0F0F1A] border border-white/5 px-3 py-2 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-6 h-6 bg-black rounded p-0.5 flex-shrink-0 flex items-center justify-center">
                              <img
                                src={h.prizeImage}
                                alt={h.prizeName}
                                className="object-contain w-full h-full"
                              />
                            </div>
                            <span className="text-slate-200 truncate max-w-[170px] font-sans font-medium">
                              {h.prizeName}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">
                            {h.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </section>
            )}
                  </div>
                );
              })()
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
      {!isFullscreen && (
        <footer className="border-t border-white/10 py-5 text-center text-[10px] text-slate-500 font-mono mt-auto relative z-10 glass-panel-dark">
          WHEEL SPINNER CASINO &copy; 2026 &bull; Private Premium Client Build
        </footer>
      )}
    </div>
  );
}
