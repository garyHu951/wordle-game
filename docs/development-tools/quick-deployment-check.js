const https = require('https');

console.log('🚀 快速部署檢查...');
console.log('🎯 目標: https://garyhu951.github.io/wordle-game/');
console.log('⏰ 檢查時間:', new Date().toLocaleString());

const options = {
  hostname: 'garyhu951.github.io',
  path: '/wordle-game/',
  method: 'HEAD',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log('\n📊 部署狀態:');
  console.log('📡 HTTP狀態:', res.statusCode);
  console.log('📅 最後修改:', res.headers['last-modified']);
  console.log('🔧 服務器:', res.headers['server']);
  console.log('📦 內容類型:', res.headers['content-type']);
  
  if (res.statusCode === 200) {
    console.log('✅ 網站可訪問');
    
    // 檢查內容是否包含新功能
    const contentReq = https.request({
      hostname: 'garyhu951.github.io',
      path: '/wordle-game/',
      method: 'GET',
      timeout: 10000
    }, (contentRes) => {
      let data = '';
      contentRes.on('data', (chunk) => {
        data += chunk;
      });
      
      contentRes.on('end', () => {
        console.log('\n🔍 內容檢查:');
        
        // 檢查是否包含新的UI改進
        const hasShowAnswer = data.includes('SHOW ANSWER') || data.includes('HIDE ANSWER');
        const hasFixedCells = data.includes('w-12 h-12');
        const hasUnifiedPause = data.includes('bg-yellow-600');
        
        console.log('👁️  顯示答案按鍵:', hasShowAnswer ? '✅ 已更新' : '❌ 未更新');
        console.log('📦 固定方塊大小:', hasFixedCells ? '✅ 已更新' : '❌ 未更新');
        console.log('⏸️  統一暫停樣式:', hasUnifiedPause ? '✅ 已更新' : '❌ 未更新');
        
        if (hasShowAnswer && hasFixedCells && hasUnifiedPause) {
          console.log('\n🎉 部署成功！所有UI改進已生效');
        } else {
          console.log('\n⏳ 部署進行中，請稍後再檢查');
        }
      });
    });
    
    contentReq.on('error', (err) => {
      console.log('❌ 內容檢查失敗:', err.message);
    });
    
    contentReq.end();
  } else {
    console.log('❌ 網站訪問異常');
  }
});

req.on('error', (err) => {
  console.log('❌ 請求失敗:', err.message);
});

req.on('timeout', () => {
  console.log('⏰ 請求超時');
  req.destroy();
});

req.end();