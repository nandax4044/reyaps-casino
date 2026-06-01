# ═══════════════════════════════════════════════════════════════════════════════
# CLEAR CACHE AND START - Membersihkan cache dan start server
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CLEAR CACHE AND START SERVER" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Kill ports yang digunakan
Write-Host "1. Killing ports..." -ForegroundColor Yellow
$ports = @(3000, 5173, 24678)
foreach ($port in $ports) {
    $connections = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    if ($connections) {
        foreach ($connection in $connections) {
            $pid = $connection.ToString() -replace '.*\s(\d+)\s*$', '$1'
            if ($pid -match '^\d+$') {
                taskkill /PID $pid /F 2>&1 | Out-Null
                Write-Host "   Killed process on port $port (PID: $pid)" -ForegroundColor Green
            }
        }
    }
}

# Clear TypeScript cache
Write-Host ""
Write-Host "2. Clearing TypeScript cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "   ✓ Cleared node_modules/.cache" -ForegroundColor Green
}

# Clear Vite cache
if (Test-Path ".vite") {
    Remove-Item -Recurse -Force ".vite"
    Write-Host "   ✓ Cleared .vite" -ForegroundColor Green
}

# Clear dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "   ✓ Cleared dist" -ForegroundColor Green
}

Write-Host ""
Write-Host "3. Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Start server
npm run dev
