# 不雅詞彙過濾和 RickRoll 彩蛋功能

## 功能概述

### 1. 不雅詞彙過濾系統
- **目的**: 維護遊戲環境的健康和友善
- **範圍**: 單人模式和競賽模式
- **行為**: 強制結束對戰並播放 RickRoll 影片

### 2. 特殊詞彙彩蛋 (RickRoll)
- **觸發詞**: "rickrol" (7字母模式)
- **行為**: 暫停遊戲並播放特殊 RickRoll 影片

## 實現細節

### 後端實現

#### 1. 不雅詞彙過濾器 (`profanity-filter.json`)
```json
{
  "profanityWords": [
    "fuck", "shit", "damn", "hell", "bitch", 
    // ... 更多不雅詞彙
  ],
  "specialWords": {
    "rickrol": {
      "action": "rickroll",
      "url": "https://youtu.be/GtL1huin9EE?si=83CkDBTlxQ8aar14",
      "title": "InsurAAAnce & Rick Astley Never Gonna Give You Up",
      "lengthRequired": 7
    }
  }
}
```

#### 2. 詞彙檢查函數
```javascript
function checkWordContent(word, wordLength) {
  const normalizedWord = word.toLowerCase().trim();
  
  // 檢查不雅詞彙
  const isProfane = profanityFilter.profanityWords.some(profaneWord => 
    normalizedWord.includes(profaneWord.toLowerCase())
  );
  
  if (isProfane) {
    return {
      type: 'profanity',
      action: 'kick',
      url: 'https://youtu.be/oHg5SJYRHA0?si=kf8gQw4ML-5qaTV_',
      title: 'RickRoll\'D'
    };
  }
  
  // 檢查特殊詞彙
  const specialWord = profanityFilter.specialWords[normalizedWord];
  if (specialWord && wordLength === specialWord.lengthRequired) {
    return {
      type: 'special',
      action: 'rickroll',
      url: specialWord.url,
      title: specialWord.title
    };
  }
  
  return null;
}
```

#### 3. 競賽模式處理
```javascript
socket.on('submit_guess_competitive', ({ roomCode, guess }) => {
  // ... 基本檢查 ...
  
  const contentCheck = checkWordContent(normalizedGuess, room.wordLength);
  if (contentCheck) {
    if (contentCheck.type === 'profanity') {
      // 不雅詞彙：踢出玩家
      socket.emit('profanity_detected', {
        message: 'Inappropriate language detected. Game terminated.',
        url: contentCheck.url,
        title: contentCheck.title
      });
      
      // 通知其他玩家
      socket.to(roomCode).emit('opponent_kicked', {
        message: 'Your opponent was removed for inappropriate language.'
      });
      
      // 移除玩家
      delete room.players[socket.id];
      return;
    } else if (contentCheck.type === 'special') {
      // 特殊詞彙：暫停遊戲
      socket.emit('special_word_detected', {
        message: 'Special word detected! Game paused.',
        url: contentCheck.url,
        title: contentCheck.title
      });
      
      room.isPaused = true;
      io.to(roomCode).emit('game_paused', {
        message: 'Game paused due to special word detection',
        pausedBy: 'System'
      });
      return;
    }
  }
  
  // ... 正常遊戲邏輯 ...
});
```

#### 4. 單人模式處理
```javascript
app.post('/api/game/:id/guess', (req, res) => {
  // ... 基本檢查 ...
  
  const contentCheck = checkWordContent(normalizedGuess, game.wordLength);
  if (contentCheck) {
    if (contentCheck.type === 'profanity') {
      return res.json({
        success: false,
        profanityDetected: true,
        message: 'Inappropriate language detected. Game terminated.',
        url: contentCheck.url,
        title: contentCheck.title,
        gameOver: true
      });
    } else if (contentCheck.type === 'special') {
      return res.json({
        success: false,
        specialWordDetected: true,
        message: 'Special word detected! Game paused.',
        url: contentCheck.url,
        title: contentCheck.title,
        gamePaused: true
      });
    }
  }
  
  // ... 正常遊戲邏輯 ...
});
```

### 前端實現

#### 1. Socket 事件監聽器
```javascript
// 不雅詞彙檢測
newSocket.on('profanity_detected', ({ message, url, title }) => {
  alert(message);
  window.open(url, '_blank'); // 開啟 RickRoll
  setTimeout(() => {
    resetGameState();
    onBack(); // 返回主頁
  }, 1000);
});

// 對手被踢出
newSocket.on('opponent_kicked', ({ message }) => {
  setErrorMessage(message);
  setTimeout(() => {
    resetGameState();
    onBack();
  }, 3000);
});

// 特殊詞彙檢測
newSocket.on('special_word_detected', ({ message, url, title }) => {
  alert(message);
  window.open(url, '_blank'); // 開啟特殊 RickRoll
});
```

#### 2. 單人模式處理
```javascript
const response = await fetch(`${API_URL}/game/${gameId}/guess`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ guess: currentGuess })
});
const data = await response.json();

// 檢查不雅詞彙
if (data.profanityDetected) {
  alert(data.message);
  window.open(data.url, '_blank');
  setGameOver(true);
  setMessage(data.message);
  return;
}

// 檢查特殊詞彙
if (data.specialWordDetected) {
  alert(data.message);
  window.open(data.url, '_blank');
  setIsPaused(true);
  setMessage(data.message);
  return;
}
```

### 單字數據庫清理

#### 過濾統計
- **4字母單字**: 移除 55 個不雅詞彙 (7185 → 7130)
- **5字母單字**: 移除 163 個不雅詞彙 (15918 → 15755)
- **6字母單字**: 移除 434 個不雅詞彙 (29874 → 29440)
- **7字母單字**: 移除 818 個不雅詞彙 (41997 → 41179)
- **總計**: 移除 1470 個不雅詞彙
- **特殊添加**: "rickrol" 添加到 7 字母單字列表

#### 備份文件
- `4-letter-words.backup.json`
- `5-letter-words.backup.json`
- `6-letter-words.backup.json`
- `7-letter-words.backup.json`

## 觸發條件

### 不雅詞彙檢測
- **觸發**: 玩家輸入包含不雅詞彙的單字
- **檢查方式**: 部分匹配 (包含檢查)
- **行為**:
  - 單人模式: 強制結束遊戲 + RickRoll
  - 競賽模式: 踢出玩家 + RickRoll，通知對手

### 特殊詞彙彩蛋
- **觸發**: 在 7 字母模式下輸入 "rickrol"
- **檢查方式**: 完全匹配
- **行為**:
  - 單人模式: 暫停遊戲 + 特殊 RickRoll
  - 競賽模式: 暫停遊戲 + 特殊 RickRoll

## RickRoll 影片

### 不雅詞彙懲罰
- **URL**: https://youtu.be/oHg5SJYRHA0?si=kf8gQw4ML-5qaTV_
- **標題**: "RickRoll'D"

### 特殊詞彙彩蛋
- **URL**: https://youtu.be/GtL1huin9EE?si=83CkDBTlxQ8aar14
- **標題**: "InsurAAAnce & Rick Astley Never Gonna Give You Up"

## 安全性考量

1. **伺服器端驗證**: 所有檢查都在後端進行，防止前端繞過
2. **即時踢出**: 不雅詞彙檢測後立即移除玩家
3. **數據庫清理**: 預防性移除不雅詞彙，減少觸發機會
4. **備份保護**: 保留原始單字列表備份

## 測試場景

### 不雅詞彙測試
1. 單人模式輸入包含不雅詞彙的單字
2. 競賽模式輸入包含不雅詞彙的單字
3. 驗證 RickRoll 影片開啟
4. 驗證遊戲狀態變化

### 特殊詞彙測試
1. 7字母單人模式輸入 "rickrol"
2. 7字母競賽模式輸入 "rickrol"
3. 驗證特殊 RickRoll 影片開啟
4. 驗證遊戲暫停狀態

## 部署狀態
- ✅ 後端邏輯實現完成
- ✅ 前端事件處理完成
- ✅ 單字數據庫清理完成
- ✅ 特殊詞彙添加完成
- 🔄 等待部署測試