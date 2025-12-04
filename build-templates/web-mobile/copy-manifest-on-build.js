/**
 * 构建时自动复制 tonconnect-manifest.json 到构建输出目录
 * 
 * 此脚本设计为在 Cocos Creator 构建过程中自动执行
 * 它会自动检测构建输出目录并复制 manifest 文件
 * 
 * 检测构建输出目录的优先级：
 * 1. 环境变量 CC_BUILD_OUTPUT_DIR
 * 2. 命令行参数
 * 3. 当前工作目录（如果包含构建输出文件）
 * 4. 脚本所在目录（构建时脚本会被复制到输出目录）
 */

const fs = require('fs');
const path = require('path');

// 获取项目根目录（从指定目录向上查找）
function findProjectRoot(startDir) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    
    // 最多向上查找 10 层
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

// 检查目录是否是构建输出目录
function isBuildOutputDir(dir) {
    const buildIndicators = [
        'index.html',
        'main.js',
        'application.js',
        'src',
        'assets'
    ];
    
    for (const indicator of buildIndicators) {
        if (fs.existsSync(path.join(dir, indicator))) {
            return true;
        }
    }
    return false;
}

// 获取构建输出目录
function getBuildOutputDir() {
    // 方法1: 从环境变量获取（Cocos Creator 可能设置）
    if (process.env.CC_BUILD_OUTPUT_DIR) {
        const dir = path.resolve(process.env.CC_BUILD_OUTPUT_DIR);
        if (fs.existsSync(dir)) {
            return dir;
        }
    }
    
    // 方法2: 从命令行参数获取
    if (process.argv.length > 2) {
        const dir = path.resolve(process.argv[2]);
        if (fs.existsSync(dir)) {
            return dir;
        }
    }
    
    // 方法3: 从当前工作目录检测
    const cwd = process.cwd();
    if (isBuildOutputDir(cwd)) {
        return cwd;
    }
    
    // 方法4: 从脚本所在目录检测（构建时脚本会被复制到输出目录）
    const scriptDir = __dirname;
    if (isBuildOutputDir(scriptDir)) {
        return scriptDir;
    }
    
    // 方法5: 尝试常见的构建输出路径
    const commonPaths = [
        path.join(scriptDir, '..', '..', 'XDiving', 'web-mobile'),
        path.join(process.cwd(), 'web-mobile'),
        path.join(process.cwd(), 'build', 'web-mobile'),
    ];
    
    for (const commonPath of commonPaths) {
        const resolvedPath = path.resolve(commonPath);
        if (fs.existsSync(resolvedPath) && isBuildOutputDir(resolvedPath)) {
            return resolvedPath;
        }
    }
    
    return null;
}

// 复制 manifest 文件
function copyManifestFile() {
    try {
        const buildOutputDir = getBuildOutputDir();
        
        if (!buildOutputDir) {
            console.warn('⚠️ 无法确定构建输出目录');
            console.warn('   尝试的方法:');
            console.warn('   1. 环境变量 CC_BUILD_OUTPUT_DIR:', process.env.CC_BUILD_OUTPUT_DIR || '未设置');
            console.warn('   2. 命令行参数:', process.argv[2] || '未提供');
            console.warn('   3. 当前工作目录:', process.cwd());
            console.warn('   4. 脚本所在目录:', __dirname);
            return false;
        }
        
        console.log('📦 构建输出目录:', buildOutputDir);
        
        // 查找项目根目录
        let projectRoot = findProjectRoot(buildOutputDir);
        
        // 如果从构建输出目录找不到，尝试从脚本所在目录向上查找
        if (!projectRoot) {
            projectRoot = findProjectRoot(__dirname);
        }
        
        // 如果还是找不到，尝试从当前工作目录向上查找
        if (!projectRoot) {
            projectRoot = findProjectRoot(process.cwd());
        }
        
        if (!projectRoot) {
            console.warn('⚠️ 无法找到项目根目录');
            console.warn('   请确保项目根目录包含 assets/Scripts/Test/tonconnect-manifest.json');
            return false;
        }
        
        console.log('📁 项目根目录:', projectRoot);
        
        const sourceFile = path.join(projectRoot, 'assets', 'Scripts', 'Test', 'tonconnect-manifest.json');
        const targetFile = path.join(buildOutputDir, 'tonconnect-manifest.json');
        
        if (!fs.existsSync(sourceFile)) {
            console.error('❌ 源文件不存在:', sourceFile);
            return false;
        }
        
        // 确保目标目录存在
        const targetDir = path.dirname(targetFile);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
            console.log('📂 创建目标目录:', targetDir);
        }
        
        // 复制文件
        fs.copyFileSync(sourceFile, targetFile);
        console.log('✅ tonconnect-manifest.json 已成功复制');
        console.log('   源文件:', sourceFile);
        console.log('   目标文件:', targetFile);
        
        // 验证文件内容
        try {
            const content = fs.readFileSync(targetFile, 'utf8');
            const manifest = JSON.parse(content);
            console.log('✅ 文件验证成功');
            console.log('   URL:', manifest.url);
            console.log('   名称:', manifest.name);
            if (manifest.iconUrl) {
                console.log('   图标:', manifest.iconUrl);
            }
        } catch (e) {
            console.warn('⚠️ 文件验证失败:', e.message);
        }
        
        return true;
    } catch (error) {
        console.error('❌ 复制 manifest 文件失败:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        return false;
    }
}

// 执行复制
if (require.main === module) {
    // 如果直接运行此脚本
    const success = copyManifestFile();
    process.exit(success ? 0 : 1);
} else {
    // 如果被其他模块引入
    module.exports = { copyManifestFile, getBuildOutputDir, findProjectRoot };
}

