@echo off
chcp 65001 >nul
title Cartographer
cd /d "%~dp0"

echo ============================================
echo            CARTOGRAPHER  -  spousteni
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js neni nainstalovan.
  echo     Stahni a nainstaluj z https://nodejs.org  ^(verze LTS^)
  echo     Pak spust tento soubor znovu.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [*] Prvni spusteni: instaluji zavislosti ^(chvili to potrva^)...
  call npm install
)

if not exist "build\icon.png" (
  echo [*] Generuji ikonu...
  call npm run icon
)

if not exist "out\index.html" (
  echo [*] Sestavuji aplikaci...
  call npm run build
)

echo [*] Spoustim Cartographer...
call npx electron .

exit /b 0
