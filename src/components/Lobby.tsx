import React from 'react';
import { Gift, Sparkles, TrendingUp, User, ShieldCheck, LogOut, Crown, Zap, Gamepad2 } from 'lucide-react';
import CurrencyDisplay from './CurrencyDisplay';

interface LobbyProps {
  user: any;
  onSelectGame: (game: 'wheel' | 'crash' | 'cases') => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
}

export function Lobby({ user, onSelectGame, onOpenProfile, onOpenAdmin, onLogout }: LobbyProps) {
  const games = [
    {
      id: 'cases' as const,
      name: 'Case Opening',
      description: 'Buka chest dan dapatkan item langka dengan sistem RNG yang adil',
      icon: Gift,
      color: 'from-blue-600 to-sky-500',
      bgGlow: 'bg-blue-500/10',
      image: '/images/intichest2.png',
      stats: '15 Chests • 75 Items'
    },
    {
      id: 'wheel' as const,
      name: 'Wheel',
      description: 'Putar roda keberuntungan dan menangkan hadiah mewah eksklusif',
      icon: Sparkles,
      color: 'from-purple-600 to-pink-500',
      bgGlow: 'bg-purple-500/10',
      image: '/images/rllogo.png',
      stats: '6 Prizes • Big Rewards'
    },
    {
      id: 'crash' as const,
      name: 'Crash Game',
      description: 'Bertaruh dan cashout sebelum crash untuk menggandakan saldo Anda',
      icon: TrendingUp,
      color: 'from-orange-600 to-red-500',
      bgGlow: 'bg-orange-500/10',
      image: '/images/crashlogo.png',
      stats: 'Multiplier • High Risk'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-4">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Selamat Datang, {user.username}!</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-display uppercase tracking-tight mb-3">
          Pilih Permainan
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Mainkan berbagai game seru dan menangkan hadiah menarik. Semua game menggunakan sistem RNG yang adil dan transparan.
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <div
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group relative bg-gradient-to-br from-[#1a1535]/90 to-[#0f0d1f]/95 hover:from-[#221a3f]/95 hover:to-[#14112a]/95 border-2 border-white/10 hover:border-purple-500/60 rounded-[28px] p-6 cursor-pointer transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_15px_45px_rgba(168,85,247,0.35)] overflow-hidden"
            >
              {/* Glow Effect */}
              <div className={`absolute -right-16 -top-16 w-56 h-56 ${game.bgGlow} opacity-[0.06] group-hover:opacity-[0.18] rounded-full blur-3xl transition-all duration-500`} />
              
              {/* Top Badge */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-[3px] bg-transparent group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-pink-500 rounded-full transition-all duration-300" />

              {/* Game Image - BIGGER */}
              <div className="relative mb-4 flex items-center justify-center">
                <div className="w-full h-48 flex items-center justify-center">
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className="w-40 h-40 object-contain filter drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)] group-hover:scale-110 group-hover:rotate-2 transition-all duration-500" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-100 group-hover:text-purple-300 transition-colors tracking-wide font-display mb-2">
                  {game.name}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {game.description}
                </p>
                
                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-6">
                  <Gamepad2 className="w-3 h-3" />
                  <span>{game.stats}</span>
                </div>

                {/* Play Button */}
                <div className={`w-full bg-gradient-to-r ${game.color} hover:opacity-90 text-white py-3 rounded-xl text-center text-sm font-black transition-all duration-300 transform group-hover:scale-[1.03] shadow-lg`}>
                  MAINKAN SEKARANG
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
