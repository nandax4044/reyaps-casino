# ============================================================================
# DEPLOYMENT FIX SCRIPT
# ============================================================================
# Script ini akan membantu Anda deploy semua perbaikan ke production
# ============================================================================

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔧 DEPLOYMENT FIX SCRIPT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if git is clean
Write-Host "📝 Step 1: Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "✅ Changes detected, ready to commit" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes detected" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit
    }
}

Write-Host ""

# Step 2: Show changes
Write-Host "📝 Step 2: Files that will be committed:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Step 3: Confirm deployment
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT: Before deploying, make sure you have:" -ForegroundColor Yellow
Write-Host "   1. ✅ Run FIX_DEPLOYMENT_ISSUES.sql in Supabase" -ForegroundColor White
Write-Host "   2. ✅ Verified all SQL changes are applied" -ForegroundColor White
Write-Host "   3. ✅ Tested locally if possible" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$confirm = Read-Host "Have you completed the SQL fixes in Supabase? (y/n)"
if ($confirm -ne "y") {
    Write-Host ""
    Write-Host "❌ Please run FIX_DEPLOYMENT_ISSUES.sql in Supabase first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Open https://supabase.com" -ForegroundColor White
    Write-Host "2. Go to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy & paste FIX_DEPLOYMENT_ISSUES.sql" -ForegroundColor White
    Write-Host "4. Click Run" -ForegroundColor White
    Write-Host "5. Verify success message" -ForegroundColor White
    Write-Host "6. Run this script again" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host ""

# Step 4: Git add
Write-Host "📝 Step 3: Adding files to git..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green
Write-Host ""

# Step 5: Git commit
Write-Host "📝 Step 4: Committing changes..." -ForegroundColor Yellow
$commitMessage = "fix: Add missing fishing endpoints and fix bait_count error

- Fix bait_count column error (use bait_balance)
- Add grant rod endpoint
- Add revoke rod endpoint
- Add get user rods endpoint
- Add fishing access list endpoint
- Add revoke fishing access endpoint
- Add active fishers endpoint
- Add price config endpoints
- Fix leaderboard data
- Update SQL triggers and functions"

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit
}
Write-Host ""

# Step 6: Git push
Write-Host "📝 Step 5: Pushing to repository..." -ForegroundColor Yellow
Write-Host "⚠️  This will trigger Vercel deployment" -ForegroundColor Yellow
Write-Host ""

$pushConfirm = Read-Host "Push to repository and deploy? (y/n)"
if ($pushConfirm -ne "y") {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    Write-Host "💡 Changes are committed locally but not pushed" -ForegroundColor Yellow
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
    Write-Host "1. Wait for Vercel to finish deployment (1-2 minutes)" -ForegroundColor White
    Write-Host "   Check: https://vercel.com/dashboard" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Test the following features:" -ForegroundColor White
    Write-Host "   ✅ Grant fishing access" -ForegroundColor White
    Write-Host "   ✅ Grant rod access" -ForegroundColor White
    Write-Host "   ✅ Grant bait" -ForegroundColor White
    Write-Host "   ✅ Edit price config" -ForegroundColor White
    Write-Host "   ✅ View leaderboard" -ForegroundColor White
    Write-Host ""
    Write-Host "3. If any errors occur:" -ForegroundColor White
    Write-Host "   - Check Vercel logs" -ForegroundColor White
    Write-Host "   - Check browser console (F12)" -ForegroundColor White
    Write-Host "   - Refer to DEPLOYMENT_FIX_GUIDE.md" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible reasons:" -ForegroundColor Yellow
    Write-Host "- No internet connection" -ForegroundColor White
    Write-Host "- Authentication required" -ForegroundColor White
    Write-Host "- Remote repository issues" -ForegroundColor White
    Write-Host ""
    Write-Host "Try running manually:" -ForegroundColor Yellow
    Write-Host "git push origin main" -ForegroundColor Cyan
    Write-Host ""
}
