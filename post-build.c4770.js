/**
 * 构建后处理脚本：自动复制 tonconnect-manifest.json 到构建输出目录
 * 
 * 此脚本已更新为使用更智能的 copy-manifest-on-build.js
 * 保留此文件以保持向后兼容
 * 
 * 使用方法：
 * node build-templates/web-mobile/post-build.js [构建输出目录]
 */

// 使用新的智能脚本
const { copyManifestFile } = require('./copy-manifest-on-build.6001a.js');

// 如果提供了命令行参数，设置环境变量
if (process.argv[2]) {
    process.env.CC_BUILD_OUTPUT_DIR = process.argv[2];
}

// 执行复制
const success = copyManifestFile();
process.exit(success ? 0 : 1);

