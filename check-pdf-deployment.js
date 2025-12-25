// 檢查PDF文件部署狀態
const https = require('https');

const PDF_URL = 'https://garyhu951.github.io/wordle-game/第25組期末專案成果-01157123+01257004.pdf';
const SITE_URL = 'https://garyhu951.github.io/wordle-game/';

function checkPDFFile() {
  console.log('🔍 檢查PDF文件部署狀態...');
  console.log('📄 PDF文件:', PDF_URL);
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');

  // 檢查PDF文件是否存在
  https.get(PDF_URL, (res) => {
    console.log('📊 PDF文件狀態:');
    console.log('📡 HTTP狀態:', res.statusCode);
    console.log('📅 最後修改:', res.headers['last-modified'] || '未知');
    console.log('📦 內容類型:', res.headers['content-type'] || '未知');
    console.log('📏 文件大小:', res.headers['content-length'] || '未知', 'bytes');
    
    if (res.statusCode === 200) {
      console.log('✅ PDF文件可訪問');
    } else {
      console.log('❌ PDF文件無法訪問');
    }
    
    console.log('');
    
    // 檢查網站中的PDF連結
    https.get(SITE_URL, (siteRes) => {
      let data = '';
      
      siteRes.on('data', (chunk) => {
        data += chunk;
      });
      
      siteRes.on('end', () => {
        console.log('🔍 網站中的PDF連結檢查:');
        
        const pdfLinkPattern = /第25組期末專案成果-01157123\+01257004\.pdf/g;
        const matches = data.match(pdfLinkPattern);
        
        if (matches && matches.length > 0) {
          console.log('✅ 網站包含正確的PDF連結');
          console.log('🔗 找到', matches.length, '個匹配的連結');
        } else {
          console.log('❌ 網站未包含正確的PDF連結');
        }
        
        // 檢查是否包含REPORT按鍵
        if (data.includes('📄 REPORT')) {
          console.log('✅ 網站包含REPORT按鍵');
        } else {
          console.log('❌ 網站未包含REPORT按鍵');
        }
        
        console.log('');
        console.log('🧪 測試建議:');
        console.log('1. 訪問主頁面右下角的LINKS區域');
        console.log('2. 點擊📄 REPORT按鍵');
        console.log('3. 驗證PDF文件是否正確下載');
        console.log('4. 檢查下載的文件名是否為: 第25組期末專案成果-01157123+01257004.pdf');
      });
      
    }).on('error', (err) => {
      console.error('❌ 網站檢查失敗:', err.message);
    });
    
  }).on('error', (err) => {
    console.error('❌ PDF文件檢查失敗:', err.message);
    console.log('');
    console.log('可能原因:');
    console.log('1. 文件尚未部署完成');
    console.log('2. 文件名稱編碼問題');
    console.log('3. GitHub Pages緩存延遲');
  });
}

// 執行檢查
checkPDFFile();