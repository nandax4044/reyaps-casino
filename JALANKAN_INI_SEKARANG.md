# ⚡ JALANKAN INI SEKARANG - FIX BAIT_COUNT ERROR

## 🚨 ERROR YANG TERJADI
```
Gagal memberikan akses: Failed to grant fishing access: 
column "bait_count" of relation "user_fishing_inventory" does not exist
```

## ✅ SOLUSI CEPAT (2 MENIT)

### LANGKAH 1: Buka Supabase (30 detik)
1. Buka browser
2. Login ke https://supabase.com
3. Pilih project Anda
4. Klik **SQL Editor** di sidebar kiri

### LANGKAH 2: Jalankan SQL (1 menit)
1. Copy **SEMUA ISI** file: `FIX_BAIT_COUNT_FINAL.sql`
2. Paste ke SQL Editor
3. Klik tombol **RUN** (atau tekan Ctrl+Enter)
4. Tunggu sampai selesai

### LANGKAH 3: Verifikasi (30 detik)
Harus muncul pesan:
```
✅ Column bait_balance EXISTS
✅ Function grant_bait EXISTS
✅ Trigger create_fishing_inventory_on_access EXISTS
🎉 ALL CHECKS PASSED!
```

### LANGKAH 4: Test (30 detik)
1. Buka website Anda
2. Login sebagai admin
3. Admin Dashboard → Fishing Management
4. Grant fishing access ke user
5. ✅ **HARUS BERHASIL TANPA ERROR!**

---

## 🔥 JIKA MASIH ERROR

### Error: "relation user_fishing_inventory does not exist"

**Jalankan ini di SQL Editor:**
```sql
CREATE TABLE IF NOT EXISTS user_fishing_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bait_balance INTEGER DEFAULT 0 NOT NULL,
  fishing_saldo INTEGER DEFAULT 0 NOT NULL,
  total_fish_caught INTEGER DEFAULT 0 NOT NULL,
  equipped_rod TEXT DEFAULT 'ez_rod',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_fishing_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_fishing_inventory_select ON user_fishing_inventory 
  FOR SELECT USING (TRUE);

CREATE POLICY user_fishing_inventory_insert ON user_fishing_inventory 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY user_fishing_inventory_update ON user_fishing_inventory 
  FOR UPDATE USING (TRUE);

GRANT ALL ON user_fishing_inventory TO service_role;
```

Lalu jalankan `FIX_BAIT_COUNT_FINAL.sql` lagi.

### Error: "relation bait_transactions does not exist"

**Jalankan ini di SQL Editor:**
```sql
CREATE TABLE IF NOT EXISTS bait_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('grant', 'deduct', 'refund')),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bait_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY bait_transactions_select ON bait_transactions 
  FOR SELECT USING (TRUE);

CREATE POLICY bait_transactions_insert ON bait_transactions 
  FOR INSERT WITH CHECK (TRUE);

GRANT ALL ON bait_transactions TO service_role;
```

Lalu jalankan `FIX_BAIT_COUNT_FINAL.sql` lagi.

---

## 📞 MASIH ERROR?

**Screenshot dan kirim:**
1. Error message lengkap
2. Screenshot dari Supabase SQL Editor setelah run
3. Screenshot dari browser console (F12)

---

## ✅ CHECKLIST

- [ ] Buka Supabase SQL Editor
- [ ] Copy FIX_BAIT_COUNT_FINAL.sql
- [ ] Paste & Run
- [ ] Lihat pesan sukses
- [ ] Test grant fishing access
- [ ] Berhasil tanpa error!

---

**TOTAL WAKTU: 2-3 MENIT**

**FILE YANG HARUS DIJALANKAN:** `FIX_BAIT_COUNT_FINAL.sql`

**JANGAN SKIP LANGKAH INI!** Ini adalah solusi final yang pasti berhasil.
