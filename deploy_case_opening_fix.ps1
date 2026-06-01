# ============================================================================
# DEPLOY CASE OPENING SYNC FIX
# ============================================================================
# Script ini akan deploy fix agar case opening sync dengan JSON file
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔄 CASE OPENING SYNC FIX DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Perubahan yang akan di-deploy:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ API akan import langsung dari src/data/case_opening.json" -ForegroundColor Green
Write-Host "✅ API akan import langsung dari src/data/permainan.json" -ForegroundColor Green
Write-Host "✅ Vercel config updated untuk include JSON files" -ForegroundColor Green
Write-Host "✅ Filter chest berdasarkan 'published' field" -ForegroundColor Green
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 KEUNTUNGAN:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Edit case opening hanya di 1 file (src/data/case_opening.json)" -ForegroundColor White
Write-Host "✅ Tidak perlu edit API lagi" -ForegroundColor White
Write-Host "✅ Auto sync setelah deploy" -ForegroundColor White
Write-Host "✅ Bisa hide chest dengan published: false" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Lanjutkan deployment? (y/n)"
if ($confirm -ne "y") {
    Write-Host "❌ Deployment dibatalkan" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Step 1: Git add..." -ForegroundColor Yellow
git add api/index.ts vercel.json FIX_CASE_OPENING_SYNC.md deploy_case_opening_fix.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Git add failed" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Step 2: Git commit..." -ForegroundColor Yellow
$commitMessage = "fix: Sync case opening data with JSON file

- Import case_opening.json directly in API
- Import permainan.json directly in API
- Update vercel.json to include src/data/*.json
- Filter chests by published field
- Remove hardcoded data duplication

Benefits:
- Single source of truth
- Easy to edit (only 1 file)
- Auto sync on deploy
- Can hide chests with published: false"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📝 Step 3: Git push..." -ForegroundColor Yellow
Write-Host "⚠️  This will trigger Vercel deployment" -ForegroundColor Yellow
Write-Host ""

$pushConfirm = Read-Host "Push to repository? (y/n)"
if ($pushConfirm -ne "y") {
    Write-Host "❌ Push cancelled" -ForegroundColor Red
    Write-Host "💡 Changes are committed locally" -ForegroundColor Yellow
    Write-Host "   Run 'git push origin main' when ready" -ForegroundColor Yellow
    exit
}

Write-Host ""
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Tunggu Vercel deployment selesai (1-2 menit)" -ForegroundColor White
    Write-Host "   Check: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Verifikasi di Vercel Logs:" -ForegroundColor White
    Write-Host "   Cari: '[CONFIG] Using imported JSON data'" -ForegroundColor Cyan
    Write-Host "   Harus muncul jumlah chests yang benar" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Test di website:" -ForegroundColor White
    Write-Host "   - Buka halaman Case Opening" -ForegroundColor White
    Write-Host "   - Cek chest yang muncul" -ForegroundColor White
    Write-Host "   - Cek harga dan items" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Test edit JSON:" -ForegroundColor White
    Write-Host "   - Edit src/data/case_opening.json" -ForegroundColor White
    Write-Host "   - Commit & push" -ForegroundColor White
    Write-Host "   - Cek perubahan muncul setelah deploy" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 CARA EDIT CASE OPENING SEKARANG:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Edit: src/data/case_opening.json" -ForegroundColor Cyan
    Write-Host "2. Commit & push" -ForegroundColor Cyan
    Write-Host "3. Selesai! ✅" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tidak perlu edit api/index.ts lagi!" -ForegroundColor Green
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "git push origin main" -ForegroundColor Cyan
    Write-Host ""
}
