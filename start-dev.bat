@echo off
chcp 65001 >nul
echo ========================================
echo   SiteRais - Запуск в режиме разработки
echo ========================================
echo.

echo [1/2] Запуск API сервера (порт 3001)...
start "SiteRais API" cmd /k "cd /d %~dp0 && node server/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Запуск Vite dev-сервера (порт 5173)...
start "SiteRais Frontend" cmd /k "cd /d %~dp0 && npx vite"

echo.
echo ========================================
echo   Готово! Открой в браузере:
echo   http://localhost:5173
echo ========================================
echo.
echo API сервер:  http://localhost:3001
echo Frontend:    http://localhost:5173
echo.
pause
