@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ============================================================
rem  CENTRAL DEADLOCK - atualizar noticias + estatisticas + Discord
rem
rem  RODAR NA MAO (para postar na hora): dois cliques aqui.
rem
rem  OBS: o trabalho do dia a dia agora e feito pelo GitHub,
rem  sozinho, todo dia as 09:00 (horario de Brasilia) - nao
rem  depende do seu PC estar ligado. Este arquivo aqui e so
rem  para quando voce quiser atualizar/postar na hora.
rem
rem  Rodar sem janela:   atualizar-tudo.bat /q
rem ============================================================

rem evita erro de acento quando o texto vai para o arquivo de registro
set PYTHONIOENCODING=utf-8

rem Python instalado neste PC (se nao achar, tenta o do sistema)
set PY="C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe"
if not exist %PY% set PY=python

rem Git instalado neste PC (se nao achar, tenta o do sistema)
set GIT="C:\Program Files\Git\cmd\git.exe"
if not exist %GIT% set GIT=git

set LOG=%~dp0data\atualizacoes.log

rem se o registro ficar grande demais, guarda o antigo e comeca de novo
for %%A in ("%LOG%") do if %%~zA GTR 300000 move /y "%LOG%" "%~dp0data\atualizacoes-antigas.log" >nul 2>&1

echo. >> "%LOG%"
echo ================= %DATE% %TIME% ================= >> "%LOG%"

rem --- pega o que o robo do GitHub ja postou (evita postar a mesma noticia 2x) ---
%GIT% pull --ff-only --quiet >> "%LOG%" 2>&1

%PY% "tools\update-news.py" >> "%LOG%" 2>&1
%PY% "tools\update-stats.py" >> "%LOG%" 2>&1
%PY% "tools\discord-post.py" >> "%LOG%" 2>&1

rem --- avisa o GitHub do que ja foi postado aqui (evita postar de novo la) ---
%GIT% add data/ >> "%LOG%" 2>&1
%GIT% commit -m "Registro de postagens atualizado (pelo PC)" --quiet >> "%LOG%" 2>&1
%GIT% push --quiet >> "%LOG%" 2>&1

echo --- fim --- >> "%LOG%"

rem quando rodar com /q, nao mostra nada
if /i "%~1"=="/q" exit /b 0

echo.
echo ============================================================
echo   Resultado da atualizacao (as ultimas linhas):
echo ============================================================
echo.
powershell -NoProfile -Command "Get-Content '%LOG%' -Tail 25"
echo.
echo (o registro completo esta em data\atualizacoes.log)
echo.
pause
