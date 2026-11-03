@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ============================================================
rem  CENTRAL DEADLOCK - conferencia semanal do site
rem
rem  RODAR NA MAO: dois cliques aqui.
rem
rem  Ele NAO altera nada: so confere se as fontes externas
rem  respondem, se os dados estao recentes, se os robos do GitHub
rem  estao rodando, se o site publicado esta no ar e se os links
rem  internos existem.
rem
rem  Rodar sem pausa:   conferir-site.bat /q
rem  So dados locais:   conferir-site.bat --sem-rede
rem  Aviso conta erro:  conferir-site.bat --estrito
rem ============================================================

set PYTHONIOENCODING=utf-8
setlocal EnableDelayedExpansion

rem Python instalado neste PC (se nao achar, tenta o do sistema)
set PY="C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe"
if not exist %PY% set PY=python

rem separa o /q dos outros argumentos (o Python nao entende /q)
set "ARGS="
set SEM_PAUSA=0
if not "%*"=="" for %%A in (%*) do (
    if /i "%%A"=="/q" (
        set SEM_PAUSA=1
    ) else (
        set "ARGS=!ARGS! %%A"
    )
)

echo.
echo ============================================================
echo   CENTRAL DEADLOCK - conferindo o site...
echo ============================================================
echo.

%PY% "tools\conferir-site.py" !ARGS!
set CODIGO=%ERRORLEVEL%

echo.
if "%CODIGO%"=="0" (
    echo Tudo certo. Nenhuma falha encontrada.
) else (
    echo Encontrei falhas. Leia o relatorio acima e corrija o que aparece.
)
echo.

if "%SEM_PAUSA%"=="1" exit /b %CODIGO%

pause
exit /b %CODIGO%
