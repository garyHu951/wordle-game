# 🔧 API 連接診斷報告

## 已修正的問題

### 1. 後端 CORS 配置
✅ **已添加完整的 GitHub Pages URL**
- 原來：`'https://garyHu951.github.io'`
- 現在：`'https://garyHu951.github.io'`, `'https://garyHu951.github.io/wordle-game'`

### 2. 前端資源路徑
✅ **音效文件路徑**：已改為相對路徑 `./sounds/`
✅ **HTML 資源路徑**：已改為相對路徑
✅ **頁面標題**：已更新為 "Wordle+ Pixel Edition"

## 🧪 API 測試方法

### 手動測試 API 連接
在瀏覽器控制台中執行以下代碼來測試 API：

```javascript
// 測試健康檢查
fetch('https://wordle-game-backend-v2.onrender.com/api/health')
  .then(res => res.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err));

// 測試單字庫 API
fetch('https://wordle-game-backend-v2.onrender.com/api/words/5')
  .then(res => res.json())
  .then(data => console.log('Words API:', data.success ? 'Success' : 'Failed', data))
  .catch(err => console.error('Words API failed:', err));
```

### 檢查網絡請求
1. 打開瀏覽器開發者工具 (F12)
2. 切換到 "Network" 標籤
3. 點擊 "WORD LIST" 按鈕
4. 查看是否有失敗的請求

## 🚨 可能的問題及解決方案

### 問題 1: CORS 錯誤
**症狀**: 控制台顯示 "Access to fetch at ... has been blocked by CORS policy"
**解決方案**: 已修正後端 CORS 配置，需要重新部署後端

### 問題 2: 404 錯誤
**症狀**: API 請求返回 404
**可能原因**: 
- 後端服務器休眠 (Render 免費版會休眠)
- API 路徑錯誤

### 問題 3: 網絡超時
**症狀**: 請求長時間無響應
**解決方案**: Render 免費版冷啟動需要 30-60 秒

## 📋 部署檢查清單

### 後端部署 (Render)
- [ ] 重新部署後端以應用 CORS 修正
- [ ] 確認服務器狀態為 "Live"
- [ ] 測試 API 端點響應

### 前端部署 (GitHub Pages)
- [ ] 推送所有路徑修正
- [ ] 等待 GitHub Actions 完成
- [ ] 清除瀏覽器緩存測試

## 🎯 預期結果

修正完成後，應該看到：
- ✅ 單字庫可以正常載入
- ✅ 音效正常播放
- ✅ 所有 API 請求成功
- ✅ 控制台無 CORS 錯誤

---
*下一步：推送修正並重新部署*