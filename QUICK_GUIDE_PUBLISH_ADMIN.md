# 🚀 QUICK GUIDE - GAME PUBLISHING & ADMIN NAVBAR

## ⚡ QUICK START

### 1. Control Game Availability

**Make a game playable:**
```json
"published": true
```

**Put a game in maintenance:**
```json
"published": false
```

### 2. Access Admin Panel

**Desktop:**
- Look for "🛡️ Admin" button in navbar (right side)
- Click to open Admin Dashboard

**Mobile:**
- Tap hamburger menu (☰)
- Scroll to "🛡️ Admin Panel"
- Tap to open Admin Dashboard

---

## 🎮 WHAT PLAYERS SEE

### Published Game (Normal)
```
┌─────────────────────────────────────┐
│                                     │
│  [Chest Image]                      │
│                                     │
│  Fishing Chest                      │
│  Price: 1000 WL                     │
│                                     │
│  [BUKA SEKARANG]  ← Clickable       │
└─────────────────────────────────────┘
```

### Unpublished Game (Maintenance)
```
┌─────────────────────────────────────┐
│ 🔧 Maintenance                      │
│                                     │
│  [Chest Image - Faded]              │
│                                     │
│  Fishing Chest                      │
│  Price: 1000 WL                     │
│                                     │
│  [BUKA SEKARANG]  ← Disabled        │
└─────────────────────────────────────┘
```

---

## 👨‍💼 ADMIN FEATURES

### Admin Button Location

**Desktop (Transparent):**
```
Logo | Navigation Links | [🛡️ Admin] User Logout
                          ↑ Yellow when active
```

**Desktop (Scrolled):**
```
Logo | Navigation Links | [🛡️ Admin] User Logout
                          ↑ Red when active
```

**Mobile Menu:**
```
☰ Menu
├─ 🏠 Home
├─ 🎮 Case Opening
├─ 🏆 Roda Hadiah
├─ ⚙️ Crash Game
├─ 👤 Dashboard
├─ 🛡️ Admin Panel  ← NEW
└─ [Logout]
```

---

## 📋 GAME PUBLISHING FIELDS

### All Games Have:
```json
{
  "id": "fishing",
  "name": "Fishing Chest",
  "price": 1000,
  "published": true,  // ← NEW: Control availability
  "icon": "🎣",
  "color": "from-cyan-500 to-blue-600",
  "background": "...",
  "image": "/images/fishing_chest.png",
  "items": [...]
}
```

---

## 🎯 COMMON TASKS

### Task 1: Put a Game in Maintenance
1. Open `src/data/case_opening.json`
2. Find the chest you want to disable
3. Change `"published": true` to `"published": false`
4. Save file
5. Game now shows maintenance badge

### Task 2: Restore a Game
1. Open `src/data/case_opening.json`
2. Find the chest you want to enable
3. Change `"published": false` to `"published": true`
4. Save file
5. Game is now playable

### Task 3: Access Admin Panel
1. Login as admin user
2. Look for "🛡️ Admin" button in navbar
3. Click to open Admin Dashboard
4. Make changes as needed

---

## 🔍 TROUBLESHOOTING

### Admin Button Not Showing?
- ✅ Make sure you're logged in as staff user
- ✅ Check `is_staff: true` in user profile
- ✅ Refresh page if needed

### Game Still Playable After Setting published: false?
- ✅ Clear browser cache
- ✅ Rebuild: `npm run build`
- ✅ Refresh page

### Maintenance Badge Not Showing?
- ✅ Check JSON syntax is correct
- ✅ Make sure `published: false` is set
- ✅ Refresh page

---

## 📊 GAMES WITH PUBLISHED FIELD

All 9 chests now have `published` field:

1. ✅ Fishing Chest - `published: true`
2. ✅ Farm Chest - `published: true`
3. ✅ Newbie Chest - `published: true`
4. ✅ Lock Chest - `published: true`
5. ✅ Citem Chest - `published: true`
6. ✅ Legendary Chest - `published: true`
7. ✅ Space Chest - `published: true`
8. ✅ Ocean Chest - `published: true`
9. ✅ Dragon Chest - `published: true`

---

## 🎨 STYLING

### Unpublished Game Card
- Opacity: 60% (faded)
- Cursor: not-allowed
- Badge: "🔧 Maintenance" (red)
- Cannot click

### Admin Button
- Desktop: Red when active, gray when inactive
- Mobile: Red when active, gray when inactive
- Icon: ShieldCheck (🛡️)
- Text: "Admin" (desktop) or "Admin Panel" (mobile)

---

## 🚀 DEPLOYMENT

```bash
# Build
npm run build

# Test locally
npm run dev

# Deploy to Vercel
vercel --prod
```

---

## ✅ CHECKLIST

- [x] Game publishing field added
- [x] Admin button in navbar
- [x] Maintenance badge shows
- [x] Unpublished games disabled
- [x] Admin-only access
- [x] Responsive design
- [x] Build successful

---

## 📞 NEED HELP?

See full documentation:
- `GAME_PUBLISH_ADMIN_NAVBAR_UPDATE.md` - Complete guide
- `src/data/case_opening.json` - Game data
- `src/components/ResponsiveNavbar.tsx` - Admin button code
- `src/components/CaseOpeningGame.tsx` - Published check code

**Everything is ready to use!** 🎉
