@echo off
chcp 65001 >nul
title Innate Economics - منصة الاقتصاد الفطري

cd /d "%~dp0"

echo ================================================================
echo   Innate Economics Platform - منصة الاقتصاد الفطري
echo   Explorable Interactive Economics
echo ================================================================
echo.
echo   [*] Starting platform dev server and opening browser...
echo   [*] جاري تشغيل خادم المنصة وفتح المتصفح تلقائيا...
echo.
echo   [!] To stop the server at any time: Press Ctrl + C
echo ================================================================
echo.

call npm run dev -- --open

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Server stopped or encountered an error.
    echo [!] حدث خطأ أثناء تشغيل الخادم.
    echo.
    pause
)
