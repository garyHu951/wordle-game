#!/usr/bin/env node

const https = require('https');

// 檢查 URL 的函數
function checkUrl(url, name) {
  return new Promise((resolve) => {
    const request = https.get(url, (response) => {
      console.log(`✅ ${name}: ${response.statusCode} ${response.statusMessage}`);
      resolve({ name, status: response.statusCode, success: response.statusCode === 200 });
    });
    
    request.on('error', (error) => {
      console.log(`❌ ${name}: ${error.message}`);
      resolve({ name, status: 'ERROR', success: false, error: error.message });
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      console.log(`⏰ ${name}: 請求超時`);
      resolve({ name, status: 'TIMEOUT', success: false });
    });
  });
}

async function checkDeployment() {
  console.log('🔍 檢查部署狀態...\n');
  
  const checks = [
    { url: 'https://garyHu951.github.io/wordle-game/', name: '前端 (GitHub Pages)' },
    { url: 'https://wordle-game-57ta.onrender.com/health', name: '後端健康檢查 (Render)' },
    { url: 'https://wordle-game-57ta.onrender.com/api/words/5', name: '後端 API (Render)' }
  ];
  
  const results = await Promise.all(
    checks.map(check => checkUrl(check.url, check.name))
  );
  
  console.log('\n📊 部署狀態總結:');
  console.log('==================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  if (successful === total) {
    console.log('🎉 所有服務都正常運行！');
  } else {
    console.log(`⚠️  ${successful}/${total} 服務正常運行`);
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\n❌ 需要注意的服務:');
      failed.forEach(f => {
        console.log(`   - ${f.name}: ${f.status}`);
      });
    }
  }
  
  console.log('\n📋 下一步操作:');
  
  if (results.find(r => r.name.includes('GitHub Pages') && !r.success)) {
    console.log('1. 檢查 GitHub Actions: https://github.com/garyHu951/wordle-game/actions');
    console.log('2. 確認 GitHub Pages 設置: https://github.com/garyHu951/wordle-game/settings/pages');
  }
  
  if (results.find(r => r.name.includes('Render') && !r.success)) {
    console.log('3. 檢查 Render 服務: https://dashboard.render.com/web/srv-d53mgnre5dus73b12hjg');
    console.log('4. 如果服務休眠，請手動觸發部署或等待自動喚醒');
  }
  
  console.log('\n⏱️  建議每 2-3 分鐘重新檢查一次，直到所有服務正常');
}

checkDeployment().catch(console.error);