// 強制觸發GitHub Pages部署的腳本
console.log('🚀 強制觸發GitHub Pages部署...');
console.log('⏰ 時間:', new Date().toLocaleString('zh-TW'));
console.log('');

console.log('📋 執行步驟:');
console.log('1. 創建一個小的更改來觸發部署');
console.log('2. 提交更改到GitHub');
console.log('3. 等待GitHub Pages重新部署');
console.log('');

console.log('💡 這個腳本將創建一個時間戳文件來觸發部署');

// 創建時間戳內容
const timestamp = new Date().toISOString();
const content = `# GitHub Pages部署觸發器

最後更新時間: ${timestamp}

這個文件用於觸發GitHub Pages的重新部署。
當HTML內容沒有正確更新時，修改這個文件可以強制GitHub Pages重新構建和部署網站。

## 部署狀態
- 觸發時間: ${timestamp}
- 目的: 確保PDF文件連結正確更新
- 期望結果: 網站顯示最新的PDF下載連結

## 檢查命令
\`\`\`bash
node check-website-pdf-link.js
\`\`\`
`;

require('fs').writeFileSync('GITHUB_PAGES_DEPLOY_TRIGGER.md', content);

console.log('✅ 已創建部署觸發文件: GITHUB_PAGES_DEPLOY_TRIGGER.md');
console.log('');
console.log('🔄 接下來需要執行:');
console.log('1. git add GITHUB_PAGES_DEPLOY_TRIGGER.md');
console.log('2. git commit -m "trigger: 強制觸發GitHub Pages部署"');
console.log('3. git push origin master');
console.log('4. 等待5-10分鐘後檢查部署狀態');