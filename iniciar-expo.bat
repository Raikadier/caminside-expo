@echo off
chcp 65001 >nul
title CamInside — Servidor Expo

echo.
echo  ══════════════════════════════════════════════════
echo    CamInside  ^|  Iniciar Servidor de Exposicion
echo  ══════════════════════════════════════════════════
echo.

:: ── Verificar Node.js ─────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo  ERROR: Node.js no encontrado. Instalalo desde https://nodejs.org
    pause & exit /b 1
)

:: ── Obtener IP local ──────────────────────────────────────────
for /f %%i in ('powershell -NoProfile -Command ^
  "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress"') do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" set LOCAL_IP=^<Tu IP aqui^>

:: ── Instrucciones ─────────────────────────────────────────────
echo.
echo  ┌─────────────────────────────────────────────────┐
echo  │  Diapositiva:  http://localhost:3000            │
echo  │  App movil:    http://%LOCAL_IP%:3000    │
echo  └─────────────────────────────────────────────────┘
echo.
echo  Ingresa  http://%LOCAL_IP%:3000  en la app CamInside.
echo  (PC y telefono deben estar en el mismo WiFi)
echo.

:: ── Instalar dependencias si es la primera vez ────────────────
cd /d "%~dp0"
if not exist "node_modules\" (
    echo  Instalando dependencias npm por primera vez...
    call npm install
    echo.
)

:: ── Abrir servidor en ventana separada y browser ─────────────
start "CamInside — Servidor" cmd /k "cd /d "%~dp0" && node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo  Listo. Puedes cerrar esta ventana.
pause
