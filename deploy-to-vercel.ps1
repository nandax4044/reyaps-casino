#!/usr/bin/env pwsh
# Script untuk deploy ke Vercel dengan cepat - FIX HTTP 405

Write-Host "🚀 FIX HTTP 405 ERROR - DEPLOYING TO VERCEL..." -ForegroundColor Cyan
Write-Host ""

# 1. Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix HTTP 405 error - improve CORS headers and routing"

Write-Host ""
Write-Host "🔄 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ DONE! Vercel akan otomatis deploy sekarang." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Cek progress di: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  JANGAN LUPA:" -ForegroundColor Red
Write-Host "   1. Set environment variables di Vercel Dashboard" -ForegroundColor White
Write-Host "   2. SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY" -ForegroundColor White
Write-Host "   3. Redeploy jika baru menambahkan env vars" -ForegroundColor White
Write-Host "   4. Clear browser cache setelah deploy" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test login setelah deploy berhasil!" -ForegroundColor Green
Write-Host ""
