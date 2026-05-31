# 🎮 Published Feature - Game Maintenance Mode

## 📋 Overview

Fitur ini memungkinkan admin untuk mematikan/menyalakan game tertentu tanpa perlu deploy ulang. Ketika game di-set `published: false`, maka akan muncul notifikasi "Game Sedang Dalam Perbaikan".

---

## 🎯 Cara Kerja

### 1. **Roda Hadiah (Wheel Game)**

#### File: `src/data/roda.json`
```json
{
  "published": true,  // ← Set false untuk maintenance mode
  "prizes": [
    // ... prize data
  ],
  "settings": {
    // ... settings
  }
}
```

#### Behavior:
- **`published: true`** → Game bisa dimainkan normal ✅
- **`published: false`** → Muncul notifikasi maintenance 🔧

#### Notifikasi Maintenance:
```
🔧
Roda Hadiah Sedang Dalam Perbaikan

Roda Hadiah sedang dalam pemeliharaan. 
Silakan coba lagi nanti atau mainkan game lain.

ℹ️ Hubungi admin jika Anda memiliki pertanyaan
```

---

### 2. **Case Opening Game**

#### File: `src/data/case_opening.json`
```json
{
  "published": true,  // ← Set false untuk maintenance mode
  "chests": [
    // ... chest data
  ]
}
```

#### Behavior:
- **`published: true`** → Game bisa dimainkan normal ✅
- **`published: false`** → Muncul notifikasi maintenance 🔧

---

### 3. **Crash Game**

#### File: `src/data/permainan.json`
```json
{
  "published": true,  // ← Set false untuk maintenance mode
  // ... game settings
}
```

#### Behavior:
- **`published: true`** → Game bisa dimainkan normal ✅
- **`published: false`** → Muncul notifikasi maintenance 🔧

---

## 🔧 Implementasi Technical

### Frontend (App.tsx)

#### 1. State Management
```typescript
const [wheelPublished, setWheelPublished] = useState<boolean>(true);
```

#### 2. Load Config
```typescript
const loadWheelConfig = async () => {
  const data = await API.getGameConfig('wheel');
  
  // Check published status
  if (data.published !== undefined) {
    setWheelPublished(data.published);
  }
  
  // Load prizes
  const apiPrizes = data.prizes || data;
  if (Array.isArray(apiPrizes) && apiPrizes.length > 0) {
    setPrizes(apiPrizes);
  }
};
```

#### 3. Conditional Rendering
```typescript
{activeGame === 'wheel' && (
  (() => {
    const isWheelPublished = wheelPublished !== false;

    if (!isWheelPublished) {
      return (
        <div className="maintenance-message">
          🔧 Game Sedang Dalam Perbaikan
        </div>
      );
    }

    return (
      <div className="game-content">
        {/* Normal game UI */}
      </div>
    );
  })()
)}
```

---

## 📝 Cara Menggunakan

### Untuk Admin:

#### 1. **Matikan Game (Maintenance Mode)**
Edit file JSON yang sesuai:
```json
{
  "published": false,  // ← Ubah ke false
  // ... rest of config
}
```

#### 2. **Nyalakan Game Kembali**
Edit file JSON yang sesuai:
```json
{
  "published": true,  // ← Ubah ke true
  // ... rest of config
}
```

#### 3. **Update via Admin Dashboard**
- Login sebagai admin
- Buka Admin Dashboard
- Edit game config
- Set `published: true/false`
- Save changes

---

## 🎨 UI Maintenance Message

### Design:
```
┌─────────────────────────────────────┐
│                                     │
│              🔧                     │
│                                     │
│   [Game Name] Sedang Dalam          │
│         Perbaikan                   │
│                                     │
│   [Game Name] sedang dalam          │
│   pemeliharaan. Silakan coba        │
│   lagi nanti atau mainkan           │
│   game lain.                        │
│                                     │
│   ┌───────────────────────────┐    │
│   │ ℹ️ Hubungi admin jika     │    │
│   │    Anda memiliki          │    │
│   │    pertanyaan             │    │
│   └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Styling:
- Background: Centered, padded
- Icon: 🔧 (text-6xl)
- Title: font-black, text-2xl, white
- Description: text-slate-400, text-sm
- Info box: bg-blue-500/10, border-blue-500/30

---

## 🧪 Testing

### Test Case 1: Wheel Game Maintenance
1. Set `roda.json` → `"published": false`
2. Reload page
3. Click "Roda Hadiah" button
4. ✅ Should show maintenance message
5. ❌ Should NOT show wheel game

### Test Case 2: Wheel Game Active
1. Set `roda.json` → `"published": true`
2. Reload page
3. Click "Roda Hadiah" button
4. ✅ Should show wheel game
5. ❌ Should NOT show maintenance message

### Test Case 3: Case Opening Maintenance
1. Set `case_opening.json` → `"published": false`
2. Reload page
3. Click "Buka Case" button
4. ✅ Should show maintenance message
5. ❌ Should NOT show case opening game

### Test Case 4: Crash Game Maintenance
1. Set `permainan.json` → `"published": false`
2. Reload page
3. Click "Crash Game" button
4. ✅ Should show maintenance message
5. ❌ Should NOT show crash game

---

## 📁 Files Modified

### JSON Config Files:
1. ✅ `src/data/roda.json` - Added `"published": true`
2. ✅ `src/data/case_opening.json` - Added `"published": true`
3. ✅ `src/data/permainan.json` - Already has `"published": true`

### Frontend Files:
1. ✅ `src/App.tsx` - Added wheelPublished state and logic

---

## 🚀 Benefits

### 1. **No Deployment Required**
- Admin bisa matikan game tanpa deploy ulang
- Cukup edit JSON file di database/admin panel

### 2. **User-Friendly**
- User dapat notifikasi jelas
- Tidak ada error message yang membingungkan

### 3. **Flexible**
- Bisa matikan game tertentu saja
- Game lain tetap bisa dimainkan

### 4. **Professional**
- Maintenance message yang clean
- Consistent dengan design system

---

## ⚠️ Important Notes

### Default Value:
- Jika `published` tidak ada di JSON → Default `true` (game aktif)
- Jika `published: undefined` → Default `true` (game aktif)
- Hanya `published: false` yang trigger maintenance mode

### Backward Compatibility:
- JSON lama tanpa field `published` tetap berfungsi normal
- Tidak break existing functionality

### Admin Dashboard:
- Admin bisa edit `published` field via dashboard
- Changes langsung apply setelah save

---

## 🔄 Future Improvements

### 1. **Scheduled Maintenance**
```json
{
  "published": true,
  "maintenance": {
    "scheduled": true,
    "startTime": "2026-06-01T00:00:00Z",
    "endTime": "2026-06-01T06:00:00Z",
    "message": "Maintenance terjadwal: 1 Juni 2026, 00:00 - 06:00 WIB"
  }
}
```

### 2. **Custom Maintenance Message**
```json
{
  "published": false,
  "maintenanceMessage": {
    "title": "Update Besar Sedang Berlangsung",
    "description": "Kami sedang menambahkan hadiah baru yang lebih menarik!",
    "estimatedTime": "2 jam"
  }
}
```

### 3. **Partial Maintenance**
```json
{
  "published": true,
  "features": {
    "spin": true,
    "settings": false,
    "history": true
  }
}
```

---

## 📊 Status

- ✅ Roda Hadiah (Wheel Game) - IMPLEMENTED
- ✅ Case Opening - IMPLEMENTED
- ✅ Crash Game - ALREADY IMPLEMENTED
- ✅ Maintenance UI - IMPLEMENTED
- ✅ Documentation - COMPLETED

---

**Date**: 31 Mei 2026
**Feature**: Published/Maintenance Mode
**Status**: ✅ COMPLETED
