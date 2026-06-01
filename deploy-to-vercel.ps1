#!/usr/bin/env pwsh
# Script untuk deploy ke Vercel - FIX 404 ENDPOINT FINAL

Write-Host "🔥 FIX 404 ENDPOINT - DEPLOYING TO VERCEL..." -ForegroundColor Cyan
Write-Host ""

# 1. Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix 404 endpoint - create separate API files for Vercel"

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
Write-Host "   🚨 UPDATE PENTING 🚨" -ForegroundColor Yellow
Write-Host "   Kami telah memperbaiki masalah endpoint." -ForegroundColor White
Write-Host ""
Write-Host "   WAJIB LAKUKAN INI:" -ForegroundColor Red
Write-Host "   1. Logout dari aplikasi" -ForegroundColor White
Write-Host "   2. Clear browser cache (Ctrl + Shift + Delete)" -ForegroundColor White
Write-Host "   3. Login ulang dengan username dan password" -ForegroundColor White
Write-Host ""
Write-Host "   Atau cepat:" -ForegroundColor Yellow
Write-Host "   - Tekan F12" -ForegroundColor White
Write-Host "   - Ketik: localStorage.clear()" -ForegroundColor White
Write-Host "   - Refresh dan login ulang" -ForegroundColor White
Write-Host ""
Write-Host "   Setelah itu, semua akan berfungsi normal! 🎉" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test setelah deploy:" -ForegroundColor Cyan
Write-Host "   1. Login dengan admin/admin123" -ForegroundColor White
Write-Host "   2. Cek console (F12) - tidak ada error 404" -ForegroundColor White
Write-Host "   3. Profile harus load tanpa error" -ForegroundColor White
Write-Host ""
