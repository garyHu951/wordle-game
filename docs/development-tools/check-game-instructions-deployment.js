// 檢查主頁面遊戲說明功能的部署狀態
const https = require('https');

const TARGET_URL = 'https://garyhu951.github.io/wordle-game/';

// 檢查項目
const CHECK_ITEMS = [
  {
    name: '遊戲說明按鍵',
    pattern: /HELP.*button/,
    description: 'Game instructions help button'
  },
  {
    name: '遊戲說明模態框',
    pattern: /GAME INSTRUCTIONS/,
    description: 'Game instructions modal component'
  },
  {
    name: '遊戲玩法說明',
    pattern: /HOW TO PLAY/,
    description: 'How to play section'
  },
  {
    name: '顏色指南',
    pattern: /COLOR GUIDE/,
    description: 'Color guide section'
  },
  {
    name: '遊戲模式說明',
    pattern: /GAME MODES/,
    description: 'Game modes explanation'
  },
  {
    name: '控制說明',
    pattern: /CONTROLS/,
    description: 'Controls explanation'
  },
  {
    name: '遊戲技巧',
    pattern: /TIPS.*STRATEGIES/,
    description: 'Tips and strategies section'
  }
];

function checkDeployment() {
  console.log('🔍 檢查主頁面遊戲說明功能部署狀態...');
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
        console.log('🎉 部署完成！遊戲說明功能已成功更新');
        console.log('');
        console.log('✨ 新功能說明:');
        console.log('1. 主頁面右上角添加HELP按鍵');
        console.log('2. 點擊按鍵打開詳細遊戲說明模態框');
        console.log('3. 包含完整的遊戲玩法、顏色指南、模式說明');
        console.log('4. 提供控制說明和遊戲技巧');
        console.log('5. 像素風格設計，符合遊戲主題');
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
      console.log('📱 包含模態框:', /modal/i.test(data) ? '是' : '否');
      
      // 如果部署完成，顯示測試建議
      if (passedChecks === CHECK_ITEMS.length) {
        console.log('');
        console.log('🧪 建議測試步驟:');
        console.log('1. 訪問主頁面');
        console.log('2. 檢查右上角是否有HELP按鍵');
        console.log('3. 點擊HELP按鍵打開遊戲說明');
        console.log('4. 驗證說明內容是否完整顯示');
        console.log('5. 測試點擊背景或關閉按鍵是否能關閉模態框');
      }
    });
    
  }).on('error', (err) => {
    console.error('❌ 檢查失敗:', err.message);
  });
}

// 執行檢查
checkDeployment();