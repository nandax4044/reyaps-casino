# 🚀 Quick Start - Image Upload

## ⚡ 3-Minute Setup

### 1️⃣ Run Migration (2 minutes)
```
1. Open https://supabase.com
2. Go to SQL Editor
3. Copy ALL from: migration_add_image_storage.sql
4. Paste and click RUN
5. Wait for success message
```

### 2️⃣ Restart Dev Server (30 seconds)
```bash
# Press Ctrl+C to stop
npm run dev
```

### 3️⃣ Test Upload (30 seconds)
```
1. Login as admin
2. Admin Dashboard → Prize Wheel
3. Click 📁 Upload
4. Select PNG file (< 2MB)
5. Click SAVE CHANGES
```

---

## ✅ Verification

### Check Supabase Storage:
```
Dashboard → Storage → wheel-images
Should see: prizes folder with uploaded file
```

### Check Database:
```sql
SELECT * FROM uploaded_images ORDER BY created_at DESC LIMIT 5;
```

---

## 🎯 Current Status

### ✅ Working Now:
- Upload PNG from file manager
- Base64 storage in database
- Image preview
- Display in wheel game

### ⏳ After Migration:
- Supabase Storage buckets
- CDN public URLs
- Better performance
- Scalable storage

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `migration_add_image_storage.sql` | Run this in Supabase |
| `src/utils/imageUpload.ts` | Upload functions |
| `src/components/AdminDashboard.tsx` | Upload UI |
| `.env` | Environment variables |

---

## 🐛 Quick Fixes

### Upload not working?
```bash
# Restart dev server
npm run dev
```

### Migration failed?
```
Check Supabase Dashboard → Logs
Re-run migration script
```

### Image not showing?
```
Check browser console
Verify file size < 2MB
Check image URL/base64
```

---

## 📞 Need Help?

Read full guides:
- `SUPABASE_STORAGE_SETUP_GUIDE.md` - Detailed setup
- `IMAGE_UPLOAD_IMPLEMENTATION_COMPLETE.md` - Full docs
- `WHEEL_IMAGE_UPLOAD_FEATURE.md` - Feature details

---

**Date**: 31 Mei 2026  
**Status**: Ready to Deploy  
**Time to Setup**: ~3 minutes

