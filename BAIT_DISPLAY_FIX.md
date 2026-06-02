# BAIT DISPLAY FIX - COMPLETE ✅

## PROBLEM
- Admin dapat memberikan bait (sukses di admin dashboard)
- Tapi user tidak bisa melihat bait mereka di Fish AFK page
- Bait balance menampilkan 0 meskipun sudah diberi bait
- User tidak bisa start AFK fishing karena "no bait" error

## ROOT CAUSE DITEMUKAN
**Mismatch field name antara database dan frontend:**

1. **Database table `fishing_inventory`**: menggunakan kolom `bait`
2. **Admin grant-bait endpoint**: mengembalikan `bait` DAN `bait_balance` ✅
3. **User fishing inventory endpoint** (`/fishing/inventory`): HANYA mengembalikan `bait` ❌
4. **Frontend** (`FishingAFKLogs.tsx`, `FishingGameV3.tsx`): mengharapkan `bait_balance` ❌

Jadi flow yang terjadi:
- Admin grant bait → sukses update database (kolom `bait` bertambah) ✅
- Admin dashboard baca dari admin endpoint → dapat `bait_balance` ✅  
- User Fish AFK page baca dari user endpoint → dapat `bait` tapi frontend cari `bait_balance` → undefined → tampil 0 ❌

## SOLUTION APPLIED
Updated **user fishing inventory endpoint** di `api/[...path].ts` line 343-366 untuk mengembalikan `bait_balance`:

```typescript
// Get user fishing inventory
if (path === '/fishing/inventory' && method === 'GET') {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('fishing_inventory')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const inventoryData = data || { user_id: user.id, bait: 0, fishing_saldo: 0 };
    
    return res.json({
      inventory: {
        ...inventoryData,
        bait_balance: inventoryData.bait // Frontend compatibility ✅
      }
    });
  }
  const defaultData = { user_id: user.id, bait: 0, fishing_saldo: 0 };
  return res.json({ 
    inventory: {
      ...defaultData,
      bait_balance: 0
    }
  });
}
```

## FILES MODIFIED
- `api/[...path].ts` - Updated user fishing inventory endpoint (line 343-366)

## EXPECTED RESULT SETELAH DEPLOY
1. Admin grant bait ke user → sukses (sudah jalan) ✅
2. User refresh Fish AFK page → bait balance tampil sesuai jumlah yang diberikan ✅
3. User bisa start AFK fishing karena ada bait ✅

## TESTING STEPS
1. Login sebagai admin
2. Buka "Bait Management" 
3. Pilih user dan grant bait (misal 100 bait)
4. Logout dari admin
5. Login sebagai user yang diberi bait
6. Buka "Fish AFK" page
7. **VERIFY**: Bait balance harus tampil 100 (tidak lagi 0)
8. **VERIFY**: Button "Start AFK Fishing" harus bisa diklik
9. Pilih rod dan klik start
10. **VERIFY**: AFK fishing dimulai tanpa error "no bait"

## DEPLOYMENT CHECKLIST
- [x] Fix user fishing inventory endpoint untuk return `bait_balance`
- [ ] Commit dan push ke GitHub
- [ ] Vercel auto-deploy
- [ ] Test: Admin grant bait
- [ ] Test: User login dan cek Fish AFK page
- [ ] Test: Start AFK fishing dengan bait yang ada

## KONSISTENSI ENDPOINTS
Sekarang semua endpoints return format yang sama:

1. **User inventory endpoint** (`/fishing/inventory`): ✅ Returns `bait_balance`
2. **Admin grant-bait** (`/admin/fishing/grant-bait`): ✅ Returns `bait_balance`
3. **Admin user inventory** (`/admin/fishing/user-inventory/:userId`): ✅ Returns `bait_balance`

## NOTES
- Database tetap menggunakan kolom `bait` (tidak perlu ubah schema)
- Backend menambahkan field `bait_balance` saat return response
- Frontend konsisten menggunakan `bait_balance` di semua komponen
- Backward compatible: return `bait` DAN `bait_balance`
