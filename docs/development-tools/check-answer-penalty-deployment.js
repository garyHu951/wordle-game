// 檢查對戰模式看答案功能UI改進的部署狀態
const https = require('https');

const TARGET_URL = 'https://garyhu951.github.io/wordle-game/';

// 檢查項目
const CHECK_ITEMS = [
  {
    name: '答案顯示區域英文警告',
    pattern: /ROUND SCORE: 0 PTS.*ANSWER VIEWED/,
    description: 'Answer display area penalty warning in English'
  },
  {
    name: '彈出提示英文化',
    pattern: /ANSWER VIEWED! ROUND SCORE: 0 PTS/,
    description: 'Popup warning messages in English'
  },
  {
    name: '獲勝提示英文化',
    pattern: /ROUND WON! BUT 0 PTS.*ANSWER VIEWED/,
    description: 'Win message with penalty in English'
  },
  {
    name: '對手獲勝提示英文化',
    pattern: /ANSWER VIEWED, 0 PTS/,
    description: 'Opponent win message in English'
  }
];

function checkDeployment() {
  console.log('🔍 檢查對戰模式看答案功能UI改進部署狀態...');
  console.log('🎯 目標:', TARGET_URL);
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');

  https.get(TARGET_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 響應狀態:');
      console.log('📡 HTTP狀態:', res.statusCode);
      console.log('📅 最後修改:', res.headers['last-modified'] || '未知');
      console.log('🔧 服務器:', res.headers.server || '未知');
      console.log('');
      
      console.log('🔍 功能檢查結果:');
      let passedChecks = 0;
      
      CHECK_ITEMS.forEach((item, index) => {
        const found = item.pattern.test(data);
        const status = found ? '✅' : '❌';
        const statusText = found ? '已部署' : '未更新';
        
        console.log(`${status} ${item.name}: ${statusText}`);
        if (found) passedChecks++;
      });
      
      console.log('');
      console.log('📈 部署進度:', `${passedChecks}/${CHECK_ITEMS.length} (${Math.round(passedChecks/CHECK_ITEMS.length*100)}%)`);
      
      if (passedChecks === CHECK_ITEMS.length) {
        console.log('🎉 部署完成！所有功能已成功更新');
        console.log('');
        console.log('✨ 新功能說明:');
        console.log('1. 答案顯示區域顯示英文得分懲罰提示');
        console.log('2. 所有提示信息統一使用像素風格英文');
        console.log('3. 移除按鈕下方的額外文字提示');
        console.log('4. 保持紅色文字和動畫效果');
      } else if (passedChecks > 0) {
        console.log('🔄 部分功能已部署，其餘功能部署中...');
      } else {
        console.log('⏳ 部署仍在進行中，請稍後再檢查');
      }
      
      console.log('');
      console.log('🔧 調試信息:');
      console.log('📄 頁面大小:', data.length, 'bytes');
      console.log('🏷️ 包含React:', /React/.test(data) ? '是' : '否');
      console.log('🎮 包含遊戲邏輯:', /wordle|game/i.test(data) ? '是' : '否');
      
      // 如果部署完成，顯示測試建議
      if (passedChecks === CHECK_ITEMS.length) {
        console.log('');
        console.log('🧪 建議測試步驟:');
        console.log('1. 進入對戰模式');
        console.log('2. 點擊看答案按鈕');
        console.log('3. 檢查答案區域是否顯示英文得分懲罰提示');
        console.log('4. 驗證所有提示信息都是像素風格英文');
      }
    });
    
  }).on('error', (err) => {
    console.error('❌ 檢查失敗:', err.message);
  });
}

// 執行檢查
checkDeployment();