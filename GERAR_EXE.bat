@echo off
chcp 65001 >nul
title Gerar Snake Game Deluxe EXE
set "CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if not exist "%CSC%" set "CSC=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist "%CSC%" (
  echo ERRO: compilador do .NET Framework nao encontrado.
  echo Instale o .NET Framework 4.8 Developer Pack ou use um Windows com .NET Framework.
  pause
  exit /b 1
)
"%CSC%" /nologo /target:winexe /optimize+ /out:SnakeGameDeluxe.exe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll SnakeGameDeluxe.cs
if errorlevel 1 (
  echo.
  echo Falha ao compilar. Verifique as mensagens acima.
) else (
  echo.
  echo EXE criado: SnakeGameDeluxe.exe
  echo Copie somente esse EXE para outro computador Windows.
)
pause
