const fs = require('fs');
const path = require('path');

const batContent = [
  '@echo off',
  'chcp 65001 >nul',
  'title Innate Economics - منصة الاقتصاد الفطري',
  '',
  'cd /d "%~dp0"',
  '',
  'echo ================================================================',
  'echo   Innate Economics Platform - منصة الاقتصاد الفطري',
  'echo   Explorable Interactive Economics',
  'echo ================================================================',
  'echo.',
  'echo   [*] Starting platform dev server and opening browser...',
  'echo   [*] جاري تشغيل خادم المنصة وفتح المتصفح تلقائيا...',
  'echo.',
  'echo   [!] To stop the server at any time: Press Ctrl + C',
  'echo ================================================================',
  'echo.',
  '',
  'call npm run dev -- --open',
  '',
  'if %ERRORLEVEL% neq 0 (',
  '    echo.',
  '    echo [!] Server stopped or encountered an error.',
  '    echo [!] حدث خطأ أثناء تشغيل الخادم.',
  '    echo.',
  '    pause',
  ')',
  ''
].join('\r\n');

const rootDir = path.resolve(__dirname, '..');
fs.writeFileSync(path.join(rootDir, 'run.bat'), batContent, { encoding: 'utf8' });
fs.writeFileSync(path.join(rootDir, 'تشغيل_المنصة.bat'), batContent, { encoding: 'utf8' });

console.log('Successfully generated run.bat and تشغيل_المنصة.bat with CRLF UTF-8');
