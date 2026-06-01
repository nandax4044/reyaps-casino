#!/usr/bin/env pwsh
# Script untuk deploy ke Vercel dengan cepat - FIX HTTP 401

Write-Host "🚀 FIX HTTP 401 ERROR - DEPLOYING TO VERCEL..." -ForegroundColor Cyan
Write-Host ""

# 1. Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix HTTP 401 - auto clear old tokens and better error handling"

Write-Host ""
Write-Host "🔄 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ DONE! Vercel akan otomatis deploy sekarang." -ForegroundColor Green
Write-Host ""
Write-Host "📊 Cek progress di: https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  PENTING - KIRIM PESAN INI KE USER:" -ForegroundColor Red
Write-Host ""
Write-Host "   🚨 UPDATE APLIKASI 🚨" -ForegroundColor Yellow
Write-Host "   Jika ada error login, lakukan ini:" -ForegroundColor White
Write-Host "   1. Buka: https://your-app.vercel.app/clear-tokens.html" -ForegroundColor White
Write-Host "   2. Klik 'Clear Tokens & Logout'" -ForegroundColor White
Write-Host "   3. Login ulang dengan username dan password" -ForegroundColor White
Write-Host ""
Write-Host "   Atau manual: Tekan F12 → ketik localStorage.clear() → login ulang" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Setelah deploy, test login dengan admin/admin123!" -ForegroundColor Green
Write-Host ""
