#!/bin/bash
# 构建后自动复制 tonconnect-manifest.json 文件
# 使用方法：在构建完成后运行此脚本
# chmod +x copy-manifest.sh
# ./copy-manifest.sh

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
SOURCE_FILE="$PROJECT_ROOT/assets/Scripts/Test/tonconnect-manifest.json"
TARGET_FILE="$PROJECT_ROOT/XDiving/web-mobile/tonconnect-manifest.json"

echo "正在复制 tonconnect-manifest.json..."
echo "源文件: $SOURCE_FILE"
echo "目标文件: $TARGET_FILE"

if [ ! -f "$SOURCE_FILE" ]; then
    echo "错误: 源文件不存在: $SOURCE_FILE"
    exit 1
fi

cp "$SOURCE_FILE" "$TARGET_FILE"
if [ $? -eq 0 ]; then
    echo "成功: tonconnect-manifest.json 已复制到构建输出目录"
else
    echo "错误: 复制失败"
    exit 1
fi

