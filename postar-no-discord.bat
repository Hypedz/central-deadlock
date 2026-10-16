@echo off
chcp 65001 >nul
title Central Deadlock - Postar no Discord
cd /d "%~dp0"

if not exist "discord-webhook.txt" (
    echo ================================================
    echo   FALTA CONFIGURAR O WEBHOOK
    echo ================================================
    echo.
    echo Crie um arquivo chamado "discord-webhook.txt" nesta pasta
    echo e cole dentro dele a URL do webhook do seu canal do Discord.
    echo.
    echo Passo a passo completo no README.md, secao "Bot do Discord".
    echo.
    pause
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo [ERRO] O Python nao foi encontrado no computador.
    echo Instale em: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

python "tools\discord-post.py" %*
echo.
pause
