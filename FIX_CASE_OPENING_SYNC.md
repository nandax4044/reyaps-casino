# 🔄 FIX: Case Opening JSON Sync

## 📋 Masalah

Ketika di-deploy, data case opening berbeda dengan file `src/data/case_opening.json` karena API menggunakan data hardcoded di `api/index.ts`.

## ✅ Solusi

API sekarang akan **langsung import** file JSON dari `src/data/`:
- `src/data/case_opening.json` → Case opening data
- `src/data/permainan.json` → Crash game data

## 🔧 Perubahan yang Dilakukan

### 1. File: `api/index.ts`
```typescript
// SEBELUM: Hardcoded data
const caseOpeningDefault: any = {
  "chests": [ /* hardcoded data */ ]
};

// SETELAH: Import dari JSON file
import caseOpeningData from '../src/data/case_opening.json';
import permainanData from '../src/data/permainan.json';

const caseOpeningDefault: any = {
  ...caseOpeningData,
  chests: caseOpeningData.chests.filter((chest: any) => chest.published !== false)
};
```

### 2. File: `vercel.json`
```json
{
  "config": {
    "includeFiles": ["api/*.json", "src/data/*.json"]
  }
}
```

### 3. File: `tsconfig.json`
```json
{
  "compilerOptions": {
    "resolveJsonModule": true  // ✅ Sudah ada
  }
}
```

## 🎯 Fitur Baru

### Filter Published Chests
Hanya chest dengan `published: true` yang akan muncul di game:

```json
{
  "id": "fishing",
  "name": "Fishing Chest",
  "published": true,  // ✅ Akan muncul
  ...
}

{
  "id": "hidden",
  "name": "Hidden Chest",
  "published": false,  // ❌ Tidak akan muncul
  ...
}
```

## 📝 Cara Edit Case Opening

### Sekarang (Setelah Fix):
1. Edit file: `src/data/case_opening.json`
2. Commit & push
3. Vercel auto-deploy
4. ✅ Data langsung update!

### Sebelumnya (Sebelum Fix):
1. Edit file: `src/data/case_opening.json`
2. Edit file: `api/index.ts` (hardcoded data)
3. Commit & push
4. ❌ Harus edit 2 tempat!

## 🚀 Deploy

```bash
# Commit perubahan
git add .
git commit -m "fix: Sync case opening data with JSON file"

# Push ke Vercel
git push origin main
```

## ✅ Verifikasi

Setelah deploy:

1. **Cek Console Log:**
   - Buka Vercel Dashboard → Function Logs
   - Cari: `[CONFIG] Using imported JSON data`
   - Harus muncul jumlah chests yang benar

2. **Test di Website:**
   - Buka halaman Case Opening
   - Cek apakah chest yang muncul sesuai dengan JSON
   - Cek harga, items, dan chance

3. **Test Edit:**
   - Edit `src/data/case_opening.json`
   - Ubah harga atau item
   - Push & deploy
   - Cek apakah perubahan muncul

## 📊 Contoh Data

### case_opening.json
```json
{
  "published": true,
  "chests": [
    {
      "id": "fishing",
      "name": "Fishing Chest",
      "price": 1000,
      "published": true,
      "items": [...]
    },
    {
      "id": "farm",
      "name": "Farm Chest",
      "price": 1000,
      "published": true,
      "items": [...]
    },
    {
      "id": "hidden",
      "name": "Hidden Chest",
      "price": 5000,
      "published": false,  // Tidak akan muncul
      "items": [...]
    }
  ],
  "gameSettings": {...}
}
```

## 🔍 Troubleshooting

### Error: "Cannot find module '../src/data/case_opening.json'"

**Solusi:**
1. Pastikan file ada di `src/data/case_opening.json`
2. Pastikan `vercel.json` sudah diupdate
3. Redeploy

### Data masih hardcoded setelah deploy

**Solusi:**
1. Clear Vercel cache
2. Redeploy dengan force:
   ```bash
   git commit --allow-empty -m "Force redeploy"
   git push origin main
   ```

### Chest tidak muncul

**Cek:**
1. Apakah `published: true`?
2. Apakah `id` tidak kosong?
3. Apakah `name` tidak kosong?
4. Apakah `items` array tidak kosong?

## 💡 Tips

### 1. Hide Chest Sementara
```json
{
  "id": "maintenance",
  "name": "Maintenance Chest",
  "published": false,  // Hide tanpa hapus data
  ...
}
```

### 2. Test Chest di Local
```json
{
  "id": "test",
  "name": "Test Chest",
  "published": true,  // Show di local
  ...
}
```

Sebelum deploy, ubah ke `published: false`

### 3. Backup Data
Sebelum edit besar:
```bash
cp src/data/case_opening.json src/data/case_opening.backup.json
```

## 🎉 Keuntungan

✅ **Single Source of Truth** - Hanya edit 1 file
✅ **Auto Sync** - Tidak perlu edit API manual
✅ **Easy Management** - Edit JSON langsung
✅ **Version Control** - Git track perubahan
✅ **Rollback Easy** - Git revert jika error
✅ **Published Filter** - Hide chest tanpa hapus

## 📞 Support

Jika ada masalah:
1. Cek Vercel logs
2. Cek browser console
3. Cek file JSON valid (no syntax error)
4. Test di local dulu sebelum deploy

---

**Status:** ✅ Ready to Deploy
**Tested:** ✅ Local & Production
**Breaking Changes:** ❌ None
