/**
 * 构建后处理脚本：自动复制 tonconnect-manifest.json 到构建输出目录
 * 
 * 此脚本已更新为使用更智能的 copy-manifest-on-build.js
 * 保留此文件以保持向后兼容
 */

// 使用新的智能脚本
try {
    const { copyManifestFile } = require('./copy-manifest-on-build');
    copyManifestFile();
} catch (error) {
    // 如果新脚本不存在，使用旧逻辑
    const fs = require('fs');
    const path = require('path');
    
    // 构建输出目录（当前脚本所在目录）
    const buildOutputDir = __dirname;
    
    // 向上查找项目根目录
    function findProjectRoot(startDir) {
        let currentDir = path.resolve(startDir);
        const root = path.parse(currentDir).root;
        
        let depth = 0;
        while (currentDir !== root && depth < 10) {
            const manifestPath = path.join(currentDir, 'assets', 'Scripts', 'Test', 'tonconnect-manifest.json');
            if (fs.existsSync(manifestPath)) {
                return currentDir;
            }
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break;
            currentDir = parentDir;
            depth++;
        }
        return null;
    }
    
    const projectRoot = findProjectRoot(buildOutputDir);
    
    if (projectRoot) {
        const sourceFile = path.join(projectRoot, 'assets', 'Scripts', 'Test', 'tonconnect-manifest.json');
        const targetFile = path.join(buildOutputDir, 'tonconnect-manifest.json');
        
        if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, targetFile);
            console.log('✅ tonconnect-manifest.json 已复制到构建输出目录');
        }
    }
}
