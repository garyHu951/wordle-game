// 部署狀態檢查腳本
const https = require('https');

const SITE_URL = 'https://garyhu951.github.io/wordle-game/';
const CHECK_INTERVAL = 30000; // 30秒檢查一次
const MAX_ATTEMPTS = 20; // 最多檢查20次（10分鐘）

let attempts = 0;

function checkDeployment() {
  attempts++;
  console.log(`\n🔍 檢查部署狀態 (第 ${attempts} 次)...`);
  
  const options = {
    hostname: 'garyhu951.github.io',
    path: '/wordle-game/',
    method: 'HEAD',
    timeout: 10000
  };

  const req = https.request(options, (res) => {
    console.log(`📡 HTTP狀態: ${res.statusCode}`);
    console.log(`📅 最後修改: ${res.headers['last-modified'] || '未知'}`);
    
    if (res.statusCode === 200) {
      console.log('✅ 網站可訪問！');
      
      // 檢查是否包含新功能
      checkForNewFeatures();
    } else {
      console.log(`❌ 網站返回狀態碼: ${res.statusCode}`);
      scheduleNextCheck();
    }
  });

  req.on('error', (err) => {
    console.log(`❌ 連接錯誤: ${err.message}`);
    scheduleNextCheck();
  });

  req.on('timeout', () => {
    console.log('⏰ 請求超時');
    req.destroy();
    scheduleNextCheck();
  });

  req.end();
}

function checkForNewFeatures() {
  console.log('🔍 檢查新功能是否部署...');
  
  const options = {
    hostname: 'garyhu951.github.io',
    path: '/wordle-game/',
    method: 'GET',
    timeout: 15000
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      // 檢查是否包含新的連結面板
      const hasLinksPanel = data.includes('LINKS') || data.includes('GAME SITE') || data.includes('REPORT');
      
      if (hasLinksPanel) {
        console.log('🎉 新功能已成功部署！');
        console.log('✅ 右下角連結面板已上線');
        console.log('🔗 請訪問網站查看: ' + SITE_URL);
        process.exit(0);
      } else {
        console.log('⚠️  網站可訪問但新功能尚未部署');
        scheduleNextCheck();
      }
    });
  });

  req.on('error', (err) => {
    console.log(`❌ 檢查新功能時出錯: ${err.message}`);
    scheduleNextCheck();
  });

  req.on('timeout', () => {
    console.log('⏰ 檢查新功能超時');
    req.destroy();
    scheduleNextCheck();
  });

  req.end();
}

function scheduleNextCheck() {
  if (attempts >= MAX_ATTEMPTS) {
    console.log('\n❌ 已達到最大檢查次數，請手動檢查部署狀態');
    console.log('🔗 網站地址: ' + SITE_URL);
    console.log('📊 GitHub Actions: https://github.com/garyHu951/wordle-game/actions');
    process.exit(1);
  }
  
  console.log(`⏳ ${CHECK_INTERVAL/1000}秒後進行下次檢查...`);
  setTimeout(checkDeployment, CHECK_INTERVAL);
}

console.log('🚀 開始監控部署狀態...');
console.log('🎯 目標網站: ' + SITE_URL);
console.log('⏰ 檢查間隔: ' + (CHECK_INTERVAL/1000) + '秒');
console.log('🔢 最大嘗試次數: ' + MAX_ATTEMPTS);

// 立即開始第一次檢查
checkDeployment();