// 檢查舊版本PDF文件是否存在
const https = require('https');

const OLD_PDF_URL = 'https://garyhu951.github.io/wordle-game/%E7%AC%AC25%E7%B5%84%E6%9C%9F%E6%9C%AB%E5%B0%88%E6%A1%88%E6%88%90%E6%9E%9C-01157123+01257004.pdf';
const NEW_PDF_URL = 'https://garyhu951.github.io/wordle-game/(第25組) 期末專案成果-01157123+01257004.pdf';

function checkPDF(url, name) {
  return new Promise((resolve) => {
    console.log(`🔍 檢查 ${name}:`);
    console.log(`   URL: ${url}`);
    
    https.get(url, (res) => {
      const status = res.statusCode;
      const size = res.headers['content-length'] || '未知';
      const lastModified = res.headers['last-modified'] || '未知';
      
      console.log(`   狀態: ${status}`);
      console.log(`   大小: ${size} bytes`);
      console.log(`   修改時間: ${lastModified}`);
      
      if (status === 200) {
        console.log(`   ✅ ${name} 可以訪問`);
      } else {
        console.log(`   ❌ ${name} 無法訪問`);
      }
      
      resolve({ name, status, size, lastModified });
    }).on('error', (err) => {
      console.log(`   ❌ ${name} 錯誤: ${err.message}`);
      resolve({ name, status: 'error', error: err.message });
    });
  });
}

async function checkBothPDFs() {
  console.log('🔍 檢查PDF文件狀態...');
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');
  
  const oldResult = await checkPDF(OLD_PDF_URL, '舊版本PDF (無括號)');
  console.log('');
  const newResult = await checkPDF(NEW_PDF_URL, '新版本PDF (有括號)');
  
  console.log('');
  console.log('📊 檢查結果總結:');
  
  if (oldResult.status === 200 && newResult.status === 200) {
    console.log('✅ 兩個版本的PDF都可以訪問');
    console.log('');
    console.log('📋 文件比較:');
    console.log(`   舊版本大小: ${oldResult.size} bytes`);
    console.log(`   新版本大小: ${newResult.size} bytes`);
    
    if (oldResult.size === newResult.size) {
      console.log('   ✅ 文件大小相同，內容應該一致');
    } else {
      console.log('   ⚠️  文件大小不同，可能是不同版本');
    }
  } else if (oldResult.status === 200) {
    console.log('⚠️  只有舊版本PDF可以訪問');
    console.log('💡 建議使用舊版本URL下載');
  } else if (newResult.status === 200) {
    console.log('✅ 只有新版本PDF可以訪問');
    console.log('💡 建議使用新版本URL下載');
  } else {
    console.log('❌ 兩個版本都無法訪問');
    console.log('🔧 可能需要檢查部署狀態');
  }
  
  console.log('');
  console.log('🔗 可用的下載連結:');
  if (oldResult.status === 200) {
    console.log('📄 舊版本 (無括號):');
    console.log('   https://garyhu951.github.io/wordle-game/第25組期末專案成果-01157123+01257004.pdf');
  }
  if (newResult.status === 200) {
    console.log('📄 新版本 (有括號):');
    console.log('   https://garyhu951.github.io/wordle-game/(第25組) 期末專案成果-01157123+01257004.pdf');
  }
}

// 執行檢查
checkBothPDFs();