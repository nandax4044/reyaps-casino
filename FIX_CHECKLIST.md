# ✅ FISHING SYSTEM FIX - CHECKLIST

Print atau buka file ini saat melakukan fix!

---

## 🔧 PREPARATION

- [ ] Buka terminal di folder project
- [ ] Buka browser ke https://supabase.com/dashboard
- [ ] Buka file `FIX_RLS_POLICIES.sql` di editor
- [ ] Siapkan console browser (F12)

---

## 📝 STEP 1: RUN SQL FIX

- [ ] Login ke Supabase Dashboard
- [ ] Pilih project: `rwngqiakigebtwxohiri`
- [ ] Klik "SQL Editor" di sidebar
- [ ] Klik "New Query"
- [ ] Copy seluruh isi file `FIX_RLS_POLICIES.sql`
- [ ] Paste ke SQL Editor
- [ ] Klik "Run" atau tekan Ctrl+Enter
- [ ] Tunggu sampai selesai
- [ ] **VERIFY**: Muncul pesan "✅ RLS POLICIES FIXED!"
- [ ] **VERIFY**: Muncul "✅ All required functions verified"

**Jika ada error**: Berarti function belum ada, run `SCHEMA_COMPLETE.sql` dulu!

---

## 🔄 STEP 2: RESTART SERVER

- [ ] Buka terminal yang menjalankan server
- [ ] Tekan `Ctrl+C` untuk stop server
- [ ] Tunggu sampai benar-benar berhenti (tidak ada log)
- [ ] Ketik: `npm run dev:no-watch`
- [ ] Tekan Enter
- [ ] Tunggu server start
- [ ] **VERIFY**: Muncul "[AFK-FISHING] Supabase configured ✅"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] Worker initialized with V2 system"
- [ ] **VERIFY**: Muncul "[SERVER RUNNING] Full-stack Server successfully started"

**PENTING**: Gunakan `dev:no-watch` BUKAN `dev`!

---

## 🎁 STEP 3: GRANT BAIT

- [ ] Buka browser: http://localhost:3000
- [ ] Login sebagai admin:
  - Username: `nanddev`
  - Password: `nanda900`
- [ ] Klik "Admin Dashboard" di navbar
- [ ] Klik tab "Fishing Management"
- [ ] Klik tab "Bait Management"
- [ ] Pilih user dari dropdown
- [ ] Masukkan jumlah bait: `500`
- [ ] Klik "Grant Bait"
- [ ] Buka console terminal (bukan browser)
- [ ] **VERIFY**: Muncul "═══════════════════════════════════════════════════"
- [ ] **VERIFY**: Muncul "[ADMIN] Grant Bait Request Started"
- [ ] **VERIFY**: Muncul "[ADMIN] ✅ Grant bait RPC success! New balance: 500"
- [ ] **VERIFY**: Muncul "[ADMIN] ✅ Verified bait balance: 500"
- [ ] **VERIFY**: Muncul "[ADMIN] Grant Bait Completed Successfully!"

**Jika TIDAK muncul success log**:
- [ ] Ulangi Step 1 (SQL fix)
- [ ] Restart server (Step 2)
- [ ] Coba grant bait lagi

---

## 🎣 STEP 4: TEST FISHING

- [ ] Di browser, klik "Fishing AFK" di navbar
- [ ] **VERIFY**: Bait Balance card muncul
- [ ] **VERIFY**: Bait Balance menunjukkan angka (contoh: 500)
- [ ] Pilih rod: "EZ Rod"
- [ ] **VERIFY**: EZ Rod ter-highlight (available)
- [ ] Klik "Start AFK Fishing"
- [ ] Tunggu 5-10 detik
- [ ] Buka console terminal
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: Starting catch attempt..."
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: 📊 Current stats - Bait: 500, Balance: 0 WL, Fish: 0"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: 🎣 Generated fish: ..."
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: ✅ Fish record inserted"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: ✅ Balance updated"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: ✅ Fish count incremented"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: ✅ Bait decreased"
- [ ] **VERIFY**: Muncul "[AFK-FISHING] user_id: ✅✅✅ Caught ... → +... WL (Bait: 500 → 499)"

---

## 📊 STEP 5: VERIFY UI UPDATES

Tunggu 30-60 detik (5-10 catch), lalu cek UI:

- [ ] **Balance**: Harus naik dari 0 → angka positif
- [ ] **Total Fish**: Harus naik dari 0 → angka positif
- [ ] **Bait Balance**: Harus turun dari 500 → angka lebih kecil
- [ ] **Console**: Terus muncul log catch setiap 5-10 detik
- [ ] **No Errors**: Tidak ada log dengan ❌

**Expected Values** (setelah 10 catch):
- Balance: ~50-100 WL (tergantung ikan)
- Total Fish: 10
- Bait: 490

---

## 🔍 STEP 6: VERIFY DATABASE

- [ ] Buka Supabase Dashboard
- [ ] Klik "Table Editor"
- [ ] Pilih table: `user_fishing_inventory`
- [ ] Cari row dengan user_id admin
- [ ] **VERIFY**: `bait_balance` turun (contoh: 490)
- [ ] **VERIFY**: `fishing_saldo` naik (contoh: 75)
- [ ] **VERIFY**: `total_fish_caught` naik (contoh: 10)
- [ ] Pilih table: `fish_inventory`
- [ ] Filter by user_id admin
- [ ] **VERIFY**: Ada banyak row (sesuai jumlah catch)
- [ ] **VERIFY**: Semua row punya `is_sold: true`
- [ ] **VERIFY**: Semua row punya `sell_price` > 0

---

## 🎯 STEP 7: TEST PERSISTENCE

- [ ] Tutup browser (tab fishing)
- [ ] Cek console terminal
- [ ] **VERIFY**: Log catch masih muncul setiap 5-10 detik
- [ ] Buka browser lagi
- [ ] Login dan buka Fishing AFK
- [ ] **VERIFY**: Balance sudah naik
- [ ] **VERIFY**: Total Fish sudah naik
- [ ] **VERIFY**: Bait sudah turun
- [ ] **VERIFY**: Fishing masih berjalan (status: Active)

---

## ✅ SUCCESS CRITERIA

Semua harus ✅:

- [ ] SQL fix berhasil (ada success message)
- [ ] Server running dengan no-watch mode
- [ ] Grant bait berhasil (ada success log)
- [ ] Fishing catch berhasil (ada ✅✅✅ log)
- [ ] Balance naik di UI
- [ ] Total Fish naik di UI
- [ ] Bait turun di UI
- [ ] Data tersimpan di database
- [ ] Fishing tetap jalan saat browser ditutup

---

## ❌ TROUBLESHOOTING

### Problem: SQL fix error "function does not exist"
**Solution**:
- [ ] Run `SCHEMA_COMPLETE.sql` di Supabase dulu
- [ ] Lalu run `FIX_RLS_POLICIES.sql` lagi

### Problem: Grant bait tidak ada success log
**Solution**:
- [ ] Cek apakah ada error log
- [ ] Ulangi Step 1 (SQL fix)
- [ ] Restart server (Step 2)
- [ ] Coba grant bait lagi

### Problem: Fishing stop setelah beberapa detik
**Solution**:
- [ ] Cek console: ada "[AFK-FISHING] Shutting down..."?
- [ ] Stop server (Ctrl+C)
- [ ] Pastikan gunakan `npm run dev:no-watch` (BUKAN `npm run dev`)
- [ ] Start server lagi

### Problem: Balance tidak naik
**Solution**:
- [ ] Cek console untuk error log
- [ ] Cari log dengan ❌
- [ ] Jika ada "RLS policy violation":
  - [ ] Ulangi Step 1 (SQL fix)
  - [ ] Restart server
  - [ ] Test lagi

### Problem: Bait tetap 0 di UI
**Solution**:
- [ ] Refresh page (F5)
- [ ] Clear cache (Ctrl+Shift+R)
- [ ] Cek database (Step 6)
- [ ] Jika di database juga 0:
  - [ ] Ulangi Step 3 (Grant bait)

---

## 📞 NEED HELP?

Jika masih ada masalah setelah mengikuti semua step:

1. **Screenshot console log** (yang ada error)
2. **Screenshot UI** (yang tidak update)
3. **Copy error message** dari console
4. **Cek file**: `FISHING_FIX_COMPLETE.md` untuk troubleshooting detail

---

## 📚 DOCUMENTATION

- **Quick Guide**: `QUICK_START.md`
- **Complete Guide**: `FISHING_FIX_COMPLETE.md`
- **Changes**: `CHANGES_SUMMARY.md`
- **SQL Fix**: `FIX_RLS_POLICIES.sql`

---

## 🎉 DONE!

Jika semua checklist ✅, fishing system sudah berfungsi dengan baik!

**Next Steps**:
- Test dengan user lain
- Test dengan rod lain (jika ada)
- Monitor console untuk error
- Enjoy fishing! 🎣
