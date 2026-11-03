@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   青冥集 · 本地预览
echo   打开 http://localhost:8080  （按 Ctrl+C 停止）
echo.
python -m http.server 8080
