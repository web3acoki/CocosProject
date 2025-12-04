@echo off
REM 构建后自动复制 tonconnect-manifest.json 文件
REM 使用方法：在构建完成后运行此脚本

set "PROJECT_ROOT=%~dp0"
set "SOURCE_FILE=%PROJECT_ROOT%assets\Scripts\Test\tonconnect-manifest.json"
set "TARGET_FILE=%PROJECT_ROOT%XDiving\web-mobile\tonconnect-manifest.json"

echo 正在复制 tonconnect-manifest.json...
echo 源文件: %SOURCE_FILE%
echo 目标文件: %TARGET_FILE%

if not exist "%SOURCE_FILE%" (
    echo 错误: 源文件不存在: %SOURCE_FILE%
    pause
    exit /b 1
)

copy /Y "%SOURCE_FILE%" "%TARGET_FILE%" >nul
if %errorlevel% equ 0 (
    echo 成功: tonconnect-manifest.json 已复制到构建输出目录
) else (
    echo 错误: 复制失败
    pause
    exit /b 1
)

pause

