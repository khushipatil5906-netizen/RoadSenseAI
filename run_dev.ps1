# RoadSense AI — One-Click Development Launcher for Windows PowerShell
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   RoadSense AI - Road Damage Severity & Priority Engine   " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend Server
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -PassThru

# 2. Start Vite Frontend Server
Write-Host "[2/2] Starting Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "frontend"

Write-Host "`nAll services launched successfully!" -ForegroundColor Cyan
Write-Host "Frontend Portal:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend REST API: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "`nDemo Accounts Available:" -ForegroundColor Yellow
Write-Host " - Inspector: inspector@roadsense.gov / RoadSense123!" -ForegroundColor White
Write-Host " - Citizen:   citizen@example.com   / RoadSense123!" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
