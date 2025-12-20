const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// 新增：引入 http 和 socket.io
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// 建立 HTTP Server 並綁定 Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // 允許前端連線
    methods: ["GET", "POST"]
  }
});

// ==========================================
// 1. 單字庫邏輯
// ==========================================
const WORD_LISTS = {};
const SUPPORTED_LENGTHS = [4, 5, 6, 7];

console.log('正在載入單字庫...');
SUPPORTED_LENGTHS.forEach(len => {
  const fileName = `${len}-letter-words.json`;
  const filePath = path.join(__dirname, fileName);
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const words = JSON.parse(fileContent).map(w => w.toUpperCase().trim());
    WORD_LISTS[len] = words;
    console.log(`✅ 成功載入 ${len} 個字母的單字：共 ${words.length} 個`);
  } catch (error) {
    WORD_LISTS[len] = len === 5 ? ['ERROR'] : ['TEST']; 
  }
});

const VALID_WORDS = new Set();
Object.values(WORD_LISTS).forEach(list => list.forEach(word => VALID_WORDS.add(word)));

// 單人模式的遊戲狀態 (保留原本功能)
const singlePlayerGames = new Map();

// ==========================================
// 2. 對戰模式邏輯 (Socket.IO)
// ==========================================
const rooms = {}; // 儲存所有對戰房間狀態

function generateRoomCode() {
  // 產生 6 碼小寫英文+數字
  return Math.random().toString(36).substring(2, 8);
}

function getRandomWord(length) {
  const list = WORD_LISTS[length];
  return list[Math.floor(Math.random() * list.length)];
}

// 啟動一個新回合（為特定玩家）
function startRoundForPlayer(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return;

  // 檢查是否有人達到30分
  const playerIds = Object.keys(room.players);
  const scores = playerIds.map(id => room.players[id].score);
  if (Math.max(...scores) >= 30) {
    const winnerId = playerIds[scores.indexOf(Math.max(...scores))];
    io.to(roomCode).emit('game_over', { players: room.players, winner: winnerId });
    return;
  }

  // 為該玩家生成新單字
  if (!room.currentWords) {
    room.currentWords = {};
  }
  room.currentWords[playerId] = getRandomWord(room.wordLength);
  
  // 重置該玩家的猜測次數
  if (!room.playerGuessCount) {
    room.playerGuessCount = {};
  }
  room.playerGuessCount[playerId] = 0;
  
  // 增加該玩家的回合數
  if (!room.playerRounds) {
    room.playerRounds = {};
  }
  if (!room.playerRounds[playerId]) {
    room.playerRounds[playerId] = 1;
  } else {
    room.playerRounds[playerId]++;
  }
  
  // 通知該玩家新回合開始
  const opponentId = playerIds.find(id => id !== playerId);
  io.to(playerId).emit('new_round', {
    myRound: room.playerRounds[playerId],
    opponentRound: room.playerRounds[opponentId] || 1,
    potentialPoints: 5
  });

  console.log(`[Room ${roomCode}] Player ${playerId} Round ${room.playerRounds[playerId]}. Word: ${room.currentWords[playerId]}`);
}


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. 創建房間
  socket.on('create_room', ({ wordLength }) => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      id: roomCode,
      wordLength: parseInt(wordLength),
      players: {},
      currentWords: {},
      playerRounds: {},
      playerGuessCount: {},
      status: 'waiting'
    };
    
    // 加入玩家 (房主)
    rooms[roomCode].players[socket.id] = { id: socket.id, score: 0, name: 'Player 1' };
    socket.join(roomCode);
    
    socket.emit('room_created', { roomCode });
    console.log(`Room created: ${roomCode}, Length: ${wordLength}`);
  });

  // 2. 加入房間
  socket.on('join_room', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error_message', '房間不存在');
      return;
    }
    if (Object.keys(room.players).length >= 2) {
      socket.emit('error_message', '房間已滿');
      return;
    }

    // 加入玩家 (挑戰者)
    rooms[roomCode].players[socket.id] = { id: socket.id, score: 0, name: 'Player 2' };
    socket.join(roomCode);
    
    // 房間滿了，開始遊戲
    room.status = 'playing';
    io.to(roomCode).emit('game_start', { 
      wordLength: room.wordLength,
      players: room.players
    });

    // 延遲3秒後為每個玩家開始第一回合
    setTimeout(() => {
      const playerIds = Object.keys(room.players);
      playerIds.forEach(playerId => {
        startRoundForPlayer(roomCode, playerId);
      });
    }, 3000);
  });

  // 3. 提交答案 (對戰模式)
  socket.on('submit_guess_competitive', ({ roomCode, guess }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;

    const normalizedGuess = guess.toUpperCase().trim();
    
    // 檢查長度
    if (normalizedGuess.length !== room.wordLength) return;
    if (!VALID_WORDS.has(normalizedGuess)) {
       socket.emit('guess_error', '不在字典中');
       return;
    }

    // 初始化玩家猜測次數
    if (!room.playerGuessCount) {
      room.playerGuessCount = {};
    }
    if (!room.playerGuessCount[socket.id]) {
      room.playerGuessCount[socket.id] = 0;
    }

    // 判斷對錯 - 使用該玩家專屬的單字
    const playerWord = room.currentWords[socket.id];
    const result = checkGuess(normalizedGuess, playerWord);
    const isCorrect = normalizedGuess === playerWord;
    
    // 增加猜測次數
    room.playerGuessCount[socket.id]++;
    const guessCount = room.playerGuessCount[socket.id];
    const gameOver = guessCount >= 6 && !isCorrect;
    
    // 回傳結果給該玩家
    socket.emit('guess_result', {
      guess: normalizedGuess,
      result: result,
      isCorrect: isCorrect,
      gameOver: gameOver
    });
    
    if (isCorrect) {
      // 答對了！
      const points = 5; // 固定5分
      room.players[socket.id].score += points;
      
      // 通知對手
      const opponentId = Object.keys(room.players).find(id => id !== socket.id);
      if (opponentId) {
        io.to(opponentId).emit('opponent_won_round', {
          opponentName: 'Opponent',
          word: playerWord,
          points: points
        });
      }
      
      // 廣播分數更新
      io.to(roomCode).emit('round_winner', {
        winnerId: socket.id,
        word: playerWord,
        points: points,
        updatedPlayers: room.players
      });
      
      // 1秒後為該玩家開始下一回合
      setTimeout(() => startRoundForPlayer(roomCode, socket.id), 1000);

    } else if (gameOver) {
      // 6次都沒猜到，1秒後開始下一回合
      setTimeout(() => startRoundForPlayer(roomCode, socket.id), 1000);
    }
  });

  // 4. 離開房間
  socket.on('leave_room', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (room && room.players[socket.id]) {
      delete room.players[socket.id];
      
      // 通知其他玩家
      socket.to(roomCode).emit('player_left', {
        message: 'Opponent left the game. Returning to lobby...'
      });
      
      // 清理房間
      if (Object.keys(room.players).length === 0) {
        delete rooms[roomCode];
      }
    }
    socket.leave(roomCode);
  });

  // 5. 跳過回合
  socket.on('skip_round', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    // 為該玩家開始下一回合
    startRoundForPlayer(roomCode, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // 找到玩家所在的房間並通知其他玩家
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        // 通知其他玩家
        socket.to(roomCode).emit('player_left', {
          message: 'Opponent disconnected. Returning to lobby...'
        });
        
        // 清理房間
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomCode];
        }
        break;
      }
    }
  });
});

// 單人模式的 API 保持不變 (為了不讓 server.js 太長，這裡省略 checkGuess 等函式宣告，
// 請確保你把剛剛 checkGuess, generateGameId, VALID_WORDS 等邏輯都包含在內)
// 注意：上面的代碼已經包含了 VALID_WORDS 的生成。
// 這裡補充 checkGuess (給單人與多人共用)
function checkGuess(guess, answer) {
    const result = [];
    const answerArray = answer.split('');
    const guessArray = guess.split('');
    const used = new Array(answer.length).fill(false);
    guessArray.forEach((letter, i) => {
      if (letter === answerArray[i]) { result[i] = 'correct'; used[i] = true; }
    });
    guessArray.forEach((letter, i) => {
      if (result[i]) return;
      const foundIndex = answerArray.findIndex((l, idx) => l === letter && !used[idx]);
      if (foundIndex !== -1) { result[i] = 'present'; used[foundIndex] = true; } 
      else { result[i] = 'absent'; }
    });
    return result;
}

// ... (請保留原本單人模式的 app.post('/api/game/new') 等 API 路由，不要刪除) ...
// 為了版面整潔，我這裡只寫出 Socket.IO 和 Server 啟動部分，
// 請務必把原本單人模式的 API 貼回這裡 (放在 io.on('connection') 區塊之後，server.listen 之前)

// 單人模式 API 區塊 (簡化版示意，請使用你原本的完整代碼)
// ----------------------------------------------------
function generateGameId() { return 'game_' + Date.now(); } // 單人用
app.get('/api/health', (req, res) => res.json({status: 'ok'}));

// 新增：單字表API
app.get('/api/words/:length', (req, res) => {
    try {
        const length = parseInt(req.params.length);
        if (!SUPPORTED_LENGTHS.includes(length)) {
            return res.status(400).json({ success: false, error: 'Invalid word length' });
        }
        
        const words = WORD_LISTS[length] || [];
        res.json({ success: true, words: words }); // 返回所有單字
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch words' });
    }
});

app.post('/api/game/new', (req, res) => {
    // ... 貼上你原本單人模式的 create game 邏輯 ...
    // 注意：要用到上面的 WORD_LISTS
    try {
        let length = parseInt(req.body.length) || 5;
        if (!SUPPORTED_LENGTHS.includes(length)) length = 5;
        const maxGuessesMap = { 4: 4, 5: 6, 6: 8, 7: 10 };
        const gameId = generateGameId();
        const list = WORD_LISTS[length];
        const answer = list[Math.floor(Math.random() * list.length)];
        const gameData = { id: gameId, answer, wordLength: length, guesses: [], gameOver: false, won: false, createdAt: new Date(), maxGuesses: maxGuessesMap[length] };
        singlePlayerGames.set(gameId, gameData); // 改名為 singlePlayerGames 避免衝突
        res.json({ success: true, gameId, wordLength: length, maxGuesses: maxGuessesMap[length] });
    } catch(e) { res.status(500).json({error: 'err'}); }
});
app.post('/api/game/:id/guess', (req, res) => {
    // ... 貼上你原本單人模式的 guess 邏輯 ...
    // 請記得把 games.get 改成 singlePlayerGames.get
    try {
        const { id } = req.params; const { guess } = req.body;
        const game = singlePlayerGames.get(id);
        if(!game) return res.status(404).json({error: 'Not found'});
        // ... 邏輯同前 ...
        const normalizedGuess = guess.toUpperCase().trim();
        if (!VALID_WORDS.has(normalizedGuess)) return res.status(400).json({success: false, error: 'Not in word list!'});
        const result = checkGuess(normalizedGuess, game.answer);
        game.guesses.push({word: normalizedGuess, result});
        if(normalizedGuess === game.answer) { game.won = true; game.gameOver = true; }
        else if(game.guesses.length >= game.maxGuesses) { game.gameOver = true; }
        res.json({ success: true, result, guesses: game.guesses, gameOver: game.gameOver, won: game.won, answer: game.gameOver ? game.answer : null, remainingGuesses: game.maxGuesses - game.guesses.length, message: game.won ? 'You Won!' : '' });
    } catch(e) { res.status(500).json({error: 'err'}); }
});
// ----------------------------------------------------

// 最後啟動 Server (注意是用 server.listen 而不是 app.listen)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});