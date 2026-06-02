# Deploy Fishing Access & Case Opening Fixes
Write-Host "🔧 Deploying Critical Fixes..." -ForegroundColor Cyan
Write-Host ""

# Show what's changed
Write-Host "📋 Changes:" -ForegroundColor Yellow
Write-Host "  ✅ Fixed fishing access list response format" -ForegroundColor Green
Write-Host "  ✅ Fixed case_opening_data.js → case_opening_data.json" -ForegroundColor Green
Write-Host "  ✅ Fixed large numeric values with scientific notation" -ForegroundColor Green
Write-Host "  ✅ Removed unpublished chests" -ForegroundColor Green
Write-Host ""

# Git add all changes
Write-Host "📦 Staging changes..." -ForegroundColor Yellow
git add .

# Commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m "fix: fishing access list response & case opening data format

- Fixed access list response key from 'access_list' to 'access'
- Renamed case_opening_data.js to case_opening_data.json
- Fixed large numeric values using scientific notation strings
- Removed 3 unpublished chests with empty id/name
- Fixed JSON formatting issues

Impact:
- Fishing access grants now display correctly in admin panel
- Case opening game loads without syntax errors
- All 6 published chests available
"

# Push to GitHub (will auto-deploy to Vercel)
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ DEPLOYED! Changes will be live on Vercel in ~2-3 minutes" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test checklist:" -ForegroundColor Cyan
Write-Host "  1. Admin Panel → Fishing Management → Grant Access" -ForegroundColor White
Write-Host "  2. Verify access list updates immediately" -ForegroundColor White
Write-Host "  3. Case Opening → Open any chest" -ForegroundColor White
Write-Host "  4. Verify no console errors" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Monitor deployment at: https://vercel.com/dashboard" -ForegroundColor Yellow
