@echo off
setlocal EnableExtensions
title Graphics Studios - desktop app setup
rem Creates a desktop shortcut and makes the tasks site open automatically after Windows sign-in.
rem To undo: press Win+R, type shell:startup, delete "Graphics Studios", and delete the desktop shortcut.

set "URL=https://ggtf55555.github.io/graphics-studios/dashboard.html"
set "DIR=%LOCALAPPDATA%\GraphicsStudios"
set "EXE="

for %%P in ("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe") do (
  if not defined EXE if exist "%%~P" set "EXE=%%~P"
)

if defined EXE (
  set "ARGS=--app=%URL%"
) else (
  set "EXE=explorer.exe"
  set "ARGS=%URL%"
)

if not exist "%DIR%" mkdir "%DIR%"
set "VBS=%DIR%\launch.vbs"

rem Small launcher that waits for the network before opening the app.
> "%VBS%" echo Set sh = CreateObject("WScript.Shell")
>> "%VBS%" echo WScript.Sleep 12000
>> "%VBS%" echo sh.Run """%EXE%"" %ARGS%", 1, False

powershell -NoProfile -ExecutionPolicy Bypass -Command "$q=[char]34; $ws=New-Object -ComObject WScript.Shell; $s=$ws.CreateShortcut([Environment]::GetFolderPath('Startup')+'\Graphics Studios.lnk'); $s.TargetPath=[Environment]::SystemDirectory+'\wscript.exe'; $s.Arguments=$q+'%VBS%'+$q; $s.WorkingDirectory='%DIR%'; $s.Save(); $d=$ws.CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Graphics Studios.lnk'); $d.TargetPath='%EXE%'; $d.Arguments='%ARGS%'; if ('%EXE%' -ne 'explorer.exe') { $d.IconLocation='%EXE%,0' }; $d.Save()"

if errorlevel 1 (
  echo.
  echo Setup failed. Please follow the manual steps on the install page.
) else (
  echo.
  echo Done. A "Graphics Studios" shortcut is on your Desktop,
  echo and the app will open automatically after you sign in to Windows.
)
echo.
pause
