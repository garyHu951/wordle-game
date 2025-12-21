# 🔍 API 問題深度診斷

## 立即診斷步驟

### 1. 檢查網絡請求
請按照以下步驟檢查：
1. 打開遊戲頁面：https://garyHu951.github.io/wordle-game
2. 按 F12 打開開發者工具
3. 切換到 "Network" 標籤
4. 點擊 "WORD LIST" 按鈕
5. 查看是否有紅色的失敗請求

### 2. 檢查控制台錯誤
在 "Console" 標籤中查看是否有錯誤信息，特別是：
- CORS 錯誤
- 404 錯誤
- 網絡超時錯誤

### 3. 手動測試 API
在控制台中執行以下代碼：

```javascript
// 測試 1: 健康檢查
fetch('https://wordle-game-backend-v2.onrender.com/api/health')
  .then(res => {
    console.log('Health Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Health Data:', data))
  .catch(err => console.error('Health Error:', err));

// 測試 2: 單字庫 API
fetch('https://wordle-game-backend-v2.onrender.com/api/words/5')
  .then(res => {
    console.log('Words Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Words Data:', data))
  .catch(err => console.error('Words Error:', err));

// 測試 3: 檢查 CORS
fetch('https://wordle-game-backend-v2.onrender.com/api/words/5', {
  method: 'GET',
  headers: {
    'Origin': 'https://garyHu951.github.io'
  }
})
.then(res => console.log('CORS Test Status:', res.status))
.catch(err => console.error('CORS Error:', err));
```

## 可能的問題及解決方案

### 問題 1: 後端服務器休眠
**症狀**: 第一次請求很慢或超時
**解決方案**: Render 免費版會休眠，需要等待冷啟動

### 問題 2: CORS 仍未生效
**症狀**: "Access to fetch ... has been blocked by CORS policy"
**解決方案**: 後端可能還沒重新部署

### 問題 3: API 路徑錯誤
**症狀**: 404 Not Found
**解決方案**: 檢查 API 端點是否正確

### 問題 4: 網絡連接問題
**症狀**: ERR_NETWORK_CHANGED 或類似錯誤
**解決方案**: 檢查網絡連接

## 請告訴我以下信息：

1. **網絡請求狀態**: 在 Network 標籤中看到什麼？
2. **控制台錯誤**: Console 中有什麼錯誤信息？
3. **手動測試結果**: 上面的測試代碼返回什麼？

---
*根據你的反饋，我將提供針對性的解決方案*