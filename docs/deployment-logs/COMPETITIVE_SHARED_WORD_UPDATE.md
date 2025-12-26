# 🎯 對戰模式共享單字功能更新

## 📋 功能說明

### 🔄 修改前 vs 修改後

#### ❌ 修改前（各自單字）
- 每個玩家有自己的單字 (`room.currentWords[playerId]`)
- 玩家A猜單字A，玩家B猜單字B
- 無法直接比較誰更快猜對

#### ✅ 修改後（共享單字）
- 雙方玩家猜同一個單字 (`room.currentWord`)
- 更公平的競爭環境
- 可以直接比較解題速度和技巧

## 🛠️ 技術實現

### 後端修改 (backend/server.js)

#### 1. 房間數據結構調整
```javascript
// 修改前
rooms[roomCode] = {
  currentWords: {}, // 每個玩家的單字
  // ...
};

// 修改後  
rooms[roomCode] = {
  currentWord: null, // 共享單字
  // ...
};
```

#### 2. 回合開始邏輯
```javascript
// 修改前：為每個玩家生成不同單字
room.currentWords[playerId] = getRandomWord(room.wordLength);

// 修改後：生成共享單字
if (!room.currentWord) {
  room.currentWord = getRandomWord(room.wordLength);
}
```

#### 3. 猜測驗證邏輯
```javascript
// 修改前：使用玩家專屬單字
const playerWord = room.currentWords[socket.id];
const result = checkGuess(normalizedGuess, playerWord);

// 修改後：使用共享單字
const sharedWord = room.currentWord;
const result = checkGuess(normalizedGuess, sharedWord);
```

#### 4. 回合結束處理
```javascript
// 修改後：清除共享單字，準備下一回合
if (isCorrect || gameOver) {
  room.currentWord = null; // 清除當前單字
  setTimeout(() => startRoundForPlayer(roomCode, socket.id), 1000);
}
```

## 🎮 遊戲體驗改進

### 🏆 競爭性提升
- **直接競爭**: 雙方猜同一個單字，更直接的競爭
- **技巧比拼**: 比較誰能更快找到正確答案
- **策略思考**: 相同條件下的解題策略對比

### ⚖️ 公平性保證
- **相同難度**: 雙方面對相同的挑戰
- **無運氣因素**: 消除因單字難易度不同造成的不公平
- **純技巧競賽**: 專注於邏輯推理和詞彙能力

### 🎯 用戶體驗
- **更刺激**: 知道對手在猜同一個單字增加緊張感
- **更有趣**: 可以觀察對手的猜測策略
- **更公平**: 勝負完全取決於技巧而非運氣

## 🔧 測試驗證

### 本地測試環境
- **後端**: http://localhost:3001 ✅ 運行中
- **前端**: http://localhost:5173/wordle-game/ ✅ 運行中

### 測試步驟
1. 創建對戰房間
2. 第二個玩家加入房間
3. 開始遊戲，驗證雙方是否猜同一個單字
4. 測試回合結束後是否生成新的共享單字

### 預期結果
- ✅ 雙方玩家每回合猜測相同單字
- ✅ 回合結束後生成新的共享單字
- ✅ 顯示答案功能正常工作
- ✅ 計分系統正常運作

## 📊 影響範圍

### ✅ 不受影響的功能
- 單人模式遊戲邏輯
- 前端UI和用戶體驗
- 計分系統
- 房間管理
- 連接和斷線處理

### 🔄 受影響的功能
- 對戰模式單字生成邏輯
- 猜測驗證邏輯
- 顯示答案功能
- 回合管理系統

## 🚀 部署準備

### 下一步操作
1. 本地測試驗證功能正常
2. 提交代碼到GitHub
3. 部署到生產環境
4. 驗證線上功能

---

**修改時間**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**狀態**: ✅ 開發完成，準備測試  
**影響**: 🎯 提升對戰模式公平性和競爭性