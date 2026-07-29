@echo off
title Backup dos dados do AgroGestor

echo.
echo AgroGestor - Backup dos dados
echo --------------------------------
echo Informe a senha do banco quando ela for solicitada.
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-local.ps1" ^
  -OnlyDatabase ^
  -DatabaseHost "ep-icy-darkness-actth13o.sa-east-1.aws.neon.tech" ^
  -DatabaseName "neondb" ^
  -DatabaseUser "neondb_owner"

echo.
if errorlevel 1 (
  echo O backup nao foi concluido. Confira a mensagem acima.
) else (
  echo O backup foi salvo em Documentos\AgroGestor-Backups.
)

echo.
pause
