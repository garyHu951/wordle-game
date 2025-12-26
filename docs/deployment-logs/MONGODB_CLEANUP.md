# MongoDB 代碼清理

## 清理原因
經過分析發現，應用程序實際上沒有使用 MongoDB 數據庫：
- 所有遊戲數據都存儲在內存中（`singlePlayerGames` Map 和 `rooms` 對象）
- MongoDB 模型文件被引入但從未使用
- 連接邏輯存在但只在生產環境嘗試連接，失敗後繼續使用內存存儲

## 清理內容

### ✅ 移除的文件
- `backend/models/Game.js` - 未使用的遊戲模型
- `backend/models/Room.js` - 未使用的房間模型

### ✅ 移除的依賴
```json
// 從 package.json 中移除
"mongoose": "^8.0.0"
```

### ✅ 移除的代碼
1. **引入語句**
```javascript
// 移除
const mongoose = require('mongoose');
const Game = require('./models/Game');
const Room = require('./models/Room');
```

2. **環境變量**
```javascript
// 移除
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wordle-game';
```

3. **連接邏輯**
```javascript
// 移除整個 MongoDB 連接區塊
if (MONGODB_URI && MONGODB_URI.includes('mongodb') && NODE_ENV === 'production') {
  mongoose.connect(MONGODB_URI, {
    // ... 連接配置
  })
  // ... 連接處理
}
```

4. **健康檢查 API**
```javascript
// 修改前
mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'

// 修改後
storage: 'in-memory'
```

### ✅ 更新的配置文件
- `backend/.env.example` - 移除 MongoDB 配置示例

## 清理效果

### 🚀 性能改進
- **更快啟動**: 移除數據庫連接嘗試，服務器啟動更快
- **更少依賴**: 減少 mongoose 依賴，降低包大小
- **更簡潔**: 代碼更清晰，沒有未使用的導入和邏輯

### 📦 包大小減少
```bash
# 移除前
node_modules 包含 mongoose 及其依賴

# 移除後
減少約 2MB 的依賴包大小
```

### 🔧 維護性提升
- 移除死代碼，提高代碼可讀性
- 減少潛在的安全風險（未使用的數據庫連接）
- 簡化部署配置（不需要 MongoDB 環境變量）

## 當前存儲方案

### 單人模式
```javascript
const singlePlayerGames = new Map(); // 存儲單人遊戲狀態
```

### 對戰模式
```javascript
const rooms = {}; // 存儲對戰房間狀態
```

### 數據特點
- **內存存儲**: 所有數據存儲在服務器內存中
- **會話性**: 服務器重啟後數據會丟失（符合遊戲特性）
- **高性能**: 無數據庫 I/O，響應速度更快
- **簡單部署**: 不需要外部數據庫依賴

## 未來考慮

如果將來需要持久化存儲（如用戶統計、排行榜等），可以考慮：

1. **輕量級方案**
   - SQLite（文件數據庫）
   - JSON 文件存儲

2. **雲端方案**
   - Firebase Firestore
   - Supabase
   - PlanetScale

3. **重新引入 MongoDB**
   - 只在確實需要時添加
   - 使用更精簡的 ODM（如 Prisma）

## 部署狀態

- ✅ 代碼已提交到 GitHub (commit: 16f0d4c)
- 🔄 後端自動部署中 (Render)
- 📅 清理時間: 2024-12-23 17:15 (UTC+8)

## 驗證清理效果

部署完成後，可以通過以下方式驗證：

1. **健康檢查 API**
```bash
curl https://wordle-game-backend-v2.onrender.com/api/health
# 應該返回: "storage": "in-memory"
```

2. **功能測試**
- 單人模式正常運行
- 對戰模式正常運行
- 所有遊戲功能不受影響

3. **性能測試**
- 服務器啟動時間更快
- API 響應時間保持或改善

---
**清理完成**: MongoDB 相關代碼已完全移除，應用程序現在更加精簡高效 ✅