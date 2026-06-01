# ═══════════════════════════════════════════════════════════════════════════════
# KILL PORTS - Membersihkan port yang digunakan
# ═══════════════════════════════════════════════════════════════════════════════
# Jalankan script ini jika mendapat error "Port already in use"
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  KILL PORTS - Membersihkan Port yang Digunakan" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Port yang akan dibersihkan
$ports = @(3000, 5173, 24678)

foreach ($port in $ports) {
    Write-Host "Checking port $port..." -ForegroundColor Yellow
    
    # Cari proses yang menggunakan port
    $connections = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    
    if ($connections) {
        foreach ($connection in $connections) {
            # Extract PID dari output netstat
            $pid = $connection.ToString() -replace '.*\s(\d+)\s*$', '$1'
            
            if ($pid -match '^\d+$') {
                try {
                    # Dapatkan nama proses
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    $processName = if ($process) { $process.ProcessName } else { "Unknown" }
                    
                    Write-Host "  Found: $processName (PID: $pid) using port $port" -ForegroundColor Red
                    
                    # Kill proses
                    taskkill /PID $pid /F | Out-Null
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  ✓ Killed process $processName (PID: $pid)" -ForegroundColor Green
                    } else {
                        Write-Host "  ✗ Failed to kill process $processName (PID: $pid)" -ForegroundColor Red
                    }
                } catch {
                    Write-Host "  ✗ Error killing PID $pid : $_" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  ✓ Port $port is free" -ForegroundColor Green
    }
    
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Done! Ports cleaned." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run: npm run dev" -ForegroundColor Yellow
Write-Host ""
