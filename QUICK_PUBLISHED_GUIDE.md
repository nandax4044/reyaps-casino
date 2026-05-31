# 🎮 Quick Guide - Game Published Feature

## 🚀 Cara Cepat Matikan/Nyalakan Game

### 1. **Roda Hadiah (Wheel Game)**
File: `src/data/roda.json`
```json
{
  "published": true,  // ← true = aktif, false = maintenance
  "prizes": [ ... ]
}
```

### 2. **Case Opening**
File: `src/data/case_opening.json`
```json
{
  "published": true,  // ← true = aktif, false = maintenance
  "chests": [ ... ]
}
```

### 3. **Crash Game**
File: `src/data/permainan.json`
```json
{
  "published": true,  // ← true = aktif, false = maintenance
  ...
}
```

---

## 📝 Contoh Penggunaan

### Matikan Roda Hadiah:
```json
{
  "published": false,  // ← Ubah ke false
  "prizes": [ ... ]
}
```

**Result**: User akan lihat notifikasi:
```
🔧
Roda Hadiah Sedang Dalam Perbaikan

Roda Hadiah sedang dalam pemeliharaan. 
Silakan coba lagi nanti atau mainkan game lain.
```

### Nyalakan Kembali:
```json
{
  "published": true,  // ← Ubah ke true
  "prizes": [ ... ]
}
```

**Result**: Game bisa dimainkan normal ✅

---

## ✅ Files Modified:
- ✅ `src/data/roda.json` - Added published field
- ✅ `src/data/case_opening.json` - Added published field
- ✅ `src/App.tsx` - Added published check logic

---

**Status**: ✅ READY TO USE
