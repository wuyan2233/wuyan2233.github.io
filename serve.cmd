@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   无言 · 本地预览
echo   打开 http://localhost:8080  （Ctrl+C 停止）
echo.
python -m http.server 8080
