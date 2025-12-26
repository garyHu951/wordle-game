// 檢查網站資源文件是否存在
const https = require('https');

const BASE_URL = 'https://garyhu951.github.io/wordle-game';
const ASSETS_TO_CHECK = [
  '/assets/index-d1U8tMEE.js',
  '/assets/vendor-CWwjDp-9.js',
  '/assets/index-CtvLlNCx.css',
  '/assets/rolldown-runtime-DGruFWvd.js',
  '/assets/socket-BV3TL8OL.js'
];

function checkAsset(assetPath) {
  return new Promise((resolve) => {
    const url = BASE_URL + assetPath;
    console.log(`🔍 檢查: ${assetPath}`);
    
    https.get(url, (res) => {
      const status = res.statusCode;
      const size = res.headers['content-length'] || '未知';
      
      if (status === 200) {
        console.log(`✅ ${assetPath} - 狀態: ${status}, 大小: ${size} bytes`);
      } else {
        console.log(`❌ ${assetPath} - 狀態: ${status}`);
      }
      
      resolve({ path: assetPath, status, size });
    }).on('error', (err) => {
      console.log(`❌ ${assetPath} - 錯誤: ${err.message}`);
      resolve({ path: assetPath, status: 'error', error: err.message });
    });
  });
}

async function checkAllAssets() {
  console.log('🔍 檢查網站資源文件...');
  console.log('🎯 基礎URL:', BASE_URL);
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');
  
  const results = [];
  
  for (const asset of ASSETS_TO_CHECK) {
    const result = await checkAsset(asset);
    results.push(result);
  }
  
  console.log('');
  console.log('📊 檢查結果總結:');
  
  const successful = results.filter(r => r.status === 200);
  const failed = results.filter(r => r.status !== 200);
  
  console.log(`✅ 成功: ${successful.length}/${results.length}`);
  console.log(`❌ 失敗: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('');
    console.log('❌ 失敗的資源:');
    failed.forEach(f => {
      console.log(`   ${f.path} - 狀態: ${f.status}`);
    });
    
    console.log('');
    console.log('🔧 可能的問題:');
    console.log('1. Vite構建的資源文件沒有正確部署');
    console.log('2. 文件路徑或文件名不匹配');
    console.log('3. GitHub Pages沒有部署assets目錄');
    console.log('4. 構建過程中生成的文件名與HTML中的不一致');
  } else {
    console.log('');
    console.log('✅ 所有資源文件都可以訪問');
    console.log('🔧 如果網站仍然不工作，可能是JavaScript執行錯誤');
  }
}

// 執行檢查
checkAllAssets();