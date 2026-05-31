# PowerShell script to apply Lobby changes to App.tsx
Write-Host "🔧 Applying Lobby System Changes to App.tsx..." -ForegroundColor Cyan

# Read the file
$content = Get-Content "src\App.tsx" -Raw

# 1. Replace navbar game buttons with only dashboard buttons
$oldNav = @'
          {/* Game Selector Tab Navigation */}
          <div className="flex bg-[#070915] p-1.5 border border-white/10 rounded-[20px] select-none shrink-0 overflow-x-auto max-w-full glass-panel-dark">
            <button
              onClick={() => {
                setActiveGame('cases');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'cases'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Case Opening</span>
            </button>
            <button
              onClick={() => {
                setActiveGame('wheel');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'wheel'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Roda Hadiah</span>
            </button>
            <button
              onClick={() => {
                setActiveGame('crash');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'crash'
                  ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Crash Game</span>
            </button>

            <div className="w-px h-5 bg-white/10 mx-1.5 align-middle self-center shrink-0" />

            <button
              onClick={() => {
                setActiveGame('profile');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'profile'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Dashboard Player</span>
            </button>

            {user.is_staff && (
              <button
                onClick={() => {
                  setActiveGame('admin');
                  setShowSettings(false);
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  activeGame === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Staff Dashboard</span>
              </button>
            )}
          </div>
'@

$newNav = @'
          {/* Dashboard Navigation - Game buttons moved to Lobby */}
          <div className="flex bg-[#070915] p-1.5 border border-white/10 rounded-[20px] select-none shrink-0 overflow-x-auto max-w-full glass-panel-dark">
            <button
              onClick={() => {
                setActiveGame('profile');
                setShowSettings(false);
              }}
              className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                activeGame === 'profile'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Dashboard Player</span>
            </button>

            {user.is_staff && (
              <button
                onClick={() => {
                  setActiveGame('admin');
                  setShowSettings(false);
                }}
                className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  activeGame === 'admin'
                    ? 'bg-gradient-to-r from-red-600 to-pink-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-red-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Staff Dashboard</span>
              </button>
            )}
          </div>
'@

$content = $content.Replace($oldNav, $newNav)

Write-Host "✅ Step 1: Navbar updated" -ForegroundColor Green

# Save the modified content
$content | Set-Content "src\App.tsx" -NoNewline

Write-Host "✅ All changes applied successfully!" -ForegroundColor Green
Write-Host "📝 Testing build..." -ForegroundColor Yellow

# Test build
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed! Restoring backup..." -ForegroundColor Red
    Copy-Item "src\App.tsx.backup" "src\App.tsx" -Force
    Write-Host "✅ Backup restored" -ForegroundColor Yellow
}
