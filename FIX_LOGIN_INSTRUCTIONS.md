# 🔧 Panduan Memperbaiki Error Login 500

Error login 500 terjadi karena ada masalah dengan konfigurasi Supabase. Ikuti langkah-langkah berikut untuk memperbaikinya:

## 📋 Langkah 1: Dapatkan API Keys yang Benar dari Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda: `rwngqiakigebtwxohiri`
3. Klik **Settings** (ikon gear) di sidebar kiri
4. Klik **API** di menu Settings
5. Anda akan melihat dua keys penting:
   - **anon public** key (dimulai dengan `eyJ...`)
   - **service_role** key (dimulai dengan `eyJ...`)

## 📝 Langkah 2: Update File .env

Buka file `.env` dan ganti dengan keys yang benar:

```env
# Supabase Configuration (Backend)
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=<PASTE_ANON_KEY_DISINI>
SUPABASE_SERVICE_KEY=<PASTE_SERVICE_ROLE_KEY_DISINI>

# Vite Environment Variables (Frontend)
VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
VITE_SUPABASE_KEY=<PASTE_ANON_KEY_DISINI>
```

**PENTING:** 
- `SUPABASE_KEY` dan `VITE_SUPABASE_KEY` harus menggunakan **anon public** key
- `SUPABASE_SERVICE_KEY` harus menggunakan **service_role** key
- Kedua key harus dimulai dengan `eyJ...` (format JWT)

## 🗄️ Langkah 3: Jalankan SQL Fix di Supabase

1. Buka [Supabase SQL Editor](https://supabase.com/dashboard/project/rwngqiakigebtwxohiri/sql)
2. Buat query baru
3. Copy semua isi dari file `FIX_LOGIN_ERROR.sql`
4. Paste ke SQL Editor
5. Klik **Run** atau tekan `Ctrl+Enter`

SQL ini akan:
- ✅ Membuat tabel `users` jika belum ada
- ✅ Mengatur RLS (Row Level Security) policies yang benar
- ✅ Membuat trigger untuk auto-create user profile saat registrasi
- ✅ Memperbaiki data user yang sudah ada
- ✅ Membuat index untuk performa lebih baik

## 🔄 Langkah 4: Restart Development Server

Setelah update .env dan jalankan SQL:

```bash
# Stop server yang sedang berjalan (Ctrl+C)

# Restart server
npm run dev
```

## 🧪 Langkah 5: Test Login

1. Buka aplikasi di browser
2. Coba login dengan:
   - **Username:** `admin`
   - **Password:** `admin123`
   
   ATAU buat akun baru dengan registrasi

## 🔍 Troubleshooting

### Jika masih error 500:

1. **Cek Console Browser (F12)**
   - Lihat error message di tab Console
   - Lihat response di tab Network

2. **Cek Server Logs**
   - Lihat terminal tempat `npm run dev` berjalan
   - Cari log yang dimulai dengan `[LOGIN]`

3. **Verifikasi Database**
   Jalankan query ini di Supabase SQL Editor:
   ```sql
   -- Cek apakah tabel users ada
   SELECT * FROM public.users LIMIT 5;
   
   -- Cek RLS policies
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

4. **Cek API Keys**
   - Pastikan keys di .env benar
   - Pastikan tidak ada spasi atau karakter tambahan
   - Pastikan keys dimulai dengan `eyJ`

### Error "Username tidak ditemukan"

Ini berarti:
- User belum terdaftar di database
- Atau tabel `users` belum dibuat

**Solusi:** Jalankan `FIX_LOGIN_ERROR.sql` di Supabase

### Error "Profil user tidak ditemukan"

Ini berarti:
- User ada di `auth.users` tapi tidak ada di `public.users`
- Trigger belum berjalan

**Solusi:** 
1. Jalankan `FIX_LOGIN_ERROR.sql`
2. Atau manual insert:
   ```sql
   INSERT INTO public.users (id, email, username, balance, is_staff)
   SELECT id, email, SPLIT_PART(email, '@', 1), 0.00, FALSE
   FROM auth.users
   WHERE id NOT IN (SELECT id FROM public.users);
   ```

## 📞 Butuh Bantuan?

Jika masih ada masalah:
1. Screenshot error message dari browser console
2. Copy log dari terminal server
3. Hubungi developer dengan informasi tersebut

## ✅ Checklist

- [ ] Dapatkan anon key dan service_role key dari Supabase Dashboard
- [ ] Update file .env dengan keys yang benar
- [ ] Jalankan FIX_LOGIN_ERROR.sql di Supabase SQL Editor
- [ ] Restart development server
- [ ] Test login dengan admin/admin123
- [ ] Jika berhasil, coba buat akun baru

---

**Catatan:** Setelah semua langkah selesai, login seharusnya berfungsi normal tanpa error 500.
