# 🔧 Fix RLS Error - Panduan Lengkap

## ❌ Error yang Muncul

```json
{"error": "new row violates row-level security policy for table \"game_configs\""}
```

## 🔍 Penyebab

**RLS (Row Level Security) masih aktif** di tabel `game_configs` di Supabase. Ini mencegah insert/update data meskipun menggunakan service role key.

## ✅ Solusi: Disable RLS (2 MENIT)

### LANGKAH 1: Buka Supabase SQL Editor

1. Buka https://supabase.com/dashboard
2. Login dan pilih project: **rwngqiakigebtwxohiri**
3. Klik **"SQL Editor"** di sidebar kiri
4. Klik **"New Query"**

### LANGKAH 2: Jalankan Fix Script

1. Buka file: `FIX_RLS_ERROR.sql`
2. **COPY SEMUA ISI FILE** (Ctrl+A, Ctrl+C)
3. **PASTE** ke SQL Editor (Ctrl+V)
4. Klik tombol **"RUN"** (atau tekan F5)
5. Tunggu sampai selesai

### LANGKAH 3: Verify Output

Setelah run, kamu harus lihat output seperti ini:

```
tablename      | rls_status
---------------|------------------
game_configs   | ✅ DISABLED (Good!)
inventory      | ✅ DISABLED (Good!)
users          | ✅ DISABLED (Good!)
```

**Jika semua ✅ DISABLED**, berarti berhasil!

### LANGKAH 4: Test Lagi

1. Refresh website kamu
2. Login sebagai admin
3. Klik "Admin Dashboard"
4. Scroll ke "Game Configuration Editor"
5. Pilih game type: "Cases"
6. Klik **"SAVE CONFIGURATION"**

**Harus berhasil tanpa error!** ✅

---

## 🔄 Jika Masih Error

### Cek 1: Verify RLS Status

Jalankan query ini di Supabase SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'inventory', 'game_configs');
```

**Expected output:**
```
tablename      | rowsecurity
---------------|-------------
game_configs   | f
inventory      | f
users          | f
```

`f` = false = RLS disabled ✅

Jika ada yang `t` (true), jalankan lagi:

```sql
ALTER TABLE public.game_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### Cek 2: Verify Permissions

Jalankan query ini:

```sql
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'inventory', 'game_configs')
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee;
```

Harus ada permissions untuk `anon`, `authenticated`, dan `service_role`.

Jika tidak ada, jalankan:

```sql
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT ALL ON public.inventory TO anon, authenticated, service_role;
GRANT ALL ON public.game_configs TO anon, authenticated, service_role;
```

### Cek 3: Verify Service Role Key

1. Buka Supabase Dashboard → Settings → API
2. Copy **"service_role"** key (bukan anon key!)
3. Update `.env` file:

```
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Update environment variables di Vercel (jika sudah deploy)
5. Restart server / redeploy

---

## 📊 Checklist

- [ ] ✅ Jalankan `FIX_RLS_ERROR.sql` di Supabase
- [ ] ✅ Verify RLS disabled (semua tabel show `f`)
- [ ] ✅ Verify permissions granted
- [ ] ✅ Verify service role key benar
- [ ] ✅ Restart server / redeploy
- [ ] ✅ Test save config di admin panel
- [ ] ✅ Test reset config di admin panel

---

## 🎯 Penjelasan Teknis

### Apa itu RLS?

**Row Level Security (RLS)** adalah fitur Supabase/PostgreSQL untuk membatasi akses data per row berdasarkan user.

**Contoh:**
- User A hanya bisa lihat inventory miliknya sendiri
- Admin bisa lihat semua inventory

### Kenapa Disable RLS?

Untuk **development/testing**, RLS bikin ribet karena:
- Perlu setup policy yang kompleks
- Sering error "violates row-level security"
- Sulit debug

Untuk **production**, sebaiknya RLS di-enable dengan policy yang benar untuk security.

### Apakah Aman Disable RLS?

**Untuk development:** ✅ Aman (database tidak public)

**Untuk production:** ⚠️ Tidak recommended (tapi masih aman jika:)
- API server handle authorization (sudah ada di code)
- Database tidak exposed ke public
- Hanya API server yang akses database

**Code kita sudah handle authorization:**
```typescript
// Check if user is staff
if (!user.is_staff) {
  return res.status(403).json({ error: 'Akses Ditolak!' });
}
```

Jadi meskipun RLS disabled, user biasa tetap tidak bisa akses admin endpoints.

---

## 🔐 Alternative: Enable RLS dengan Policy yang Benar

Jika mau enable RLS (untuk production), gunakan policy ini:

```sql
-- Enable RLS
ALTER TABLE public.game_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Anyone can read game configs"
ON public.game_configs FOR SELECT
TO public
USING (true);

-- Policy: Service role can do anything
CREATE POLICY "Service role can manage game configs"
ON public.game_configs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Authenticated users with is_staff can manage
CREATE POLICY "Staff can manage game configs"
ON public.game_configs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.is_staff = true
  )
);
```

**Tapi untuk sekarang, lebih mudah disable RLS!** ✅

---

## 🆘 Masih Error?

Jika sudah jalankan semua langkah di atas tapi masih error:

1. **Screenshot error** dari:
   - Browser console (F12 → Console)
   - Network tab (F12 → Network → klik request yang error)
   - Supabase SQL Editor (hasil query verify)

2. **Check logs:**
   - Server logs (terminal)
   - Vercel logs (jika sudah deploy)

3. **Restart everything:**
   ```bash
   # Stop server (Ctrl+C)
   # Clear cache
   npm run clean
   # Reinstall
   npm install
   # Restart
   npm run dev
   ```

4. **Last resort: Reset database**
   - Jalankan `schema_final.sql` (⚠️ ini akan hapus semua data!)
   - Jalankan `FIX_RLS_ERROR.sql`
   - Test lagi

---

**TL;DR:** Jalankan `FIX_RLS_ERROR.sql` di Supabase SQL Editor, tunggu sampai selesai, refresh website, test lagi. Harus berhasil! ✅
