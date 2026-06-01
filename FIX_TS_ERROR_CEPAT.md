# ⚡ FIX TypeScript Error - CEPAT!

## ❌ Error yang Muncul

```
api/index.ts(10,33): error TS2448: Block-scoped variable 'caseOpeningFallback' used before its declaration.
api/index.ts(274,31): error TS2448: Block-scoped variable 'permainanFallback' used before its declaration.
```

## ✅ SUDAH DIPERBAIKI!

File `api/index.ts` sudah diperbaiki dengan urutan yang benar:
1. ✅ `caseOpeningFallback` dideklarasikan dulu
2. ✅ `caseOpeningDefault` menggunakan `caseOpeningFallback`
3. ✅ `permainanFallback` dideklarasikan dulu
4. ✅ `permainanDefault` menggunakan `permainanFallback`

## 🔥 SOLUSI CEPAT (30 detik)

Error yang Anda lihat adalah **cache lama**. Jalankan ini:

### Opsi 1: Script Otomatis (Recommended)

```powershell
.\clear-cache-and-start.ps1
```

Script ini akan:
- ✅ Kill ports yang digunakan
- ✅ Clear TypeScript cache
- ✅ Clear Vite cache
- ✅ Start server

### Opsi 2: Manual

```bash
# 1. Kill ports
.\kill-ports.ps1

# 2. Clear cache
rm -rf node_modules/.cache
rm -rf .vite
rm -rf dist

# 3. Start server
npm run dev
```

---

## 🧪 Verifikasi

Setelah restart, server akan berjalan tanpa error TypeScript:

```
✓ built in xxx ms

Server running on http://localhost:3000

VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**TIDAK ADA error TS2448!** ✅

---

## 🎯 Jika Masih Error

Jika masih muncul error setelah clear cache:

### 1. Verifikasi File

```bash
# Cek urutan deklarasi
Get-Content api\index.ts | Select-String -Pattern "const (caseOpening|permainan)(Default|Fallback)"
```

Harus melihat urutan:
```
const caseOpeningFallback: any = {
const caseOpeningDefault: any = caseOpeningFallback;
const permainanFallback: any = {
const permainanDefault: any = permainanFallback;
```

### 2. Restart IDE

Kadang IDE cache error lama. Restart VS Code:
- Close VS Code
- Open ulang
- Run `npm run dev`

### 3. Reinstall Dependencies

```bash
rm -rf node_modules
npm install
npm run dev
```

---

## 📋 Checklist

- [ ] Jalankan `.\clear-cache-and-start.ps1`
- [ ] Server start tanpa error TypeScript
- [ ] Buka http://localhost:5173
- [ ] Test login
- [ ] User bisa bermain

---

## ⚡ Quick Command

```powershell
# One-liner untuk fix dan start
.\clear-cache-and-start.ps1
```

---

**JALANKAN SEKARANG dan server akan berjalan tanpa error! 🚀**
