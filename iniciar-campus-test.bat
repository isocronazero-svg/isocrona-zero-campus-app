@echo off
cd /d "%~dp0"
echo Iniciando Isocrona Zero Campus en modo campus-test...
echo.
echo 1. Copia .env.campus-test.example a .env y ajusta la URL publica.
echo 2. Revisa tambien SMTP si quieres correo real.
echo.
cmd /c npm.cmd start
pause
