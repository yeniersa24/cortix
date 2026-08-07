@echo off
REM Arranca el servidor de desarrollo usando el Node instalado en Program Files
REM (no hace falta tenerlo en el PATH).
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
call npm run dev -- -p 3001
