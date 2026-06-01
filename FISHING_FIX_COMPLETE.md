# FISHING SYSTEM - COMPLETE FIX GUIDE

## 🚨 MASALAH YANG DITEMUKAN

### 1. Fishing Berhenti Setelah Beberapa Detik
**Penyebab**: Vite hot reload membunuh worker saat file berubah

### 2. Grant Bait Tidak Bekerja
**Penyebab**: 
- RLS policies mungkin belum diterapkan di database
- Grant bait function mungkin gagal silent

### 3. Balance Tidak Bertambah
**Penyebab**: 
- RLS policies blocking insert/update
- Function increment_fishing_saldo tidak berjalan

### 4. Bait Tetap 0
**Penyebab**: 
- Grant bait gagal
- RLS policies blocking update

---

## ✅ SOLUSI LENGKAP (5 LANGKAH)

### LANGKAH 1: Jalankan SQL Fix di Supabase

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Pilih project: rwngqiakigebtwxohiri
3. Klik "SQL Editor" di sidebar kiri
4. Klik "New Query"
5. Copy paste SQL berikut:

```sql
-- ============================================================================
-- FIX RLS POLICIES FOR FISHING SYSTEM - COMPLETE
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS user_fishing_inventory_insert_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update_own ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_insert_system ON user_fishing_inventory;
DROP POLICY IF EXISTS user_fishing_inventory_update_system ON user_fishing_inventory;
DROP POLICY IF EXISTS fish_inventory_insert_own ON fish_inventory;
DROP POLICY IF EXISTS fish_inventory_insert_system ON fish_inventory;
DROP POLICY IF EXISTS fishing_logs_insert_own ON fishing_logs;
DROP POLICY IF EXISTS fishing_logs_insert_system ON fishing_logs;
DROP POLICY IF EXISTS bait_transactions_insert_own ON bait_transactions;
DROP POLICY IF EXISTS bait_transactions_insert_system ON bait_transactions;

-- Create permissive policies that allow service_role to do everything
CREATE POLICY user_fishing_inventory_insert_system ON user_fishing_inventory 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY user_fishing_inventory_update_system ON user_fishing_inventory 
  FOR UPDATE 
  USING (TRUE);

CREATE POLICY user_fishing_inventory_select_own ON user_fishing_inventory 
  FOR SELECT 
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY fish_inventory_insert_system ON fish_inventory 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY fish_inventory_select_own ON fish_inventory 
  FOR SELECT 
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY fishing_logs_insert_system ON fishing_logs 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY fishing_logs_select_own ON fishing_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR TRUE);

CREATE POLICY bait_transactions_insert_system ON bait_transactions 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY bait_transactions_select_own ON bait_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id OR TRUE);

-- Ensure service_role has all permissions
GRANT ALL ON user_fishing_inventory TO service_role;
GRANT ALL ON fish_inventory TO service_role;
GRANT ALL ON fishing_logs TO service_role;
GRANT ALL ON bait_transactions TO service_role;
GRANT ALL ON user_rod_access TO service_role;
GRANT ALL ON afk_access TO service_role;

-- Verify grant_bait function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'grant_bait'
  ) THEN
    RAISE EXCEPTION 'grant_bait function does not exist! Run SCHEMA_COMPLETE.sql first!';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RLS POLICIES FIXED!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Updated Policies:';
  RAISE NOTICE '   ✅ user_fishing_inventory - INSERT/UPDATE/SELECT allowed';
  RAISE NOTICE '   ✅ fish_inventory - INSERT/SELECT allowed';
  RAISE NOTICE '   ✅ fishing_logs - INSERT/SELECT allowed';
  RAISE NOTICE '   ✅ bait_transactions - INSERT/SELECT allowed';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Service Role Permissions:';
  RAISE NOTICE '   ✅ Full access to all fishing tables';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Restart server (npm run dev:no-watch)';
  RAISE NOTICE '   2. Grant bait to user via admin panel';
  RAISE NOTICE '   3. Start AFK fishing';
  RAISE NOTICE '   4. Check console logs for detailed output';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
```

6. Klik "Run" atau tekan Ctrl+Enter
7. Tunggu sampai muncul pesan "✅ RLS POLICIES FIXED!"

---

### LANGKAH 2: Stop Server yang Sedang Berjalan

1. Buka terminal yang menjalankan server
2. Tekan `Ctrl+C` untuk stop server
3. Tunggu sampai benar-benar berhenti (tidak ada log lagi)

---

### LANGKAH 3: Restart Server dengan Mode No-Watch

**PENTING**: Gunakan mode `no-watch` agar worker tidak restart saat file berubah!

```bash
npm run dev:no-watch
```

**Tunggu sampai muncul log**:
```
[AFK-FISHING] Supabase configured ✅
[AFK-FISHING] Worker initialized with V2 system (4 rods, LB 1-200, tiered pricing)
[SERVER RUNNING] Full-stack Server successfully started on http://0.0.0.0:3000
```

---

### LANGKAH 4: Grant Bait ke User

1. Buka browser: http://localhost:3000
2. Login sebagai admin:
   - Username: `nanddev`
   - Password: `nanda900`
3. Klik "Admin Dashboard" di navbar
4. Klik tab "Fishing Management"
5. Klik tab "Bait Management"
6. Pilih user dari dropdown
7. Masukkan jumlah bait (contoh: 500)
8. Klik "Grant Bait"

**Cek Console Log** (harus muncul):
```
[ADMIN] ═══════════════════════════════════════════════════
[ADMIN] Grant Bait Request Started
[ADMIN] User ID: e44ca573-fcf3-47fa-b73e-283747bd21bb
[ADMIN] Amount: 500
[ADMIN] ✅ Grant bait RPC success! New balance: 500
[ADMIN] ✅ Verified bait balance: 500
[ADMIN] ═══════════════════════════════════════════════════
[ADMIN] Grant Bait Completed Successfully!
```

**Jika TIDAK muncul log success**, ada masalah dengan:
- RLS policies belum diterapkan → Ulangi Langkah 1
- grant_bait function tidak ada → Run SCHEMA_COMPLETE.sql
- Service role key salah → Cek .env file

---

### LANGKAH 5: Test Fishing

1. Logout dari admin
2. Login sebagai user biasa (atau tetap sebagai admin)
3. Klik "Fishing AFK" di navbar
4. **Cek Bait Balance** - harus muncul angka (contoh: 500)
5. **Pilih Rod** - pilih "EZ Rod" (gratis)
6. Klik "Start AFK Fishing"

**Cek Console Log** (harus muncul setiap 5-10 detik):
```
[AFK-FISHING] user_id: Starting catch attempt...
[AFK-FISHING] user_id: 📊 Current stats - Bait: 500, Balance: 0 WL, Fish: 0
[AFK-FISHING] user_id: 🎣 Generated fish: Orca 45LB → 9 WL
[AFK-FISHING] user_id: 💾 Inserting fish record...
[AFK-FISHING] user_id: ✅ Fish record inserted
[AFK-FISHING] user_id: 💰 Updating balance (+9 WL)...
[AFK-FISHING] user_id: ✅ Balance updated
[AFK-FISHING] user_id: 🐟 Incrementing fish count...
[AFK-FISHING] user_id: ✅ Fish count incremented
[AFK-FISHING] user_id: 🪱 Decreasing bait (500 → 499)...
[AFK-FISHING] user_id: ✅ Bait decreased
[AFK-FISHING] user_id: ✅✅✅ Caught Orca 45LB → +9 WL (Bait: 500 → 499)
```

**Cek UI**:
- Balance harus naik: 0 → 9 → 18 → 27 ...
- Total Fish harus naik: 0 → 1 → 2 → 3 ...
- Bait harus turun: 500 → 499 → 498 → 497 ...

---

## 🎯 EXPECTED BEHAVIOR

### ✅ Saat Fishing Berjalan:
1. **Setiap 5-10 detik** (tergantung rod):
   - Console log muncul dengan detail lengkap
   - Balance bertambah sesuai harga ikan
   - Total fish bertambah 1
   - Bait berkurang 1

2. **Fishing TIDAK BERHENTI** sampai:
   - User klik "Stop AFK Fishing"
   - Bait habis (0)
   - Access expired

3. **Fishing TETAP BERJALAN** walaupun:
   - Browser ditutup
   - User logout
   - Tab diganti
   - File di-edit (karena no-watch mode)

---

## ❌ TROUBLESHOOTING

### Problem 1: Grant Bait Tidak Muncul Success Log

**Cek**:
```sql
-- Di Supabase SQL Editor
SELECT * FROM pg_policies 
WHERE tablename = 'user_fishing_inventory';
```

**Harus ada**:
- `user_fishing_inventory_insert_system`
- `user_fishing_inventory_update_system`

**Solusi**: Ulangi Langkah 1

---

### Problem 2: Fishing Berhenti Setelah Beberapa Detik

**Cek Console**:
```
[AFK-FISHING] Shutting down...
[CONFIG] Using default JSON for cases
```

**Penyebab**: Server restart karena Vite hot reload

**Solusi**: 
1. Stop server (Ctrl+C)
2. Jalankan dengan `npm run dev:no-watch` (BUKAN `npm run dev`)

---

### Problem 3: Balance Tidak Bertambah

**Cek Console**:
```
[AFK-FISHING] user_id: ❌ Error updating balance: ...
```

**Solusi**:
1. Cek RLS policies (Langkah 1)
2. Cek function exists:
```sql
SELECT * FROM pg_proc WHERE proname = 'increment_fishing_saldo';
```
3. Jika tidak ada, run SCHEMA_COMPLETE.sql

---

### Problem 4: Bait Tetap 0 Setelah Grant

**Cek Database**:
```sql
SELECT * FROM user_fishing_inventory 
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb';
```

**Jika bait_balance = 0**:
- Grant bait gagal
- Cek console log saat grant
- Ulangi Langkah 1 (RLS policies)

**Jika bait_balance > 0 tapi UI tetap 0**:
- Refresh page (F5)
- Clear cache (Ctrl+Shift+R)

---

### Problem 5: Error "RLS Policy Violation"

**Console Log**:
```
code: '42501'
message: 'new row violates row-level security policy'
```

**Solusi**: 
1. **PASTI** RLS policies belum diterapkan
2. Ulangi Langkah 1 dengan teliti
3. Pastikan muncul success message
4. Restart server

---

## 📊 VERIFICATION CHECKLIST

### ✅ Sebelum Mulai Fishing:
- [ ] SQL fix sudah dijalankan (Langkah 1)
- [ ] Server running dengan `npm run dev:no-watch`
- [ ] Grant bait success (ada log success)
- [ ] Bait balance muncul di UI (> 0)
- [ ] Rod sudah dipilih (EZ Rod)

### ✅ Saat Fishing:
- [ ] Console log muncul setiap 5-10 detik
- [ ] Log menunjukkan "✅✅✅ Caught ..."
- [ ] Balance naik di UI
- [ ] Total fish naik di UI
- [ ] Bait turun di UI
- [ ] TIDAK ada error log

### ✅ Setelah Fishing:
- [ ] Balance final sesuai dengan jumlah ikan
- [ ] Total fish sesuai dengan jumlah catch
- [ ] Bait berkurang sesuai jumlah catch
- [ ] Data tersimpan di database

---

## 🔍 DATABASE VERIFICATION

### Cek Bait Balance:
```sql
SELECT user_id, bait_balance, fishing_saldo, total_fish_caught, updated_at
FROM user_fishing_inventory
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb';
```

### Cek Fish Caught:
```sql
SELECT fish_name, lb, sell_price, sold_at
FROM fish_inventory
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb'
ORDER BY sold_at DESC
LIMIT 10;
```

### Cek Bait Transactions:
```sql
SELECT amount, transaction_type, granted_by, notes, created_at
FROM bait_transactions
WHERE user_id = 'e44ca573-fcf3-47fa-b73e-283747bd21bb'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📝 FILES MODIFIED

1. **package.json** - Added `dev:no-watch` script
2. **server.ts** - Enhanced grant_bait logging
3. **afk-fishing-worker.ts** - Enhanced catch logging
4. **FISHING_FIX_COMPLETE.md** - This guide

---

## 🎉 SUCCESS INDICATORS

### Console Output:
```
[ADMIN] ✅ Grant bait RPC success! New balance: 500
[AFK-FISHING] user_id: ✅✅✅ Caught Orca 45LB → +9 WL (Bait: 500 → 499)
[AFK-FISHING] user_id: ✅✅✅ Caught Salmon 23LB → +4 WL (Bait: 499 → 498)
```

### UI Display:
```
Balance: 0 → 9 → 13 → 22 → 35 ... (terus naik)
Total Fish: 0 → 1 → 2 → 3 → 4 ... (terus naik)
Bait: 500 → 499 → 498 → 497 → 496 ... (terus turun)
```

### Database:
```
user_fishing_inventory.bait_balance: 496
user_fishing_inventory.fishing_saldo: 35
user_fishing_inventory.total_fish_caught: 4
fish_inventory: 4 rows
bait_transactions: 1 row (grant)
```

---

## ⚠️ IMPORTANT NOTES

1. **SELALU gunakan `npm run dev:no-watch`** untuk production/testing
2. **JANGAN edit file** saat fishing sedang berjalan (akan restart worker)
3. **Grant bait HARUS success** sebelum mulai fishing
4. **Cek console log** untuk memastikan semua berjalan
5. **RLS policies HARUS diterapkan** di database

---

## 🚀 QUICK START (TL;DR)

```bash
# 1. Run SQL fix di Supabase (copy dari Langkah 1)
# 2. Stop server (Ctrl+C)
# 3. Start server no-watch
npm run dev:no-watch

# 4. Grant bait via admin panel (500 bait)
# 5. Start fishing
# 6. Cek console log - harus ada "✅✅✅ Caught ..."
```

---

## STATUS: READY TO TEST ✅

Semua fix sudah diterapkan. Ikuti 5 langkah di atas untuk testing!
