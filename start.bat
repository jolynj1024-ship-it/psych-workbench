@echo off
REM 心理学工作者个人工作台 - 一键启动脚本
cd /d "%~dp0"
echo 正在启动心理学工作者个人工作台...
"C:\Users\liyua\.workbuddy\binaries\node\versions\22.22.2\node.exe" server.js
pause
