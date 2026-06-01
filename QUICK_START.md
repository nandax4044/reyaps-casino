# 🚀 QUICK START - FIX FISHING SYSTEM

## ⚡ 3 LANGKAH CEPAT

### 1️⃣ RUN SQL FIX
```
1. Buka: https://supabase.com/dashboard
2. Pilih project: rwngqiakigebtwxohiri
3. Klik: SQL Editor → New Query
4. Copy paste isi file: FIX_RLS_POLICIES.sql
5. Klik: Run
6. Tunggu: "✅ RLS POLICIES FIXED!"
```

### 2️⃣ RESTART SERVER
```bash
# Stop server (Ctrl+C)
# Start dengan no-watch mode
npm run dev:no-watch
```

**PENTING**: Gunakan `dev:no-watch` bukan `dev`!

### 3️⃣ GRANT BAIT & TEST
```
1. Login admin: nanddev / nanda900
2. Admin Dashboard → Fishing Management → Bait Management
3. Grant 500 bait ke user
4. Cek console: harus ada "✅ Grant bait RPC success!"
5. Fishing AFK → Start fishing
6. Cek console: harus ada "✅✅✅ Caught ..."
```

---

## ✅ SUCCESS INDICATORS

### Console Log:
```
[ADMIN] ✅ Grant bait RPC success! New balance: 500
[AFK-FISHING] ✅✅✅ Caught Orca 45LB → +9 WL (Bait: 500 → 499)
```

### UI:
```
Balance: 0 → 9 → 18 → 27 ... ⬆️
Total Fish: 0 → 1 → 2 → 3 ... ⬆️
Bait: 500 → 499 → 498 → 497 ... ⬇️
```

---

## ❌ TROUBLESHOOTING

### Problem: Grant bait tidak ada success log
**Fix**: Ulangi langkah 1 (SQL fix)

### Problem: Fishing stop setelah beberapa detik
**Fix**: Gunakan `npm run dev:no-watch` (bukan `npm run dev`)

### Problem: Balance tidak naik
**Fix**: Cek console untuk error, ulangi langkah 1

### Problem: Bait tetap 0
**Fix**: Refresh page (F5), atau ulangi grant bait

---

## 📚 FULL DOCUMENTATION

Lihat file: **FISHING_FIX_COMPLETE.md** untuk panduan lengkap

---

## 🆘 NEED HELP?

Cek console log untuk error details:
- ❌ = Error (ada masalah)
- ✅ = Success (berjalan normal)
- ⚠️ = Warning (perlu perhatian)

Semua log dimulai dengan:
- `[ADMIN]` = Admin operations
- `[AFK-FISHING]` = Fishing worker
- `[CONFIG]` = Configuration loading
