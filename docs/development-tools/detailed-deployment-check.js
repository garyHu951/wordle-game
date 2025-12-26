const https = require('https');

console.log('🔍 詳細部署檢查...');
console.log('🎯 目標: https://garyhu951.github.io/wordle-game/');
console.log('⏰ 檢查時間:', new Date().toLocaleString());

const options = {
  hostname: 'garyhu951.github.io',
  path: '/wordle-game/',
  method: 'GET',
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

const req = https.request(options, (res) => {
  console.log('\n📊 響應狀態:');
  console.log('📡 HTTP狀態:', res.statusCode);
  console.log('📅 最後修改:', res.headers['last-modified']);
  console.log('🔧 服務器:', res.headers['server']);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n🔍 詳細內容檢查:');
    
    // 檢查暫停按鍵文字簡化
    const hasPauseOnly = data.includes('⏸️ PAUSE') && !data.includes('▶️ RESUME');
    const hasPauseText = data.includes('PAUSE') && !data.includes('RESUME');
    
    // 檢查顯示答案按鍵顏色
    const hasShowAnswerColors = data.includes('bg-blue-600') && data.includes('bg-red-600');
    const hasShowHideAnswer = data.includes('SHOW ANSWER') && data.includes('HIDE ANSWER');
    
    // 檢查固定方塊大小
    const hasFixedCellSize = data.includes('w-12 h-12') && !data.includes('w-10 h-10');
    
    // 檢查統一暫停樣式
    const hasUnifiedPauseStyle = data.includes('bg-yellow-600');
    
    // 檢查是否包含新的commit標識
    const hasRecentUpdate = data.includes('UI Improvements') || data.includes('ccd0b0e') || data.includes('251e14c');
    
    console.log('⏸️  暫停按鍵文字簡化:', hasPauseOnly ? '✅ 已更新' : '❌ 未更新');
    console.log('🎨 暫停按鍵樣式統一:', hasUnifiedPauseStyle ? '✅ 已更新' : '❌ 未更新');
    console.log('👁️  顯示答案按鍵顏色:', hasShowAnswerColors ? '✅ 已更新' : '❌ 未更新');
    console.log('📝 顯示答案按鍵文字:', hasShowHideAnswer ? '✅ 已更新' : '❌ 未更新');
    console.log('📦 固定方塊大小:', hasFixedCellSize ? '✅ 已更新' : '❌ 未更新');
    console.log('🔄 最新提交標識:', hasRecentUpdate ? '✅ 包含' : '❌ 未包含');
    
    // 計算更新進度
    const updates = [hasPauseOnly, hasUnifiedPauseStyle, hasShowAnswerColors, hasShowHideAnswer, hasFixedCellSize];
    const completedUpdates = updates.filter(Boolean).length;
    const totalUpdates = updates.length;
    const progress = Math.round((completedUpdates / totalUpdates) * 100);
    
    console.log('\n📈 部署進度:', `${completedUpdates}/${totalUpdates} (${progress}%)`);
    
    if (completedUpdates === totalUpdates) {
      console.log('\n🎉 所有UI改進已成功部署！');
      console.log('✨ 可以開始測試新功能了');
    } else if (completedUpdates > 0) {
      console.log('\n🔄 部分更新已生效，完整部署進行中...');
    } else {
      console.log('\n⏳ 部署仍在進行中，請稍後再檢查');
    }
    
    // 顯示一些調試信息
    console.log('\n🔧 調試信息:');
    console.log('📄 頁面大小:', data.length, 'bytes');
    console.log('🏷️  包含React:', data.includes('React') ? '是' : '否');
    console.log('🎮 包含遊戲邏輯:', data.includes('wordle') || data.includes('Wordle') ? '是' : '否');
  });
});

req.on('error', (err) => {
  console.log('❌ 請求失敗:', err.message);
});

req.on('timeout', () => {
  console.log('⏰ 請求超時');
  req.destroy();
});

req.end();