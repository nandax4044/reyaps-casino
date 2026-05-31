# EDIT APP.TSX MANUAL - STEP BY STEP

## ✅ SUDAH SELESAI:
1. ✅ Navbar - Hanya dashboard buttons (Line 518-555)
2. ✅ Dashboard close - Kembali ke lobby (Line 605-620)
3. ✅ Logout - Kembali ke lobby (Line 93)
4. ✅ activeGame state - Include 'lobby' (Line 100)
5. ✅ Import Lobby component (Line 18)

## ⏳ YANG PERLU DILAKUKAN:

### STEP 1: Buka file `src/App.tsx` di VS Code

### STEP 2: Cari Line 580-590 (MAIN LAYOUT BODY)

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

### STEP 3: REPLACE dengan struktur baru

**HAPUS dari Line 580 sampai Line 590** (10 lines)

**GANTI dengan:**
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

### STEP 4: Cari bagian game content (Line ~591)

Setelah `<div className="w-full max-w-6xl mx-auto">`, KEEP semua game content seperti biasa:
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
```

### STEP 5: Cari bagian Profile & Admin (Line ~605-620)

**HAPUS bagian ini:**
```typescript
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
```

### STEP 6: Cari akhir dari wheel game section

Cari bagian penutup dari wheel game (biasanya ada banyak closing `</div>` dan `</section>`).

Setelah wheel game selesai, tambahkan:
```typescript
          </div>
        )}

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

### STEP 7: HAPUS sidebar lama (jika masih ada)

Cari dan HAPUS bagian ini (biasanya setelah game content):
```typescript
          {/* RIGHT COLUMN: GLOBAL CHAT - Hidden on mobile, visible on lg+ */}
          <div className="hidden lg:block lg:col-span-3 col-span-12 w-full lg:sticky lg:top-[100px]">
            <GlobalChat currentUser={user} />
          </div>

          {/* MOBILE ONLY: Show Online Players & Chat in tabs at bottom */}
          <div className="lg:hidden col-span-12 w-full mt-4">
            ...
          </div>
        </div>
      </main>
```

## 🎯 TIPS EDITING:

1. **Gunakan Find & Replace** (Ctrl+H) di VS Code
2. **Format code** setelah edit (Shift+Alt+F)
3. **Check bracket matching** - pastikan semua `{` dan `}` balance
4. **Save** dan test build setelah setiap perubahan besar

## 🚀 TESTING:

Setelah edit, test:
```bash
npm run build
```

Jika success:
```bash
npm run dev
```

Buka browser dan test:
1. Login → Harus masuk ke Lobby
2. Klik game card → Harus masuk ke game (NO sidebar)
3. Klik Dashboard → Harus masuk ke dashboard (NO sidebar)
4. Logout → Kembali ke login

## ⚠️ JIKA ERROR:

1. Restore backup:
```bash
copy src\App.tsx.backup src\App.tsx
```

2. Coba lagi step by step
3. Atau minta saya bantu lagi

## 📝 STRUKTUR AKHIR:

```
Main Content
├── IF activeGame === 'lobby'
│   └── 3-column layout
│       ├── LEFT: Online Players
│       ├── CENTER: Lobby (game cards)
│       └── RIGHT: Global Chat
├── IF activeGame === 'cases' | 'wheel' | 'crash'
│   └── Full width (NO sidebar)
│       └── Game content
└── IF activeGame === 'profile' | 'admin'
    └── Full width (NO sidebar)
        └── Dashboard content
```

## ✅ HASIL AKHIR:

- ✅ Navbar: Hanya Dashboard buttons
- ✅ Lobby: Game cards + Chat & Online Players
- ✅ Games: Full width, NO sidebar
- ✅ Dashboard: Full width, NO sidebar
- ✅ Mobile: Tabs untuk Chat & Online Players (hanya di Lobby)
