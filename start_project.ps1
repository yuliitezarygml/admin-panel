# Start PlayStation Rental System
Write-Host "🚀 Launching PlayStation Rental System..." -ForegroundColor Cyan

# Get the directory where the script is located
$AppRoot = $PSScriptRoot

# 1. Start Backend in a new window
Write-Host "Starting Backend (Flask)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$AppRoot/server`"; python app.py"

# 2. Start Frontend in this window
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Green
Set-Location -Path $AppRoot
npm run dev
