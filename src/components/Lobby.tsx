import React from 'react';
import { Gift, TrendingUp, Crown, Zap, Gamepad2, Fish, Sparkles } from 'lucide-react';

interface LobbyProps {
  user: any;
  onSelectGame: (game: 'cases' | 'fishing') => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  gamesPublished?: {
    cases?: boolean;
  };
}

export function Lobby({ user, onSelectGame, onOpenProfile, onOpenAdmin, onLogout, gamesPublished }: LobbyProps) {
  const games = [
    {
      id: 'cases' as const,
      name: 'Case Opening',
      description: 'Open chests and get rare items with fair RNG system',
      icon: Gift,
      color: 'from-[#38BDF8] to-[#1D4ED8]',
      bgGlow: 'from-[#38BDF8]/20 to-[#1D4ED8]/20',
      image: '/images/intichest2.png',
      stats: '15 Chests • 75 Items',
      published: gamesPublished?.cases !== false
    },
    {
      id: 'fishing' as const,
      name: 'AFK Fishing',
      description: 'Auto fishing bot to catch rare fish and sell them',
      icon: Fish,
      color: 'from-[#38BDF8] to-[#1D4ED8]',
      bgGlow: 'from-[#38BDF8]/20 to-[#1D4ED8]/20',
      image: '/bannerfishing.png',
      stats: '10 Fish Types • Auto Bot',
      published: true
    }
  ];

  return (
    <div className="w-full flex flex-col gap-12 animate-fade-in">
      {/* Welcome Section - Liquid Glass */}
      <div className="text-center relative">
        {/* Ambient Glow - Subtle */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#38BDF8] rounded-full mix-blend-multiply filter blur-[128px] opacity-5 animate-pulse"></div>
        
        <div className="relative">
          {/* Welcome Badge */}
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#38BDF8] to-[#1D4ED8] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative backdrop-blur-xl bg-gradient-to-r from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/[0.08] px-6 py-3 flex items-center gap-3">
                <Crown className="w-5 h-5 text-[#67E8F9] animate-pulse" />
                <span className="text-sm font-bold bg-gradient-to-r from-white via-[#67E8F9] to-white bg-clip-text text-transparent tracking-wide">
                  Welcome, {user.username}!
                </span>
              </div>
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black bg-gradient-to-r from-white via-[#67E8F9] to-white bg-clip-text text-transparent mb-4 tracking-tight">
            
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
             <span className="text-[#38BDF8] font-semibold"></span> 
          </p>
        </div>
      </div>

      {/* Games Grid - Liquid Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => {
          const Icon = game.icon;
          const isDisabled = !game.published;
          
          return (
            <div
              key={game.id}
              onClick={() => !isDisabled && onSelectGame(game.id)}
              className={`group relative ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Maintenance Badge */}
              {isDisabled && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full blur-lg opacity-50"></div>
                    <div className="relative backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-full px-4 py-1.5">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Maintenance</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Hover Glow Effect */}
              {!isDisabled && (
                <div className={`absolute inset-0 bg-gradient-to-br ${game.bgGlow} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              )}

              {/* Glass Card */}
              <div className={`relative backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-3xl border border-white/[0.08] p-8 shadow-2xl overflow-hidden transition-all duration-500 ${
                !isDisabled && 'group-hover:border-white/20 group-hover:transform group-hover:-translate-y-2'
              }`}>
                {/* Top Accent Line */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r ${game.color} rounded-full opacity-0 ${!isDisabled && 'group-hover:opacity-100'} transition-opacity duration-300`}></div>

                {/* Game Image */}
                <div className="relative mb-6 flex items-center justify-center h-40">
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.bgGlow} rounded-2xl blur-2xl opacity-0 ${!isDisabled && 'group-hover:opacity-50'} transition-opacity duration-500`}></div>
                  <img 
                    src={game.image} 
                    alt={game.name}
                    className={`relative w-32 h-32 object-contain filter drop-shadow-2xl transition-all duration-500 ${
                      isDisabled ? 'grayscale' : 'group-hover:scale-110 group-hover:rotate-3'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 space-y-4">
                  {/* Title */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold transition-colors ${
                      isDisabled ? 'text-white/40' : 'text-white group-hover:text-[#67E8F9]'
                    }`}>
                      {game.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed min-h-[40px]">
                    {isDisabled ? 'Game is under maintenance. Please try again later.' : game.description}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-2 text-xs text-white/50 font-medium">
                    <Gamepad2 className="w-4 h-4" />
                    <span>{game.stats}</span>
                  </div>

                  {/* Play Button */}
                  <button
                    disabled={isDisabled}
                    className={`w-full py-4 rounded-2xl text-center text-sm font-bold transition-all duration-300 overflow-hidden relative ${
                      isDisabled
                        ? 'bg-white/[0.05] text-white/40 cursor-not-allowed'
                        : 'group/btn'
                    }`}
                  >
                    {!isDisabled && (
                      <>
                        <div className={`absolute inset-0 bg-gradient-to-r ${game.color} bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]`}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className={`absolute inset-0 bg-gradient-to-r ${game.color} blur-xl opacity-50 group-hover/btn:opacity-75 transition-opacity`}></div>
                      </>
                    )}
                    <span className="relative text-white flex items-center justify-center gap-2">
                      {isDisabled ? 'UNDER MAINTENANCE' : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          PLAY NOW
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info - Liquid Glass */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 backdrop-blur-xl bg-gradient-to-r from-white/[0.05] to-white/[0.02] rounded-2xl border border-white/[0.08] px-6 py-3">
          <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-sm text-white/60"></span>
        </div>
      </div>
    </div>
  );
}
