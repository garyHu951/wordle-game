const https = require('https');

console.log('🔍 檢查答案按鍵圖標更新...');
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
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n🔍 答案按鍵圖標檢查:');
    
    // 檢查新的圖標實現
    const hasShowAnswerIcon = data.includes('👁️ SHOW ANSWER');
    const hasHideAnswerIcon = data.includes('🙈 HIDE ANSWER');
    const hasOldImplementation = data.includes('👁️ {showAnswer');
    
    // 檢查其他UI改進
    const hasUnifiedPauseStyle = data.includes('bg-yellow-600');
    const hasFixedCellSize = data.includes('w-12 h-12');
    const hasColoredAnswerButtons = data.includes('bg-blue-600') && data.includes('bg-red-600');
    
    console.log('👁️  顯示答案圖標 (👁️):', hasShowAnswerIcon ? '✅ 已更新' : '❌ 未更新');
    console.log('🙈 隱藏答案圖標 (🙈):', hasHideAnswerIcon ? '✅ 已更新' : '❌ 未更新');
    console.log('🔄 移除舊實現:', !hasOldImplementation ? '✅ 已清理' : '❌ 仍存在');
    console.log('🎨 統一暫停樣式:', hasUnifiedPauseStyle ? '✅ 已更新' : '❌ 未更新');
    console.log('📦 固定方塊大小:', hasFixedCellSize ? '✅ 已更新' : '❌ 未更新');
    console.log('🌈 答案按鍵顏色:', hasColoredAnswerButtons ? '✅ 已更新' : '❌ 未更新');
    
    // 計算更新進度
    const iconUpdates = [hasShowAnswerIcon, hasHideAnswerIcon, !hasOldImplementation];
    const allUpdates = [hasShowAnswerIcon, hasHideAnswerIcon, !hasOldImplementation, hasUnifiedPauseStyle, hasFixedCellSize, hasColoredAnswerButtons];
    
    const iconProgress = iconUpdates.filter(Boolean).length;
    const totalProgress = allUpdates.filter(Boolean).length;
    
    console.log('\n📈 圖標更新進度:', `${iconProgress}/3 (${Math.round((iconProgress / 3) * 100)}%)`);
    console.log('📈 總體更新進度:', `${totalProgress}/6 (${Math.round((totalProgress / 6) * 100)}%)`);
    
    if (iconProgress === 3) {
      console.log('\n🎉 答案按鍵圖標更新成功！');
      console.log('✨ 新圖標已生效：👁️ SHOW ANSWER / 🙈 HIDE ANSWER');
    } else if (iconProgress > 0) {
      console.log('\n🔄 圖標更新部分生效，完整部署進行中...');
    } else {
      console.log('\n⏳ 圖標更新仍在部署中，請稍後再檢查');
    }
    
    if (totalProgress === 6) {
      console.log('\n🏆 所有UI改進已完全部署！');
    }
    
    // 顯示調試信息
    console.log('\n🔧 調試信息:');
    console.log('📄 頁面大小:', data.length, 'bytes');
    console.log('🎮 包含遊戲邏輯:', data.includes('wordle') || data.includes('Wordle') ? '是' : '否');
    console.log('⚛️  包含React:', data.includes('React') ? '是' : '否');
    
    // 檢查特定的提交標識
    const hasLatestCommit = data.includes('8450af5') || data.includes('6c8010e');
    console.log('🔖 包含最新提交:', hasLatestCommit ? '是' : '否');
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