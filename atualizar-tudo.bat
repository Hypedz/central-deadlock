@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem ============================================================
rem  CENTRAL DEADLOCK - atualizar noticias + postar no Discord
rem
rem  Este e o arquivo que o Agendador de Tarefas do Windows
rem  executa sozinho, duas vezes por dia. Voce nao precisa
rem  clicar em nada.
rem
rem  Rodar na mao (para ver o resultado): dois cliques aqui
rem  Rodar sem janela (pelo Agendador):   atualizar-tudo.bat /q
rem ============================================================

rem evita erro de acento quando o texto vai para o arquivo de registro
set PYTHONIOENCODING=utf-8

rem Python instalado neste PC (se nao achar, tenta o do sistema)
set PY="C:\Users\User\AppData\Local\Programs\Python\Python312\python.exe"
if not exist %PY% set PY=python

set LOG=%~dp0data\atualizacoes.log

rem se o registro ficar grande demais, guarda o antigo e comeca de novo
for %%A in ("%LOG%") do if %%~zA GTR 300000 move /y "%LOG%" "%~dp0data\atualizacoes-antigas.log" >nul 2>&1

echo. >> "%LOG%"
echo ================= %DATE% %TIME% ================= >> "%LOG%"

%PY% "tools\update-news.py" >> "%LOG%" 2>&1
%PY% "tools\discord-post.py" >> "%LOG%" 2>&1

echo --- fim --- >> "%LOG%"

rem quando rodar pelo Agendador (com /q), nao mostra nada
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
