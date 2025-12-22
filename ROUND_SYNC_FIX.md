# 對戰模式回合數同步修復

## 問題描述
在對戰模式中，當一個玩家完成回合進入下一回合時，對手看到的回合數沒有及時更新，導致雙方顯示的回合數不同步。

## 問題原因
1. **單向通知**: `startRoundForPlayer` 函數只向當前玩家發送 `new_round` 事件，對手沒有收到回合數更新
2. **初始化問題**: 遊戲開始時兩個玩家同時調用 `startRoundForPlayer`，可能導致回合數混亂

## 修復方案

### 1. 修改 `startRoundForPlayer` 函數
**之前的邏輯**:
```javascript
// 只通知當前玩家
io.to(playerId).emit('new_round', {
  myRound: room.playerRounds[playerId],
  opponentRound: room.playerRounds[opponentId] || 1,
  potentialPoints: 5
});
```

**修復後的邏輯**:
```javascript
// 向房間內所有玩家廣播回合數更新
playerIds.forEach(id => {
  const isCurrentPlayer = id === playerId;
  io.to(id).emit('new_round', {
    myRound: room.playerRounds[id] || 1,
    opponentRound: room.playerRounds[isCurrentPlayer ? opponentId : playerId] || 1,
    potentialPoints: 5
  });
});
```

### 2. 優化遊戲初始化邏輯
**之前的邏輯**:
```javascript
// 可能導致回合數混亂
playerIds.forEach(playerId => {
  startRoundForPlayer(roomCode, playerId);
});
```

**修復後的邏輯**:
```javascript
// 統一初始化，確保同步
playerIds.forEach(playerId => {
  if (!room.playerRounds) room.playerRounds = {};
  room.playerRounds[playerId] = 1;
  if (!room.playerGuessCount) room.playerGuessCount = {};
  room.playerGuessCount[playerId] = 0;
});

// 為第一回合生成單字
if (!room.roundWords) room.roundWords = {};
if (!room.roundWords[1]) {
  room.roundWords[1] = getRandomWord(room.wordLength);
}

// 向所有玩家廣播第一回合開始
playerIds.forEach(playerId => {
  const opponentId = playerIds.find(id => id !== playerId);
  io.to(playerId).emit('new_round', {
    myRound: 1,
    opponentRound: 1,
    potentialPoints: 5
  });
});
```

## 修復效果

### ✅ 修復前的問題
- 玩家1進入第2回合，玩家2仍顯示玩家1在第1回合
- 回合數顯示不同步，造成用戶困惑
- 遊戲開始時可能出現回合數不一致

### ✅ 修復後的效果
- **實時同步**: 當任何玩家進入新回合時，雙方都能立即看到正確的回合數
- **準確顯示**: 每個玩家都能看到自己和對手的真實回合進度
- **一致初始化**: 遊戲開始時雙方都顯示在第1回合

## 技術細節

### 廣播邏輯
```javascript
// 為每個玩家計算正確的回合數顯示
playerIds.forEach(id => {
  const isCurrentPlayer = id === playerId;
  io.to(id).emit('new_round', {
    myRound: room.playerRounds[id] || 1,           // 自己的回合數
    opponentRound: room.playerRounds[isCurrentPlayer ? opponentId : playerId] || 1, // 對手的回合數
    potentialPoints: 5
  });
});
```

### 前端處理
前端已經有正確的事件監聽器：
```javascript
newSocket.on('new_round', (data) => {
  setMyRound(data.myRound);
  setOpponentRound(data.opponentRound);
  setPotentialPoints(5);
  setHints([]);
});
```

## 用戶體驗改進

1. **透明度**: 玩家可以清楚看到雙方的真實進度
2. **公平性**: 避免因顯示錯誤造成的誤解
3. **即時性**: 回合數變化立即反映在雙方界面上
4. **一致性**: 確保雙方看到的信息完全一致

## 部署狀態

- ✅ 代碼已提交到 GitHub (commit: b7dea83)
- 🔄 後端自動部署中 (Render)
- 📅 部署時間: 2024-12-23 17:00 (UTC+8)

## 測試建議

部署完成後，建議測試以下場景：
1. 創建對戰房間，確認雙方都顯示第1回合
2. 玩家1完成第1回合，確認玩家2能看到玩家1進入第2回合
3. 玩家2完成第1回合，確認玩家1能看到玩家2進入第2回合
4. 確認雙方回合數始終保持同步

---
**修復完成**: 對戰模式回合數現在會實時同步更新 ✅