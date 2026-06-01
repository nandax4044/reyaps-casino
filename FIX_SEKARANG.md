# 🚨 FIX FUNCTION OVERLOAD - JALANKAN SEKARANG!

## ❌ ERROR:
```
Could not choose the best candidate function between:
- increment_fishing_saldo(p_user_id => uuid, p_amount => integer)
- increment_fishing_saldo(p_user_id => uuid, p_amount => numeric)
```

## ✅ SOLUSI (2 LANGKAH):

### LANGKAH 1: RUN SQL FIX

1. Buka Supabase Dashboard: https://supabase.com/dashboard
2. Project: **rwngqiakigebtwxohiri**
3. SQL Editor → New Query
4. Copy paste SQL berikut:

```sql
-- Drop all versions of increment_fishing_saldo
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount INTEGER);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount NUMERIC);
DROP FUNCTION IF EXISTS increment_fishing_saldo(p_user_id UUID, p_amount DECIMAL);

-- Create the correct version (using INTEGER)
CREATE OR REPLACE FUNCTION increment_fishing_saldo(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE user_fishing_inventory
  SET fishing_saldo = fishing_saldo + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_fishing_saldo(UUID, INTEGER) TO service_role;
```

5. Klik **Run**
6. **VERIFY**: Harus success tanpa error

---

### LANGKAH 2: RESTART SERVER

```bash
# Stop server (Ctrl+C)
npm run dev:no-watch
```

---

### LANGKAH 3: TEST FISHING

Fishing sudah berjalan, jadi:
1. Buka Fishing AFK page
2. **Cek console**: Harus ada `✅✅✅ Caught ...` (TIDAK ada ❌)
3. **Cek UI**: Balance harus naik!

---

## ✅ SUCCESS INDICATORS:

**Console Log (HARUS ADA)**:
```
[AFK-FISHING] user_id: 💰 Updating balance (+23 WL)...
[AFK-FISHING] user_id: ✅ Balance updated
[AFK-FISHING] user_id: 🐟 Incrementing fish count...
[AFK-FISHING] user_id: ✅ Fish count incremented
[AFK-FISHING] user_id: 🪱 Decreasing bait (700 → 699)...
[AFK-FISHING] user_id: ✅ Bait decreased
[AFK-FISHING] user_id: ✅✅✅ Caught Orca 118LB → +23 WL (Bait: 700 → 699)
```

**UI Display**:
```
Balance: 0 → 23 → 61 → 99 ... (NAIK!)
Total Fish: 0 → 1 → 2 → 3 ... (NAIK!)
Bait: 700 → 699 → 698 → 697 ... (TURUN!)
```

---

## 🎯 KENAPA ERROR INI TERJADI?

Ada 2 versi function dengan parameter berbeda:
- `increment_fishing_saldo(UUID, INTEGER)` ← Yang benar
- `increment_fishing_saldo(UUID, NUMERIC)` ← Yang lama

PostgreSQL tidak tahu mana yang harus dipanggil (function overloading ambiguity).

**Solusi**: Drop semua versi, buat ulang yang benar dengan INTEGER.

---

## 📝 AFTER FIX:

Setelah fix ini, fishing akan:
- ✅ Catch fish (sudah berhasil)
- ✅ Insert fish record (sudah berhasil)
- ✅ Update balance (AKAN BERHASIL setelah fix ini)
- ✅ Increment fish count (AKAN BERHASIL setelah fix ini)
- ✅ Decrease bait (AKAN BERHASIL setelah fix ini)

---

**JALANKAN SQL DI ATAS SEKARANG! 🚀**

**File SQL**: `FIX_FUNCTION_OVERLOAD.sql` (atau copy paste dari atas)
