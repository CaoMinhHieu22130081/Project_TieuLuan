@echo off
setlocal
set AI_MODULE_PORT=8000
for /f %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort %AI_MODULE_PORT% -State Listen ^| Select-Object -ExpandProperty OwningProcess -Unique"') do (
    echo Stopping process on port %AI_MODULE_PORT% (PID %%a)
    taskkill /PID %%a /F >nul 2>nul
)
cd /d "%~dp0"
call .venv\Scripts\python.exe run_server.py
