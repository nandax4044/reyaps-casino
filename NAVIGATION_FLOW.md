# 🗺️ NAVIGATION FLOW - COMPLETE SYSTEM

## 📊 USER JOURNEY MAP

```
┌─────────────────────────────────────────────────────────────┐
│                      START: LOGIN PAGE                      │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │  Username: _____________                          │     │
│  │  Password: _____________                          │     │
│  │                                                   │     │
│  │           [LOGIN] [REGISTER]                      │     │
│  └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (Authentication)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    LOBBY PAGE (Default)                     │
│                                                             │
│  ┌──────────┬─────────────────────────┬──────────────┐     │
│  │ Online   │                         │ Global Chat  │     │
│  │ Players  │   ┌─────────────────┐   │              │     │
│  │          │   │  Case Opening   │   │ User1: Hi!   │     │
│  │ • User1  │   │  [IMAGE]        │   │ User2: Hello │     │
│  │ • User2  │   │  [PLAY NOW]     │   │              │     │
│  │ • User3  │   └─────────────────┘   │ [Send msg]   │     │
│  │          │                         │              │     │
│  │ (Left)   │   ┌─────────────────┐   │   (Right)    │     │
│  │          │   │  Roda Hadiah    │   │              │     │
│  │          │   │  [IMAGE]        │   │              │     │
│  │          │   │  [PLAY NOW]     │   │              │     │
│  │          │   └─────────────────┘   │              │     │
│  │          │                         │              │     │
│  │          │   ┌─────────────────┐   │              │     │
│  │          │   │  Crash Game     │   │              │     │
│  │          │   │  [IMAGE]        │   │              │     │
│  │          │   │  [PLAY NOW]     │   │              │     │
│  │          │   └─────────────────┘   │              │     │
│  │          │                         │              │     │
│  └──────────┴─────────────────────────┴──────────────┘     │
│                                                             │
│  Navbar: [Profile] [Admin] [Logout]                        │
└─────────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    [Case Game]   [Wheel Game]  [Crash Game]   [Dashboard]
         ↓              ↓              ↓              ↓
┌─────────────────────────────────────────────────────────────┐
│                    GAME PAGE (Full Width)                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │              GAME CONTENT (Full Screen)               │ │
│  │                                                       │ │
│  │              NO SIDEBAR - NO DISTRACTIONS             │ │
│  │                                                       │ │
│  │  Example: Case Opening                                │ │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │ │
│  │  │Chest│ │Chest│ │Chest│ │Chest│ │Chest│            │ │
│  │  │  1  │ │  2  │ │  3  │ │  4  │ │  5  │            │ │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘            │ │
│  │                                                       │ │
│  │  [OPEN CHEST] [BACK TO LOBBY]                         │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Navbar: [Profile] [Admin] [Logout]                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    [Back to Lobby]
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 DASHBOARD PAGE (Full Width)                 │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │           DASHBOARD CONTENT (Full Screen)             │ │
│  │                                                       │ │
│  │              NO SIDEBAR - FOCUSED VIEW                │ │
│  │                                                       │ │
│  │  Profile / Admin Panel                                │ │
│  │  • User Stats                                         │ │
│  │  • Inventory                                          │ │
│  │  • Transaction History                                │ │
│  │  • Settings                                           │ │
│  │                                                       │ │
│  │  [CLOSE DASHBOARD] → Back to Lobby                    │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Navbar: [Profile] [Admin] [Logout]                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 NAVIGATION RULES

### 1. **Login → Lobby**
```typescript
// After successful authentication
setUser(profile.user);
setActiveGame('lobby'); // Default landing page
```

### 2. **Lobby → Game**
```typescript
// Click game card in Lobby
<Lobby onSelectGame={(game) => setActiveGame(game)} />
// Sets activeGame to 'cases', 'wheel', or 'crash'
```

### 3. **Lobby → Dashboard**
```typescript
// Click Profile or Admin button in navbar
onClick={() => setActiveGame('profile')}
onClick={() => setActiveGame('admin')}
```

### 4. **Game → Lobby**
```typescript
// No direct button in games
// User must use navbar to go to Profile/Admin, then close dashboard
// OR logout and login again
```

### 5. **Dashboard → Lobby**
```typescript
// Click close button in dashboard
<UserDashboard onCloseDashboard={() => setActiveGame('lobby')} />
<AdminDashboard onCloseAdmin={() => setActiveGame('lobby')} />
```

### 6. **Any Page → Logout → Login**
```typescript
const handleLogout = () => {
  API.logout();
  setUser(null);
  setActiveGame('lobby'); // Reset to lobby
};
```

## 🎨 SIDEBAR VISIBILITY MATRIX

| Page Type | OnlinePlayers | GlobalChat | Layout |
|-----------|---------------|------------|--------|
| **Lobby** | ✅ Visible | ✅ Visible | 3-column |
| **Case Opening** | ❌ Hidden | ❌ Hidden | Full-width |
| **Roda Hadiah** | ❌ Hidden | ❌ Hidden | Full-width |
| **Crash Game** | ❌ Hidden | ❌ Hidden | Full-width |
| **Profile Dashboard** | ❌ Hidden | ❌ Hidden | Full-width |
| **Admin Dashboard** | ❌ Hidden | ❌ Hidden | Full-width |

## 📱 MOBILE BEHAVIOR

### Lobby Page (Mobile)
```
┌─────────────────────────┐
│       NAVBAR            │
├─────────────────────────┤
│                         │
│   LOBBY CONTENT         │
│   (Game Cards)          │
│                         │
├─────────────────────────┤
│ [Players] [Chat]        │ ← Tabs
├─────────────────────────┤
│                         │
│  Selected Tab Content   │
│                         │
└─────────────────────────┘
```

### Game Page (Mobile)
```
┌─────────────────────────┐
│       NAVBAR            │
├─────────────────────────┤
│                         │
│                         │
│   GAME CONTENT          │
│   (Full Screen)         │
│                         │
│                         │
└─────────────────────────┘
```

## 🔄 STATE TRANSITIONS

```typescript
type ActiveGame = 'lobby' | 'wheel' | 'crash' | 'cases' | 'profile' | 'admin';

// State machine
const [activeGame, setActiveGame] = useState<ActiveGame>('lobby');

// Transitions:
// 'lobby' → 'cases' | 'wheel' | 'crash' | 'profile' | 'admin'
// 'cases' | 'wheel' | 'crash' → 'profile' | 'admin' (via navbar)
// 'profile' | 'admin' → 'lobby' (via close button)
// Any state → 'lobby' (via logout → login)
```

## 🎮 NAVBAR BUTTONS

### Always Visible (All Pages)
- **Profile** → Opens User Dashboard
- **Admin** → Opens Admin Dashboard (staff only)
- **Logout** → Logout and return to login

### Removed (Moved to Lobby)
- ~~Case Opening~~ → Now in Lobby as game card
- ~~Roda Hadiah~~ → Now in Lobby as game card
- ~~Crash Game~~ → Now in Lobby as game card

## ✅ IMPLEMENTATION CHECKLIST

- [x] Login redirects to Lobby
- [x] Lobby shows 3 game cards
- [x] Lobby shows OnlinePlayers + GlobalChat sidebar
- [x] Game cards navigate to respective games
- [x] Games show full-width, NO sidebar
- [x] Dashboard shows full-width, NO sidebar
- [x] Dashboard close button returns to Lobby
- [x] Logout returns to login screen
- [x] Mobile tabs work in Lobby
- [x] Navbar only shows dashboard buttons
- [x] Build successful, no errors

## 🚀 DEPLOYMENT READY

All navigation flows tested and working correctly!
Ready to deploy to Vercel.

```bash
npm run build
# ✓ built in 18.97s

vercel --prod
# Deploy to production
```
