# 🚀 Supabase Storage Setup Guide

## 📋 Overview

Panduan ini akan membantu Anda setup Supabase Storage untuk upload gambar prize wheel, case opening, dan crash game.

---

## ✅ Prerequisites

- ✅ Akun Supabase aktif
- ✅ Project Supabase sudah dibuat
- ✅ Database sudah running
- ✅ Sudah punya SUPABASE_URL dan SUPABASE_KEY di `.env`

---

## 🔧 Step 1: Run Migration Script

### 1.1 Buka Supabase Dashboard
1. Login ke https://supabase.com
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri

### 1.2 Copy Migration Script
1. Buka file: `migration_add_image_storage.sql`
2. Copy **SEMUA** isi file (Ctrl+A, Ctrl+C)

### 1.3 Run Migration
1. Di SQL Editor, paste script yang sudah dicopy
2. Klik tombol **RUN** (atau tekan F5)
3. Tunggu sampai selesai (biasanya 5-10 detik)
4. ✅ Jika sukses, akan muncul "Success. No rows returned"

### 1.4 Verify Migration
Check apakah migration berhasil:

```sql
-- Check storage buckets
SELECT * FROM storage.buckets;

-- Check uploaded_images table
SELECT * FROM public.uploaded_images;
```

Expected result:
- ✅ 4 buckets: wheel-images, case-images, crash-images, game-assets
- ✅ Table uploaded_images exists

---

## 🗂️ Step 2: Verify Storage Buckets

### 2.1 Check Storage Section
1. Di Supabase Dashboard, klik **Storage** di sidebar
2. Anda harus melihat 4 buckets:
   - `wheel-images` (2MB limit, public)
   - `case-images` (2MB limit, public)
   - `crash-images` (2MB limit, public)
   - `game-assets` (5MB limit, public)

### 2.2 Check Bucket Settings
Klik salah satu bucket, pastikan:
- ✅ **Public**: Yes
- ✅ **File size limit**: 2MB (atau 5MB untuk game-assets)
- ✅ **Allowed MIME types**: image/png, image/jpeg, image/jpg, image/webp

---

## 🔐 Step 3: Verify Storage Policies

### 3.1 Check Policies
1. Di Storage section, klik bucket (e.g., wheel-images)
2. Klik tab **Policies**
3. Anda harus melihat 4 policies:
   - ✅ Public Access (SELECT)
   - ✅ Authenticated Upload (INSERT)
   - ✅ Staff Update (UPDATE)
   - ✅ Staff Delete (DELETE)

### 3.2 Test Policy (Optional)
Run query untuk test policy:

```sql
-- Test public read policy
SELECT * FROM storage.objects WHERE bucket_id = 'wheel-images';

-- Test authenticated upload policy
-- (This will be tested from frontend)
```

---

## 🌐 Step 4: Update Environment Variables

### 4.1 Check .env File
File `.env` sudah ada dengan:

```env
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Add Vite Environment Variables
Untuk Vite, environment variables harus diawali dengan `VITE_`:

```env
# Supabase Configuration
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Vite Environment Variables (for frontend)
VITE_SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
VITE_SUPABASE_KEY=sb_publishable_Hkxhl_MzTD5dqqVY3TtyYw_n_8I5cfv
```

**⚠️ IMPORTANT**: Restart dev server setelah update .env!

---

## 🧪 Step 5: Test Upload from Admin Dashboard

### 5.1 Login as Admin
1. Jalankan aplikasi: `npm run dev`
2. Login dengan akun staff/admin
3. Buka Admin Dashboard

### 5.2 Test Upload
1. Klik tab **EDIT GAME APPS**
2. Pilih **Prize Wheel**
3. Scroll ke salah satu prize
4. Klik button **📁 Upload**
5. Pilih file PNG/JPG (< 2MB)
6. ✅ Preview harus muncul
7. Klik **SAVE CHANGES**

### 5.3 Verify Upload
Check di Supabase Storage:
1. Buka Storage → wheel-images
2. Folder `prizes` harus ada
3. File yang diupload harus terlihat
4. Klik file untuk preview

### 5.4 Check Database Log
Run query untuk check upload log:

```sql
SELECT * FROM public.uploaded_images 
WHERE game_type = 'wheel' 
ORDER BY created_at DESC 
LIMIT 10;
```

Expected result:
- ✅ Row baru dengan file info
- ✅ bucket_name = 'wheel-images'
- ✅ file_path = 'prizes/1234567890_abc123.png'
- ✅ uploaded_by = user_id

---

## 🐛 Troubleshooting

### Problem 1: "Bucket not found"
**Solution**:
1. Check apakah migration sudah dirun
2. Verify di Storage section
3. Re-run migration jika perlu

### Problem 2: "Permission denied"
**Solution**:
1. Check storage policies
2. Pastikan user sudah login (authenticated)
3. Untuk update/delete, pastikan user is_staff = true

### Problem 3: "File too large"
**Solution**:
1. Check file size (max 2MB untuk wheel/case/crash)
2. Compress image sebelum upload
3. Atau gunakan game-assets bucket (max 5MB)

### Problem 4: "Invalid file type"
**Solution**:
1. Hanya support: PNG, JPG, JPEG, WebP
2. Convert file ke format yang supported
3. Untuk SVG, gunakan game-assets bucket

### Problem 5: Upload berhasil tapi image tidak muncul
**Solution**:
1. Check public URL di browser
2. Verify bucket is public
3. Check CORS settings di Supabase
4. Clear browser cache

### Problem 6: Environment variables tidak terbaca
**Solution**:
1. Pastikan .env file di root folder
2. Restart dev server (Ctrl+C, npm run dev)
3. Check console.log untuk verify:
   ```typescript
   console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
   ```

---

## 📊 Storage Structure

### Bucket: wheel-images
```
wheel-images/
├── prizes/
│   ├── 1748707200000_abc123.png
│   ├── 1748707201000_def456.png
│   └── ...
└── ...
```

### Bucket: case-images
```
case-images/
├── items/
│   ├── 1748707300000_item1.png
│   ├── 1748707301000_item2.png
│   └── ...
└── chests/
    ├── 1748707400000_chest1.png
    └── ...
```

### Bucket: crash-images
```
crash-images/
├── prizes/
│   ├── 1748707500000_prize1.png
│   └── ...
└── ...
```

### Bucket: game-assets
```
game-assets/
├── backgrounds/
├── icons/
├── logos/
└── ...
```

---

## 🔄 Migration Rollback (If Needed)

Jika ada masalah dan ingin rollback:

```sql
-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN (
  'wheel-images', 'case-images', 'crash-images', 'game-assets'
);

-- Drop uploaded_images table
DROP TABLE IF EXISTS public.uploaded_images CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS get_image_public_url(TEXT, TEXT);
DROP FUNCTION IF EXISTS update_uploaded_images_updated_at();
```

**⚠️ WARNING**: Ini akan menghapus SEMUA uploaded images!

---

## 📈 Next Steps After Setup

### 1. Update AdminDashboard to use Supabase Storage
Currently using base64 (works but not optimal). Update to:

```typescript
import { uploadImageToSupabase } from '../utils/imageUpload';

// In file upload handler:
const result = await uploadImageToSupabase(file, 'wheel-images', 'prizes');
if (result.success) {
  handleUpdateWheelPrizeValue('image', result.url, idx);
} else {
  alert('Upload gagal: ' + result.error);
}
```

### 2. Add Image Compression
Install library:
```bash
npm install browser-image-compression
```

Update imageUpload.ts to compress before upload.

### 3. Add Drag & Drop Upload
Improve UX dengan drag & drop interface.

### 4. Add Image Gallery
Show previously uploaded images untuk reuse.

---

## ✅ Checklist

Sebelum production, pastikan:

- [ ] Migration script sudah dirun
- [ ] 4 storage buckets sudah dibuat
- [ ] Storage policies sudah aktif
- [ ] Environment variables sudah diset
- [ ] Test upload berhasil
- [ ] Images muncul di wheel game
- [ ] Database log terisi
- [ ] Public URL accessible
- [ ] CORS settings OK
- [ ] File size limits OK

---

## 📞 Support

Jika ada masalah:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console untuk errors
3. Check network tab untuk failed requests
4. Verify storage policies
5. Test dengan file kecil dulu (< 100KB)

---

**Date**: 31 Mei 2026
**Version**: 1.0
**Status**: Ready to Deploy

