@echo off
chcp 65001 >nul
echo Останавливаю серверы...
taskkill /FI "WINDOWTITLE eq SiteRais API*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq SiteRais Frontend*" /F >nul 2>&1
echo Готово!
pause
