@echo off
cd /d "%~dp0"
echo Iniciando Isocrona Zero Campus...
echo.
echo Si ya habia un servidor abierto, cierra primero esa ventana para cargar la version mas reciente.
echo.
cmd /c npm.cmd start
pause
