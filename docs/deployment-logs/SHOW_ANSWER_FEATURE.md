# 🎯 對戰頁面顯示答案功能

**功能描述**: 在對戰模式中新增顯示當前回合答案的功能，讓玩家可以查看目標單字。

## ✨ 新增功能

### 🎮 前端功能

#### 1. 顯示答案按鈕
- **位置**: 對戰頁面右上角控制區域，位於 "SKIP ROUND" 按鈕旁邊
- **樣式**: 紫色像素風格按鈕
- **文字**: "SHOW ANSWER" / "HIDE ANSWER"
- **行為**: 點擊切換答案顯示狀態

#### 2. 答案顯示區域
- **位置**: 遊戲網格上方，錯誤消息下方
- **樣式**: 紫色背景的像素風格面板
- **內容**: 
  - 標題: "CURRENT ANSWER"
  - 答案字母: 每個字母顯示在獨立的紫色方塊中
  - 說明文字: "This is your target word for this round"
- **動畫**: 字母逐個彈入效果

#### 3. 狀態管理
- `currentAnswer`: 存儲當前回合的答案
- `showAnswer`: 控制答案顯示/隱藏狀態
- 新回合開始時自動重置答案顯示狀態

### 🖥️ 後端功能

#### 1. 新增 Socket 事件
```javascript
// 客戶端請求答案
socket.on('get_current_answer', ({ roomCode }) => {
  // 返回當前玩家的專屬答案
  socket.emit('current_answer', { answer: room.currentWords[socket.id] });
});
```

#### 2. 安全性
- 只返回請求玩家自己的答案
- 驗證房間存在和玩家身份
- 錯誤處理和消息反饋

## 🎯 使用方式

### 對戰模式中使用
1. 進入對戰模式並開始遊戲
2. 在遊戲頁面右上角找到 "SHOW ANSWER" 按鈕
3. 點擊按鈕顯示當前回合的目標答案
4. 再次點擊 "HIDE ANSWER" 隱藏答案
5. 新回合開始時答案顯示會自動重置

### 功能特點
- **即時顯示**: 點擊即可立即查看答案
- **美觀設計**: 符合遊戲像素風格的視覺效果
- **智能重置**: 新回合自動隱藏上一回合的答案
- **音效反饋**: 點擊按鈕有相應的音效

## 🔧 技術實現

### 前端實現
```javascript
// 狀態管理
const [currentAnswer, setCurrentAnswer] = useState('');
const [showAnswer, setShowAnswer] = useState(false);

// 請求答案
const getAnswer = () => {
  if (socket && roomCode) {
    playSound('buttonClick');
    socket.emit('get_current_answer', { roomCode });
  }
};

// 隱藏答案
const hideAnswer = () => {
  playSound('buttonCancel');
  setShowAnswer(false);
  setCurrentAnswer('');
};

// 接收答案
socket.on('current_answer', ({ answer }) => {
  setCurrentAnswer(answer);
  setShowAnswer(true);
});
```

### 後端實現
```javascript
// 處理答案請求
socket.on('get_current_answer', ({ roomCode }) => {
  const room = rooms[roomCode];
  if (room && room.players[socket.id] && room.currentWords[socket.id]) {
    socket.emit('current_answer', {
      answer: room.currentWords[socket.id]
    });
  } else {
    socket.emit('error_message', 'Cannot get answer: Room not found or not in game');
  }
});
```

## 🎨 視覺設計

### 按鈕樣式
- **顯示狀態**: 紫色背景 (`bg-purple-600`)
- **隱藏狀態**: 橙色背景 (`bg-orange-600`)
- **懸停效果**: 顏色加深
- **像素邊框**: 2px 黑色陰影效果

### 答案面板樣式
- **背景**: 深紫色 (`bg-purple-900`)
- **邊框**: 像素風格邊框
- **字母方塊**: 紫色背景，白色文字
- **動畫**: 字母逐個彈入，延遲 0.1s

## 🔄 狀態流程

```
1. 玩家點擊 "SHOW ANSWER"
   ↓
2. 前端發送 get_current_answer 事件
   ↓
3. 後端驗證並返回 current_answer 事件
   ↓
4. 前端接收答案並顯示面板
   ↓
5. 玩家點擊 "HIDE ANSWER" 或新回合開始
   ↓
6. 答案面板隱藏，狀態重置
```

## 🎯 使用場景

### 適用情況
- **學習模式**: 玩家想要學習新單字
- **卡關時**: 猜測多次仍無頭緒時查看答案
- **驗證思路**: 確認自己的猜測方向是否正確
- **快速進行**: 想要快速進入下一回合

### 注意事項
- 顯示答案不會影響遊戲進行
- 仍需要正確輸入答案才能獲得分數
- 答案只對當前玩家可見，不會洩露給對手
- 新回合開始時會自動重置顯示狀態

## 🚀 部署說明

### 前端變更
- 修改 `frontend/src/App.jsx`
- 新增答案相關狀態和函數
- 新增 UI 組件和樣式

### 後端變更
- 修改 `backend/server.js`
- 新增 `get_current_answer` 事件處理
- 新增 `current_answer` 事件響應

### 部署步驟
1. 提交代碼到 Git
2. 推送到 GitHub
3. 前端自動部署到 GitHub Pages
4. 後端自動部署到 Render

## 🎉 功能優勢

### 用戶體驗
- **降低挫折感**: 卡關時可以查看答案繼續遊戲
- **學習價值**: 幫助玩家學習新的英文單字
- **遊戲流暢性**: 避免因不知道答案而中斷遊戲

### 技術優勢
- **安全性**: 只返回玩家自己的答案
- **性能**: 按需請求，不影響遊戲性能
- **可維護性**: 代碼結構清晰，易於維護

---

**開發時間**: 2024年12月21日  
**功能狀態**: ✅ 開發完成  
**測試狀態**: 🔄 待測試  
**部署狀態**: 🔄 待部署