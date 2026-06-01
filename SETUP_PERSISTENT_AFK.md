# 🚀 SETUP PERSISTENT AFK - QUICK GUIDE

## ⚡ 3 LANGKAH CEPAT:

### 1️⃣ RUN SQL (2 MENIT)
```
1. Buka: https://supabase.com/dashboard
2. Project: rwngqiakigebtwxohiri
3. SQL Editor → New Query
4. Copy paste: ADD_PERSISTENT_AFK.sql
5. Run
6. Tunggu: ✅ PERSISTENT AFK FISHING SYSTEM READY!
```

### 2️⃣ RESTART SERVER (1 MENIT)
```bash
# Stop (Ctrl+C)
npm run dev:no-watch
```

**Tunggu muncul**:
```
[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...
```

### 3️⃣ TEST (3 MENIT)
```
1. Start AFK fishing
2. Cek console: "Session saved to database"
3. Restart server (Ctrl+C → npm run dev:no-watch)
4. Cek console: "Resuming fishing for..."
5. Tunggu 10 detik
6. Cek console: "✅✅✅ Caught ..."
7. SUCCESS! ✅
```

---

## ✅ FITUR BARU:

**AFK Fishing sekarang PERSISTENT!**

- ✅ Server restart → Fishing continue
- ✅ Vercel update → Fishing continue
- ✅ Push GitHub → Fishing continue
- ✅ Crash & restart → Fishing continue

**User tidak perlu start fishing lagi!**

---

## 🎯 CARA KERJA:

```
Start Fishing
    ↓
Save to Database
    ↓
[SERVER RESTART]
    ↓
Auto Resume from Database
    ↓
Fishing Continue!
```

---

## 📊 CEK STATUS:

### Di Console:
```
[AFK-FISHING] Session saved to database for nanddev
[AFK-FISHING] Resuming fishing for nanddev with ez_rod
[AFK-FISHING] ✅ Successfully resumed fishing for nanddev
```

### Di Database:
```sql
SELECT username, equipped_rod, is_active, last_heartbeat
FROM afk_fishing_sessions
WHERE is_active = true;
```

---

## 🔧 FILES:

- **SETUP_PERSISTENT_AFK.md** ← File ini (quick guide)
- **PERSISTENT_AFK_GUIDE.md** ← Panduan lengkap
- **ADD_PERSISTENT_AFK.sql** ← SQL untuk setup

---

**TOTAL WAKTU: 6 MENIT**

**MULAI SEKARANG! 🔄**
