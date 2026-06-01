# 🚀 DEPLOY SEKARANG - Fix Error 404 di Vercel

## ⚠️ URGENT FIX untuk Error 404

Error 404 pada `/api/auth/login` sudah diperbaiki!

---

## ✅ Yang Sudah Diperbaiki

1. **Struktur API Vercel yang Benar:**
   - ✅ `api/auth/login.ts` - Endpoint login terpisah
   - ✅ `api/auth/register.ts` - Endpoint register terpisah
   - ✅ `vercel.json` - Routing sudah diperbaiki

2. **Dependencies:**
   - ✅ `@vercel/node` sudah diinstall

---

## 🔥 DEPLOY SEKARANG!

### Langkah 1: Commit Changes

```bash
git add .
git commit -m "fix: API 404 error - restructure for Vercel"
git push origin main
```

### Langkah 2: Deploy ke Vercel

**Opsi A - Auto Deploy (Jika sudah terhubung):**
- Vercel akan auto-deploy setelah push ke GitHub
- Tunggu 1-2 menit

**Opsi B - Manual Deploy:**
```bash
vercel --prod
```

### Langkah 3: Set Environment Variables di Vercel

**PENTING!** Pastikan environment variables sudah di-set di Vercel Dashboard:

1. Buka: https://vercel.com/dashboard
2. Pilih project Anda
3. Klik **Settings** > **Environment Variables**
4. Tambahkan:

```
SUPABASE_URL=https://rwngqiakigebtwxohiri.supabase.co
SUPABASE_KEY=<YOUR_ANON_KEY>
SUPABASE_SERVICE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

5. Klik **Save**
6. **Redeploy** project

---

## 🧪 Test Setelah Deploy

1. **Buka website Anda**
2. **Coba login:**
   - Username: `admin`
   - Password: `admin123`
3. **Atau register akun baru**

---

## 📋 Struktur API yang Benar untuk Vercel

```
api/
├── auth/
│   ├── login.ts      ← /api/auth/login
│   └── register.ts   ← /api/auth/register
└── index.ts          ← Fallback (optional)
```

**Vercel akan otomatis route:**
- `/api/auth/login` → `api/auth/login.ts`
- `/api/auth/register` → `api/auth/register.ts`

---

## ⚡ Quick Commands

```bash
# Commit dan push
git add . && git commit -m "fix: API 404" && git push

# Deploy manual (jika perlu)
vercel --prod

# Check logs
vercel logs
```

---

## 🔍 Troubleshooting

### Masih 404 setelah deploy?

**1. Cek Environment Variables:**
```bash
vercel env ls
```

Pastikan ada:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_KEY`

**2. Cek Build Logs:**
```bash
vercel logs --follow
```

**3. Redeploy:**
```bash
vercel --prod --force
```

### Error "Module not found"?

**Install dependencies:**
```bash
npm install
git add package-lock.json
git commit -m "update dependencies"
git push
```

### Masih error?

**Cek Vercel Dashboard:**
1. Buka project di Vercel
2. Klik tab **Deployments**
3. Klik deployment terakhir
4. Lihat **Build Logs** dan **Function Logs**

---

## ✅ Checklist Deploy

- [ ] Commit semua perubahan
- [ ] Push ke GitHub/GitLab
- [ ] Set environment variables di Vercel
- [ ] Deploy ke production
- [ ] Test login di website
- [ ] Verifikasi tidak ada error 404

---

## 🎉 Selesai!

Setelah deploy, user Anda bisa login kembali!

**Estimasi waktu:** 2-5 menit

---

**DEPLOY SEKARANG dan user Anda bisa bermain lagi! 🚀**
