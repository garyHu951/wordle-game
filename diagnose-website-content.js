// 診斷網站內容的詳細腳本
const https = require('https');

const SITE_URL = 'https://garyhu951.github.io/wordle-game/';

function diagnoseWebsiteContent() {
  console.log('🔍 詳細診斷網站內容...');
  console.log('🎯 目標:', SITE_URL);
  console.log('⏰ 檢查時間:', new Date().toLocaleString('zh-TW'));
  console.log('');

  https.get(SITE_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📊 響應詳情:');
      console.log('📡 HTTP狀態:', res.statusCode);
      console.log('📅 最後修改:', res.headers['last-modified'] || '未知');
      console.log('🔧 服務器:', res.headers.server || '未知');
      console.log('📦 內容類型:', res.headers['content-type'] || '未知');
      console.log('📏 內容大小:', data.length, 'bytes');
      console.log('🔗 緩存控制:', res.headers['cache-control'] || '未知');
      console.log('');
      
      console.log('📄 實際HTML內容:');
      console.log('=' .repeat(50));
      console.log(data);
      console.log('=' .repeat(50));
      console.log('');
      
      // 分析內容
      console.log('🔍 內容分析:');
      
      if (data.includes('<!DOCTYPE html>')) {
        console.log('✅ 包含HTML文檔聲明');
      } else {
        console.log('❌ 缺少HTML文檔聲明');
      }
      
      if (data.includes('<title>')) {
        const titleMatch = data.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          console.log('✅ 頁面標題:', titleMatch[1]);
        }
      } else {
        console.log('❌ 缺少頁面標題');
      }
      
      if (data.includes('React')) {
        console.log('✅ 包含React相關內容');
      } else {
        console.log('❌ 未包含React相關內容');
      }
      
      if (data.includes('root')) {
        console.log('✅ 包含root元素');
      } else {
        console.log('❌ 缺少root元素');
      }
      
      if (data.includes('script')) {
        console.log('✅ 包含JavaScript腳本');
      } else {
        console.log('❌ 缺少JavaScript腳本');
      }
      
      // 檢查是否是錯誤頁面
      if (data.includes('404') || data.includes('Not Found')) {
        console.log('⚠️  可能是404錯誤頁面');
      }
      
      if (data.includes('GitHub Pages')) {
        console.log('ℹ️  包含GitHub Pages相關內容');
      }
      
      console.log('');
      console.log('🔧 診斷結論:');
      
      if (data.length < 1000) {
        console.log('❌ 內容異常小，可能的問題:');
        console.log('   1. GitHub Pages構建失敗');
        console.log('   2. index.html文件丟失或損壞');
        console.log('   3. 部署配置錯誤');
        console.log('   4. React應用沒有正確構建');
      } else {
        console.log('✅ 內容大小正常');
      }
      
      console.log('');
      console.log('💡 建議解決方案:');
      console.log('1. 檢查GitHub Pages設置是否正確');
      console.log('2. 檢查是否有index.html文件');
      console.log('3. 檢查GitHub Actions構建日誌');
      console.log('4. 嘗試重新部署或重新構建');
    });
    
  }).on('error', (err) => {
    console.error('❌ 檢查失敗:', err.message);
  });
}

// 執行診斷
diagnoseWebsiteContent();