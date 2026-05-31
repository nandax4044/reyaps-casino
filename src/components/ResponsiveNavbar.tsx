import React, { useState, useEffect } from 'react';
import { Menu, X, User, ShieldCheck, LogOut, Home, Gamepad2, Settings, HelpCircle } from 'lucide-react';

interface ResponsiveNavbarProps {
  user: any;
  activeGame: 'lobby' | 'crash' | 'cases' | 'profile' | 'admin';
  onNavigate: (game: 'lobby' | 'crash' | 'cases' | 'profile' | 'admin') => void;
  onLogout: () => void;
  gamesPublished?: {
    crash?: boolean;
    cases?: boolean;
  };
}

export function ResponsiveNavbar({ user, activeGame, onNavigate, onLogout, gamesPublished }: ResponsiveNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [maintenanceNotif, setMaintenanceNotif] = useState<string | null>(null);

  // Handle scroll to change navbar background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when navigating
  const handleNavClick = (game: 'lobby' | 'crash' | 'cases' | 'profile' | 'admin') => {
    // Check if game is published
    if (game === 'crash' && gamesPublished?.crash === false) {
      setMaintenanceNotif('Crash Game sedang dalam perbaikan. Silakan coba lagi nanti.');
      setTimeout(() => setMaintenanceNotif(null), 3000);
      setIsMenuOpen(false);
      return;
    }
    if (game === 'cases' && gamesPublished?.cases === false) {
      setMaintenanceNotif('Case Opening sedang dalam perbaikan. Silakan coba lagi nanti.');
      setTimeout(() => setMaintenanceNotif(null), 3000);
      setIsMenuOpen(false);
      return;
    }

    onNavigate(game);
    setIsMenuOpen(false);
  };

  const navLinks = [
    { id: 'lobby', label: 'Home', icon: Home },
    { id: 'cases', label: 'Case Opening', icon: Gamepad2 },
    { id: 'crash', label: 'Crash Game', icon: Settings },
    { id: 'profile', label: 'Dashboard', icon: User },
  ];

  // Admin link (only for staff)
  const adminLink = user?.is_staff ? { id: 'admin', label: 'Admin Panel', icon: ShieldCheck } : null;

  return (
    <>
      {/* MAINTENANCE NOTIFICATION */}
      {maintenanceNotif && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[60] animate-fade-in">
          <div className="bg-red-500/95 backdrop-blur-md border border-red-400/50 rounded-xl px-6 py-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔧</div>
              <div>
                <p className="text-white font-bold text-sm">{maintenanceNotif}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            
            {/* LEFT: Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${
                isScrolled
                  ? 'bg-blue-100'
                  : 'bg-white/10'
              }`}>
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className={`font-black text-lg md:text-xl tracking-tight transition-all ${
                  isScrolled
                    ? 'text-blue-600'
                    : 'text-white'
                }`}>
                  ReyaBet
                </h1>
                <p className={`text-[8px] md:text-[9px] font-mono tracking-wider font-black uppercase hidden sm:block transition-all ${
                  isScrolled
                    ? 'text-gray-500'
                    : 'text-white/60'
                }`}>
                  Casino In Reya
                </p>
              </div>
            </div>

            {/* CENTER: Navigation Links (Desktop Only) */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = activeGame === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id as any)}
                    className={`flex items-center gap-2 font-semibold text-sm transition-all duration-300 group ${
                      isActive
                        ? isScrolled
                          ? 'text-blue-600'
                          : 'text-yellow-400'
                        : isScrolled
                        ? 'text-gray-700 hover:text-blue-600'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {isActive && (
                      <div className={`h-0.5 w-full absolute bottom-0 left-0 transition-all ${
                        isScrolled ? 'bg-blue-600' : 'bg-yellow-400'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="hidden md:flex items-center gap-3">
              {user && (
                <>
                  {/* Admin Button (only for staff) */}
                  {user.is_staff && (
                    <button
                      onClick={() => handleNavClick('admin')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                        activeGame === 'admin'
                          ? isScrolled
                            ? 'bg-red-100 text-red-600'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isScrolled
                          ? 'text-gray-700 hover:text-red-600'
                          : 'text-white/80 hover:text-red-400'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span className="hidden lg:inline">Admin</span>
                    </button>
                  )}

                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isScrolled
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-white/10 text-white'
                  }`}>
                    <User className="w-4 h-4" />
                    <span className="text-sm font-semibold">{user.username}</span>
                    {user.is_staff && (
                      <span className="text-xs font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onLogout}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      isScrolled
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>

            {/* MOBILE: Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all ${
                isScrolled
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* MOBILE MENU DRAWER */}
      <div
        className={`fixed top-0 right-0 h-screen w-4/5 max-w-sm bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-black text-gray-900">Menu</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* Menu Links */}
        <div className="flex flex-col p-6 gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeGame === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* Admin Button (Mobile) */}
          {user?.is_staff && (
            <button
              onClick={() => handleNavClick('admin')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeGame === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Divider */}
          <div className="my-4 border-t border-gray-200" />

          {/* User Info */}
          {user && (
            <>
              <div className="px-4 py-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                  Logged In As
                </p>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-gray-900">{user.username}</span>
                  {user.is_staff && (
                    <span className="text-xs font-bold bg-red-500/20 text-red-600 px-2 py-1 rounded border border-red-500/30">
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  onLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Spacer to prevent content overlap */}
      <div className="h-16 md:h-20" />
    </>
  );
}
