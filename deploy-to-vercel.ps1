#!/usr/bin/env pwsh
# Script untuk deploy ke Vercel dengan cepat

Write-Host "🚀 DEPLOY KE VERCEL - STARTING..." -ForegroundColor Cyan
Write-Host ""

# 1. Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix Vercel deployment - remove invalid runtime config and fix TypeScript errors"

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
Write-Host ""
