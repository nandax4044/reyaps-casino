# 🔄 PERSISTENT AFK FISHING SYSTEM

## 🎯 FITUR BARU:

AFK Fishing sekarang **PERSISTENT** - akan tetap berjalan walaupun:
- ✅ Server restart (Vercel update)
- ✅ Push ke GitHub (auto deploy)
- ✅ Server crash dan restart
- ✅ Maintenance

## 🚀 CARA KERJA:

### 1. **Saat Start Fishing**:
- State disimpan ke database (`afk_fishing_sessions`)
- Data yang disimpan:
  - User ID
  - Username
  - Rod yang digunakan
  - Waktu mulai
  - Status aktif
  - Last heartbeat

### 2. **Saat Fishing Berjalan**:
- Setiap catch, update heartbeat ke database
- Heartbeat = tanda server masih hidup

### 3. **Saat Server Restart**:
- Server otomatis load semua session aktif dari database
- Resume fishing untuk setiap user
- Fishing dilanjutkan dengan rod yang sama

### 4. **Saat Stop Fishing**:
- Session dihapus dari database
- Fishing benar-benar berhenti

---

## 📝 SETUP (3 LANGKAH):

### LANGKAH 1: RUN SQL

1. Buka Supabase: https://supabase.com/dashboard
2. Project: **rwngqiakigebtwxohiri**
3. SQL Editor → New Query
4. Copy paste isi file: **ADD_PERSISTENT_AFK.sql**
5. Run

**HARUS MUNCUL**:
```
✅ Table afk_fishing_sessions created/verified
✅ RLS policies configured
✅ Permissions granted
✅ PERSISTENT AFK FISHING SYSTEM READY!
```

---

### LANGKAH 2: RESTART SERVER

```bash
# Stop server (Ctrl+C)
npm run dev:no-watch
```

**HARUS MUNCUL**:
```
[SERVER RUNNING] Full-stack Server successfully started on http://0.0.0.0:3000
[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...
[AFK-FISHING] No active sessions to resume
```

---

### LANGKAH 3: TEST

#### Test 1: Start Fishing
1. Login dan start AFK fishing
2. Cek console: `[AFK-FISHING] Session saved to database for nanddev`

#### Test 2: Restart Server
1. Stop server (Ctrl+C)
2. Start server lagi: `npm run dev:no-watch`
3. **Cek console**:
```
[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...
[AFK-FISHING] Found 1 active session(s) to resume
[AFK-FISHING] Resuming fishing for nanddev with ez_rod
[AFK-FISHING] ✅ Successfully resumed fishing for nanddev
[AFK-FISHING] ✅ Session resume complete
```

#### Test 3: Verify Fishing Continues
1. Tunggu 10-12 detik
2. Cek console: Harus ada `✅✅✅ Caught ...`
3. Fishing berjalan normal!

---

## 🔍 MONITORING:

### Cek Active Sessions di Database:

```sql
SELECT 
  username,
  equipped_rod,
  is_active,
  started_at,
  last_heartbeat,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat))/60 as minutes_since_heartbeat
FROM afk_fishing_sessions
WHERE is_active = true
ORDER BY last_heartbeat DESC;
```

**Expected Output**:
```
username | equipped_rod | is_active | started_at | last_heartbeat | minutes_since_heartbeat
---------|--------------|-----------|------------|----------------|------------------------
nanddev  | ez_rod       | true      | 14:30:00   | 14:35:12       | 0.2
```

---

## 🛡️ SAFETY FEATURES:

### 1. **Stale Session Detection**
- Jika heartbeat > 5 menit, session dianggap stale
- Session stale otomatis di-mark inactive
- Tidak akan di-resume

### 2. **Access Validation**
- Saat resume, cek apakah user masih punya fishing access
- Jika tidak, session tidak di-resume

### 3. **Rod Validation**
- Saat resume, cek apakah user masih punya akses ke rod
- Jika tidak, session tidak di-resume

---

## 📊 FLOW DIAGRAM:

```
START FISHING
    ↓
Save to Database (afk_fishing_sessions)
    ↓
Fishing Loop Running
    ↓ (every catch)
Update Heartbeat
    ↓
[SERVER RESTART]
    ↓
Load Active Sessions from Database
    ↓
Validate Access & Rod
    ↓
Resume Fishing Loop
    ↓
Continue Fishing!
```

---

## 🎯 BENEFITS:

### Before (Non-Persistent):
```
Start Fishing → Server Restart → ❌ Fishing STOP
User harus start fishing lagi manual
```

### After (Persistent):
```
Start Fishing → Server Restart → ✅ Fishing CONTINUE
Otomatis resume, user tidak perlu apa-apa!
```

---

## 🔧 TECHNICAL DETAILS:

### Database Table: `afk_fishing_sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User yang fishing (unique) |
| username | TEXT | Username untuk logging |
| equipped_rod | TEXT | Rod yang digunakan |
| is_active | BOOLEAN | Status aktif/tidak |
| started_at | TIMESTAMPTZ | Kapan mulai fishing |
| last_heartbeat | TIMESTAMPTZ | Last update (untuk detect stale) |
| created_at | TIMESTAMPTZ | Kapan record dibuat |
| updated_at | TIMESTAMPTZ | Last update |

### Code Changes:

1. **afk-fishing-worker.ts**:
   - `startAFKFishing()`: Save session to database
   - `stopAFKFishing()`: Remove session from database
   - `resumeActiveSessions()`: Load and resume sessions
   - Heartbeat update in fishing loop

2. **server.ts**:
   - Call `resumeActiveSessions()` on server start
   - Wait 2 seconds for server to initialize

---

## ❌ TROUBLESHOOTING:

### Problem: Session tidak di-resume setelah restart

**Cek 1**: Apakah session ada di database?
```sql
SELECT * FROM afk_fishing_sessions WHERE is_active = true;
```

**Cek 2**: Apakah heartbeat masih fresh?
```sql
SELECT 
  username,
  EXTRACT(EPOCH FROM (NOW() - last_heartbeat))/60 as minutes_ago
FROM afk_fishing_sessions
WHERE is_active = true;
```
Jika > 5 menit, session dianggap stale.

**Cek 3**: Apakah console menunjukkan resume?
```
[AFK-FISHING] 🔄 Checking for active fishing sessions to resume...
[AFK-FISHING] Found X active session(s) to resume
```

---

### Problem: Fishing stop setelah beberapa menit

**Penyebab**: Heartbeat tidak update (mungkin error di catch function)

**Solusi**: Cek console untuk error saat catch

---

### Problem: Multiple sessions untuk 1 user

**Penyebab**: Constraint unique tidak bekerja

**Solusi**: 
```sql
DELETE FROM afk_fishing_sessions 
WHERE user_id = 'user_id_here' 
AND id NOT IN (
  SELECT id FROM afk_fishing_sessions 
  WHERE user_id = 'user_id_here' 
  ORDER BY created_at DESC 
  LIMIT 1
);
```

---

## 🎉 SUMMARY:

**Sebelum**:
- ❌ Server restart = fishing stop
- ❌ User harus start manual lagi
- ❌ Kehilangan progress

**Sesudah**:
- ✅ Server restart = fishing continue
- ✅ Otomatis resume
- ✅ Zero downtime untuk user

---

## 📁 FILES:

- **PERSISTENT_AFK_GUIDE.md** ← File ini
- **ADD_PERSISTENT_AFK.sql** ← SQL untuk setup
- **afk-fishing-worker.ts** ← Updated dengan persistence
- **server.ts** ← Updated dengan auto-resume

---

**JALANKAN SQL DAN RESTART SERVER UNTUK AKTIFKAN FITUR INI! 🔄**
