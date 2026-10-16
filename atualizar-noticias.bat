@echo off
chcp 65001 >nul
title Central Deadlock - Atualizar noticias
cd /d "%~dp0"

echo ================================================
echo   CENTRAL DEADLOCK - atualizar noticias do Steam
echo ================================================
echo.

where python >nul 2>nul
if errorlevel 1 (
    echo [ERRO] O Python nao foi encontrado no computador.
    echo Instale em: https://www.python.org/downloads/
    echo ^(marque a opcao "Add Python to PATH" na instalacao^)
    echo.
    pause
    exit /b 1
)

python "tools\update-news.py"
echo.

if not exist "discord-webhook.txt" goto fim

set /p POSTAR="Postar as novidades no Discord agora? (S/N): "
if /i not "%POSTAR%"=="S" goto fim

echo.
python "tools\discord-post.py"

:fim
echo.
pause
