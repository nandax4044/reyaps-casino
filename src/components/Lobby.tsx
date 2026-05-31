import React from 'react';
import { Gift, TrendingUp, Crown, Zap, Gamepad2 } from 'lucide-react';

interface LobbyProps {
  user: any;
  onSelectGame: (game: 'crash' | 'cases') => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  gamesPublished?: {
    crash?: boolean;
    cases?: boolean;
  };
}

export function Lobby({ user, onSelectGame, onOpenProfile, onOpenAdmin, onLogout, gamesPublished }: LobbyProps) {
  const games = [
    {
      id: 'cases' as const,
      name: 'Case Opening',
      description: 'Buka chest dan dapatkan item langka dengan sistem RNG yang adil',
      icon: Gift,
      color: 'from-blue-600 to-sky-500',
      bgGlow: 'bg-blue-500/10',
      image: '/images/intichest2.png',
      stats: '15 Chests • 75 Items',
      published: gamesPublished?.cases !== false
    },
    {
      id: 'crash' as const,
      name: 'Crash Game',
      description: 'Bertaruh dan cashout sebelum crash untuk menggandakan saldo Anda',
      icon: TrendingUp,
      color: 'from-orange-600 to-red-500',
      bgGlow: 'bg-orange-500/10',
      image: '/images/crashlogo.png',
      stats: 'Multiplier • High Risk',
      published: gamesPublished?.crash !== false
    }
  ];

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-400/30 rounded-full px-5 py-2.5 mb-6 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
          <Crown className="w-5 h-5 text-yellow-400 animate-pulse" />
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 uppercase tracking-wider">
            Selamat Datang, {user.username}!
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 font-display uppercase tracking-tight mb-4 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">
          
        </h2>
        <p className="text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
          
          <span className="text-cyan-400 font-bold"></span>
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {games.map((game) => {
          const Icon = game.icon;
          const isDisabled = !game.published;
          
          return (
            <div
              key={game.id}
              onClick={() => !isDisabled && onSelectGame(game.id)}
              className={`group relative bg-gradient-to-br from-[#1a1535]/90 to-[#0f0d1f]/95 border-2 border-white/10 rounded-[28px] p-6 transition-all duration-500 overflow-hidden ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:from-[#221a3f]/95 hover:to-[#14112a]/95 hover:border-purple-500/60 cursor-pointer transform hover:-translate-y-2 hover:shadow-[0_15px_45px_rgba(168,85,247,0.35)]'
              }`}
            >
              {/* Maintenance Badge */}
              {isDisabled && (
                <div className="absolute top-4 right-4 bg-red-500/20 border border-red-500/50 rounded-full px-3 py-1 z-20">
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Maintenance</span>
                </div>
              )}

              {/* Glow Effect */}
              <div className={`absolute -right-16 -top-16 w-56 h-56 ${game.bgGlow} opacity-[0.06] ${!isDisabled && 'group-hover:opacity-[0.18]'} rounded-full blur-3xl transition-all duration-500`} />
              
              {/* Top Badge */}
              <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-[3px] bg-transparent ${!isDisabled && 'group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500'} rounded-full transition-all duration-300`} />

              {/* Game Image - BIGGER */}
              <div className="relative mb-4 flex items-center justify-center">
                <div className="w-full h-48 flex items-center justify-center">
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className={`w-40 h-40 object-contain filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)] transition-all duration-500 ${
                      isDisabled ? 'grayscale' : 'group-hover:scale-110 group-hover:rotate-2'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className={`text-2xl font-black tracking-wide font-display mb-2 transition-colors ${
                  isDisabled ? 'text-slate-500' : 'text-slate-100 group-hover:text-purple-300'
                }`}>
                  {game.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {isDisabled ? 'Game sedang dalam perbaikan. Silakan coba lagi nanti.' : game.description}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-6">
                  <Gamepad2 className="w-3 h-3" />
                  <span>{game.stats}</span>
                </div>

                {/* Play Button */}
                <div className={`w-full py-3 rounded-xl text-center text-sm font-black transition-all duration-300 shadow-lg ${
                  isDisabled
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${game.color} hover:opacity-90 text-white transform group-hover:scale-[1.03]`
                }`}>
                  {isDisabled ? 'DALAM PERBAIKAN' : 'MAINKAN SEKARANG'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Zap className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Semua game menggunakan sistem RNG yang adil dan transparan</span>
        </div>
      </div>
    </div>
  );
}
