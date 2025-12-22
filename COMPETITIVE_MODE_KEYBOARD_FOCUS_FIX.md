# 競賽模式鍵盤焦點修復

## 問題描述
在競賽模式中，執行以下操作後會失去鍵盤焦點，需要點擊畫面上的鍵盤才能重新使用鍵盤輸入：
1. 顯示答案 (Show Answer)
2. 隱藏答案 (Hide Answer)  
3. 跳過回合 (Skip Round)
4. 回合切換 (New Round)

## 問題根因
當 React 組件狀態改變導致 DOM 重新渲染時，瀏覽器會失去當前的鍵盤焦點。這是 Web 應用中的常見問題，特別是在動態更新內容的單頁應用中。

## 修復方案

### 1. 鍵盤焦點管理系統
創建專門的焦點管理函數：

```javascript
// 鍵盤焦點管理函數
const restoreKeyboardFocus = (reason = 'unknown') => {
  setTimeout(() => {
    // 首先嘗試聚焦到遊戲容器
    const gameContainer = document.querySelector('.min-h-screen[tabindex="0"]');
    if (gameContainer) {
      gameContainer.focus();
      console.log(`Keyboard focus restored to game container: ${reason}`);
      return;
    }
    
    // 備用方案：聚焦到 body 和 window
    document.body.focus();
    window.focus();
    
    console.log(`Keyboard focus restored to body/window: ${reason}`);
  }, 100);
};
```

### 2. 遊戲容器可聚焦設置
為主要遊戲容器添加 `tabIndex` 屬性：

```javascript
<div 
  className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center py-4 px-2 animate-fade-in"
  tabIndex={0}
  onFocus={() => console.log('Game container focused')}
>
```

### 3. 各操作後的焦點恢復

#### 跳過回合
```javascript
const skipRound = () => {
  if (socket && roomCode && canSkip) {
    playSound('skipButton');
    socket.emit('skip_round', { roomCode });
    
    // 重新設置鍵盤焦點
    restoreKeyboardFocus('skip round');
  }
};
```

#### 顯示答案
```javascript
const getAnswer = () => {
  if (socket && roomCode) {
    playSound('buttonClick');
    socket.emit('get_current_answer', { roomCode });
    
    // 重新設置鍵盤焦點
    restoreKeyboardFocus('get answer');
  }
};
```

#### 隱藏答案
```javascript
const hideAnswer = () => {
  playSound('buttonCancel');
  setShowAnswer(false);
  setCurrentAnswer('');
  
  // 重新設置鍵盤焦點
  restoreKeyboardFocus('hide answer');
};
```

#### 接收答案事件
```javascript
newSocket.on('current_answer', ({ answer }) => {
  setCurrentAnswer(answer);
  setShowAnswer(true);
  
  // 重新設置鍵盤焦點
  restoreKeyboardFocus('current answer received');
});
```

#### 新回合事件
```javascript
newSocket.on('new_round', (data) => {
  // ... 狀態重置邏輯
  
  setTimeout(() => {
    // ... 其他狀態重置
    
    // 重新設置鍵盤焦點
    restoreKeyboardFocus('new round');
  }, 500);
});
```

## 修復效果

### ✅ 修復前問題
- 顯示答案後無法使用鍵盤輸入
- 跳過回合後無法使用鍵盤輸入  
- 回合切換後需要點擊才能輸入
- 隱藏答案後鍵盤失效

### ✅ 修復後效果
- 所有操作後立即可用鍵盤輸入
- 無需點擊畫面鍵盤重新激活
- 流暢的遊戲體驗
- 詳細的調試日誌便於追蹤

## 技術細節

### 焦點恢復策略
1. **優先級1**: 聚焦到遊戲容器 (具有 tabIndex 的主容器)
2. **優先級2**: 聚焦到 document.body 和 window (備用方案)
3. **延遲執行**: 100ms 延遲確保 DOM 更新完成

### 調試支持
- 每次焦點恢復都有詳細日誌
- 記錄觸發原因便於問題追蹤
- 容器聚焦事件監聽

### 兼容性
- 支持所有現代瀏覽器
- 漸進式降級策略
- 不影響現有功能

## 測試驗證

### 測試步驟
1. 進入競賽模式
2. 執行以下操作並驗證鍵盤輸入：
   - 點擊 "SHOW ANSWER" → 立即可用鍵盤
   - 點擊 "HIDE ANSWER" → 立即可用鍵盤
   - 點擊 "SKIP ROUND" → 新回合立即可用鍵盤
   - 完成回合等待切換 → 新回合立即可用鍵盤

### 預期結果
- ✅ 所有操作後無需點擊即可使用鍵盤
- ✅ 遊戲體驗流暢無中斷
- ✅ 控制台有清晰的焦點恢復日誌

## 修復文件
- `frontend/src/App.jsx` - 主要修復文件

## 部署狀態
- ✅ 代碼修復完成
- ⏳ 等待部署測試