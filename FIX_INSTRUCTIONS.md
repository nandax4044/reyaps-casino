# 🔧 PANDUAN PERBAIKAN DATABASE - Galaxy Casino

## ❌ MASALAH YANG TERJADI

1. **Error "Cannot coerce to single JSON object"** - Terjadi karena ada **data duplikat** di tabel `game_configs`
2. **Chest game dan Wheel game tidak bisa load config** - Karena error di atas
3. **Item tidak tersimpan ke inventory** - Mungkin karena RLS masih aktif

## ✅ SOLUSI LENGKAP

### LANGKAH 1: Bersihkan Database (WAJIB!)

1. Buka **Supabase Dashboard** → https://supabase.com/dashboard
2. Pilih project **rwngqiakigebtwxohiri**
3. Klik menu **SQL Editor** di sidebar kiri
4. Klik **New Query**
5. Copy-paste **SEMUA** isi file `cleanup_database.sql` ke editor
6. Klik tombol **RUN** (atau tekan F5)
7. Tunggu sampai muncul "Success. No rows returned"

### LANGKAH 2: Restart Server

1. Buka terminal di folder `c:\reyagachav2`
2. Tekan **Ctrl+C** untuk stop server yang sedang jalan
3. Jalankan lagi dengan: `npm run dev`
4. Tunggu sampai muncul: `[SERVER RUNNING] Full-stack Server successfully started`

### LANGKAH 3: Test Semua Fitur

#### Test 1: Chest Game
1. Login ke website (localhost:3000)
2. Klik menu **"Chest Opening"**
3. Pilih salah satu chest (misalnya Golden Chest)
4. Klik **"BUKA SEKARANG"**
5. Tunggu animasi selesai
6. **VERIFIKASI**: 
   - Item yang menang muncul di popup
   - Saldo berkurang sesuai harga chest
   - Buka menu **Inventory** → item harus ada di list

#### Test 2: Wheel Game (Roda)
1. Klik menu **"Prize Wheel"** atau **"Roda Hadiah"**
2. Klik tombol **"SPIN"**
3. Tunggu roda berhenti
4. **VERIFIKASI**:
   - Item yang menang muncul
   - Saldo berubah sesuai hadiah
   - Buka menu **Inventory** → item harus ada di list

#### Test 3: Admin Panel
1. Login sebagai admin (username: `nanddev` atau admin lain)
2. Klik menu **"Admin Dashboard"**
3. Scroll ke bagian **"Game Configuration Editor"**
4. Pilih game type: **Cases**
5. Edit config (misalnya ubah harga chest)
6. Klik **"SAVE CONFIGURATION"**
7. **VERIFIKASI**: Muncul notif "Berhasil mengupdate konfigurasi"
8. Klik tombol **"RESET"** (kuning)
9. **VERIFIKASI**: Config kembali ke default

#### Test 4: Clear Inventory
1. Masih di Admin Dashboard
2. Scroll ke **"User Inventory Audit"**
3. Pilih user yang punya item
4. Klik tombol **"Clear All"** (merah)
5. **VERIFIKASI**: Semua item user tersebut hilang
6. Atau klik icon 🗑️ di samping item untuk hapus satu-satu

### LANGKAH 4: Cek Log Server

Setelah test, cek terminal server. Harusnya muncul log seperti ini:

```
[CONFIG] Loaded cases from DB (1 rows found, using first)
[CONFIG] Loaded wheel from DB (1 rows found, using first)
```

**JANGAN** ada lagi error seperti:
- ❌ `[CONFIG] DB error for cases: Cannot coerce...`
- ❌ `[CONFIG] DB error for wheel: Cannot coerce...`

## 🔍 TROUBLESHOOTING

### Masalah: Masih muncul error "Cannot coerce..."

**Solusi:**
1. Pastikan sudah jalankan `cleanup_database.sql` dengan benar
2. Cek di Supabase SQL Editor, jalankan query ini:
   ```sql
   SELECT game_type, COUNT(*) as jumlah
   FROM public.game_configs
   GROUP BY game_type;
   ```
3. Jika ada game_type dengan jumlah > 1, berarti masih ada duplikat
4. Hapus semua dengan: `DELETE FROM public.game_configs;`
5. Restart server

### Masalah: Item tidak masuk inventory

**Solusi:**
1. Cek RLS status di Supabase SQL Editor:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'inventory';
   ```
2. Jika `rowsecurity` = `t` (true), disable dengan:
   ```sql
   ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
   ```
3. Restart server dan test lagi

### Masalah: Admin tidak bisa save config

**Solusi:**
1. Pastikan login sebagai user dengan `is_staff = true`
2. Cek di Supabase → Table Editor → users → cari username kamu
3. Ubah kolom `is_staff` jadi `true`
4. Logout dan login lagi

### Masalah: Server error "Port 3000 already in use"

**Solusi:**
1. Tekan **Ctrl+C** di terminal yang lama
2. Atau tutup semua terminal
3. Buka terminal baru
4. Jalankan `npm run dev` lagi

## 📋 CHECKLIST FINAL

Setelah semua langkah di atas, pastikan:

- ✅ Tidak ada error di terminal server
- ✅ Chest game bisa dibuka dan item masuk inventory
- ✅ Wheel game bisa di-spin dan item masuk inventory
- ✅ Crash game bisa dimainkan (bonus: payout sudah benar)
- ✅ Admin bisa save dan reset config
- ✅ Admin bisa clear inventory dan delete item
- ✅ Saldo user berubah dengan benar setelah main game

## 🎉 SELESAI!

Jika semua checklist di atas ✅, berarti website sudah **100% berfungsi dengan baik**!

---

## 📞 JIKA MASIH ADA MASALAH

Kirim screenshot error dari:
1. Terminal server (log merah)
2. Browser console (F12 → Console tab)
3. Supabase SQL Editor (jika ada error query)

Saya akan bantu fix! 💪
