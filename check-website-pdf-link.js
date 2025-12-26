// 檢查網站是否包含正確的PDF連結
const https = require('https');

const SITE_URL = 'https://garyhu951.github.io/wordle-game/';
const EXPECTED_PDF_NAME = '(第25組) 期末專案成果-01157123+01257004.pdf';

function checkWebsitePDFLink() {
  console.log('🔍 檢查網站PDF連結更新狀態...');
  console.log('🎯 目標:', SITE_URL);
  console.log('📄 期望PDF:', EXPECTED_PDF_NAME);
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');

  https.get(SITE_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 網站響應狀態:');
      console.log('📡 HTTP狀態:', res.statusCode);
      console.log('📅 最後修改:', res.headers['last-modified'] || '未知');
      console.log('📏 內容大小:', data.length, 'bytes');
      console.log('');
      
      // 檢查是否包含新的PDF連結
      const newPdfPattern = /\(第25組\) 期末專案成果-01157123\+01257004\.pdf/g;
      const oldPdfPattern1 = /第25組期末專案成果-01157123\+01257004\.pdf/g;
      const oldPdfPattern2 = /\(第25組\)期末專案成果-01157123\+01257004\.pdf/g;
      
      const newMatches = data.match(newPdfPattern);
      const oldMatches1 = data.match(oldPdfPattern1);
      const oldMatches2 = data.match(oldPdfPattern2);
      
      console.log('🔍 PDF連結檢查結果:');
      
      if (newMatches && newMatches.length > 0) {
        console.log('✅ 找到新的PDF連結:', newMatches.length, '個');
        console.log('   格式: (第25組) 期末專案成果-01157123+01257004.pdf');
      } else {
        console.log('❌ 未找到新的PDF連結');
      }
      
      if (oldMatches1 && oldMatches1.length > 0) {
        console.log('⚠️  找到舊的PDF連結 (格式1):', oldMatches1.length, '個');
        console.log('   格式: 第25組期末專案成果-01157123+01257004.pdf');
      }
      
      if (oldMatches2 && oldMatches2.length > 0) {
        console.log('⚠️  找到舊的PDF連結 (格式2):', oldMatches2.length, '個');
        console.log('   格式: (第25組)期末專案成果-01157123+01257004.pdf');
      }
      
      // 檢查REPORT按鍵
      if (data.includes('📄 REPORT')) {
        console.log('✅ 找到REPORT按鍵');
      } else {
        console.log('❌ 未找到REPORT按鍵');
      }
      
      // 檢查LINKS區域
      if (data.includes('LINKS')) {
        console.log('✅ 找到LINKS區域');
      } else {
        console.log('❌ 未找到LINKS區域');
      }
      
      console.log('');
      
      // 判斷更新狀態
      if (newMatches && newMatches.length > 0) {
        console.log('🎉 網站已更新！PDF連結指向新文件');
        console.log('');
        console.log('✨ 用戶現在可以:');
        console.log('1. 訪問主頁面右下角的LINKS區域');
        console.log('2. 點擊📄 REPORT按鍵');
        console.log('3. 下載最新版本的PDF文件');
      } else {
        console.log('⏳ 網站尚未更新，仍在部署中...');
        console.log('');
        console.log('🔧 可能的原因:');
        console.log('1. GitHub Pages HTML更新延遲');
        console.log('2. CDN緩存尚未刷新');
        console.log('3. 瀏覽器緩存問題');
        console.log('');
        console.log('💡 建議:');
        console.log('1. 等待5-10分鐘後再次檢查');
        console.log('2. 使用無痕模式訪問網站');
        console.log('3. 強制刷新頁面 (Ctrl+F5)');
      }
      
      // 顯示部分HTML內容用於調試
      console.log('');
      console.log('🔧 調試信息:');
      const reportSection = data.match(/REPORT[\s\S]{0,200}/);
      if (reportSection) {
        console.log('REPORT按鍵周圍的HTML:');
        console.log(reportSection[0].substring(0, 200) + '...');
      } else {
        console.log('未找到REPORT相關的HTML內容');
      }
    });
    
  }).on('error', (err) => {
    console.error('❌ 檢查失敗:', err.message);
  });
}

// 執行檢查
checkWebsitePDFLink();