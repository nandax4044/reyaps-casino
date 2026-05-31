# MANUAL INTEGRATION STEPS - LOBBY WITH PROPER SIDEBAR VISIBILITY

## ✅ SUDAH SELESAI:
1. ✅ Import Lobby component
2. ✅ Update activeGame state type to include 'lobby'
3. ✅ Change default activeGame to 'lobby'
4. ✅ Update logout to go to 'lobby'

## ⏳ YANG PERLU DILAKUKAN MANUAL:

### STEP 1: Tambah Lobby Button di Header (Line ~530)

Cari bagian ini di header navigation:
```typescript
<div className="flex bg-[#070915] p-1.5 border border-white/10 rounded-[20px] select-none shrink-0 overflow-x-auto max-w-full glass-panel-dark">
```

Tambahkan button Lobby SEBELUM button "Case Opening":
```typescript
<button
  onClick={() => {
    setActiveGame('lobby');
    setShowSettings(false);
  }}
  className={`flex items-center gap-1.5 py-1.5 px-3 md:px-4 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
    activeGame === 'lobby'
      ? 'bg-gradient-to-r from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-900/40'
      : 'text-slate-400 hover:text-cyan-400'
  }`}
>
  <Gift className="w-3.5 h-3.5" />
  <span>Lobby</span>
</button>
```

### STEP 2: Replace MAIN LAYOUT BODY Section (Line ~650)

Cari bagian ini:
```typescript
{/* MAIN LAYOUT BODY */}
<main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 lg:p-8 relative z-10 flex flex-col justify-start">
  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start">
    {/* LEFT COLUMN: ONLINE PLAYERS - Hidden on mobile, visible on lg+ */}
    <div className="hidden lg:block lg:col-span-3 col-span-12 w-full lg:sticky lg:top-[100px]">
      <OnlinePlayers currentUser={user} />
    </div>

    {/* CENTER COLUMN: ACTIVE GAME OR DASHBOARD MODULES */}
    <div className="lg:col-span-6 col-span-12 flex flex-col gap-4 md:gap-6 w-full">
```

REPLACE DENGAN:
```typescript
{/* MAIN LAYOUT BODY */}
<main className="flex-1 max-w-7xl mx-auto w-full p-3 md:p-6 lg:p-8 relative z-10 flex flex-col justify-start">
  {/* ========== LOBBY PAGE - WITH SIDEBAR ========== */}
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
    <div className="w-full max-w-6xl mx-auto">
```

### STEP 3: Update Game Content Section

Setelah opening `<div className="w-full max-w-6xl mx-auto">`, KEEP semua game content seperti biasa:
```typescript
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full animate-fade-in">
          {/* ... wheel content ... */}
        </div>
      )}
    </div>
  )}
```

### STEP 4: Add Dashboard Pages Section (AFTER game pages closing div)

HAPUS bagian profile dan admin yang lama, REPLACE dengan:
```typescript
  {/* ========== DASHBOARD PAGES - NO SIDEBAR ========== */}
  {(activeGame === 'profile' || activeGame === 'admin') && (
    <div className="w-full max-w-6xl mx-auto">
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
</main>
```

### STEP 5: HAPUS Sidebar yang Lama

HAPUS bagian ini (jika masih ada):
```typescript
{/* RIGHT COLUMN: GLOBAL CHAT - Hidden on mobile, visible on lg+ */}
<div className="hidden lg:block lg:col-span-3 col-span-12 w-full lg:sticky lg:top-[100px]">
  <GlobalChat currentUser={user} />
</div>

{/* MOBILE ONLY: Show Online Players & Chat in tabs at bottom */}
<div className="lg:hidden col-span-12 w-full mt-4">
  ...
</div>
```

## 📊 STRUKTUR AKHIR:

```
App.tsx
├── Loading Screen
├── Auth Screen (if not logged in)
└── Main App (if logged in)
    ├── Header (with Lobby button)
    └── Main Content
        ├── IF activeGame === 'lobby'
        │   └── 3-column layout (Online Players | Lobby | Chat)
        ├── IF activeGame === 'cases' | 'wheel' | 'crash'
        │   └── Full width (NO sidebar)
        └── IF activeGame === 'profile' | 'admin'
            └── Full width (NO sidebar)
```

## 🎯 HASIL AKHIR:

- ✅ **Lobby**: Ada Chat & Online Players (3 kolom)
- ✅ **Games**: TIDAK ada Chat & Online Players (full width)
- ✅ **Dashboard**: TIDAK ada Chat & Online Players (full width)
- ✅ **Mobile**: Tabs untuk Chat & Online Players (hanya di Lobby)

## ⚠️ PENTING:

1. Pastikan semua `{` dan `}` balance
2. Pastikan semua `<div>` ada closing tag nya
3. Test build setelah setiap perubahan
4. Jika error, revert dan coba lagi step by step

## 🚀 TESTING:

```bash
npm run build
```

Jika success, deploy:
```bash
vercel --prod
```
