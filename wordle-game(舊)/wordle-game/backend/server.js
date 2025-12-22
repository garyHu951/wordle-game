const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// 新增：引入 http 和 socket.io
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const PORT = process.env.PORT || 3002;

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

// 啟動一個新回合
function startRound(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  // 檢查是否結束 (5題 + 可能的加賽)
  // 如果已經比完 5 題，且分數不同，結束
  // 如果比完 5 題且同分，進入加賽 (Round 6)
  // 如果比完 6 題 (加賽結束)，強制結束
  if (room.currentRound > 5) {
     const p1Score = Object.values(room.players)[0].score;
     const p2Score = Object.values(room.players)[1].score;
     
     // 如果不是平手，或者已經是第 6 題(加賽完)，則結束
     if (p1Score !== p2Score || room.currentRound > 6) {
        io.to(roomCode).emit('game_over', { players: room.players, winner: getWinner(room) });
        clearInterval(room.timerInterval);
        return;
     }
     // 否則進入加賽
     io.to(roomCode).emit('tie_breaker_start');
  }

  // 設定題目
  room.currentWord = getRandomWord(room.wordLength);
  
  // 計算時間：(2n - 4) * 10
  const n = room.wordLength;
  room.roundTime = (2 * n - 4) * 10;
  room.timeLeft = room.roundTime;
  
  // 分數與提示設定
  room.potentialPoints = 5;
  room.hintsRevealed = 0;
  // 最多顯示 [n/2] 個字母
  room.maxHints = Math.floor(n / 2);
  
  // 通知前端回合開始
  io.to(roomCode).emit('new_round', {
    round: room.currentRound,
    timeLeft: room.timeLeft,
    totalRounds: 5, // 顯示用
    potentialPoints: 5,
    isTieBreaker: room.currentRound > 5
  });

  console.log(`[Room ${roomCode}] Round ${room.currentRound} Start. Word: ${room.currentWord}`);

  // 啟動計時器
  clearInterval(room.timerInterval);
  room.timerInterval = setInterval(() => {
    room.timeLeft--;
    
    // 每一秒更新一次時間給前端
    io.to(roomCode).emit('timer_update', room.timeLeft);

    // 提示邏輯：每過 10 秒 (且不是剛開始)
    const timePassed = room.roundTime - room.timeLeft;
    if (timePassed > 0 && timePassed % 10 === 0) {
      // 只有在還沒達到提示上限時，才扣分跟給提示
      if (room.hintsRevealed < room.maxHints) {
        room.hintsRevealed++;
        // 扣分，最低剩 1 分
        if (room.potentialPoints > 1) {
          room.potentialPoints--;
        }
        
        // 取得提示字母 (從頭開始顯示)
        const hintChar = room.currentWord[room.hintsRevealed - 1];
        const hintIndex = room.hintsRevealed - 1;

        io.to(roomCode).emit('hint_reveal', {
            index: hintIndex,
            char: hintChar,
            currentPoints: room.potentialPoints
        });
      }
    }

    // 時間到
    if (room.timeLeft <= 0) {
      clearInterval(room.timerInterval);
      // 時間到沒人答對，直接下一題
      room.currentRound++;
      startRound(roomCode);
    }
  }, 1000);
}

function getWinner(room) {
  const pIds = Object.keys(room.players);
  if (room.players[pIds[0]].score > room.players[pIds[1]].score) return pIds[0];
  if (room.players[pIds[1]].score > room.players[pIds[0]].score) return pIds[1];
  return 'draw'; // 理論上加賽後不會平手，除非加賽也沒人答對
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
      currentRound: 1,
      currentWord: '',
      timerInterval: null,
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

    // 延遲一點點開始第一題
    setTimeout(() => startRound(roomCode), 2000);
  });

  // 3. 提交答案 (對戰模式)
  socket.on('submit_guess_competitive', ({ roomCode, guess }) => {
    const room = rooms[roomCode];
    if (!room || room.status !== 'playing') return;

    const normalizedGuess = guess.toUpperCase().trim();
    
    // 檢查長度
    if (normalizedGuess.length !== room.wordLength) return; // 前端會擋，後端忽略
    if (!VALID_WORDS.has(normalizedGuess)) {
       socket.emit('guess_error', '不在字典中');
       return;
    }

    // 判斷對錯
    // 這裡我們簡化：在對戰模式中，只要猜對就是對，猜錯不給黃綠色提示(或者你要給也可以，這裡為了節奏先只判斷是否完全正確)
    // 根據你的描述「誰先猜出來就贏了該題」，所以主要判斷是否等於答案
    
    if (normalizedGuess === room.currentWord) {
      // 答對了！
      const points = room.potentialPoints;
      room.players[socket.id].score += points;
      
      // 廣播這回合結束，誰贏了
      io.to(roomCode).emit('round_winner', {
        winnerId: socket.id,
        word: room.currentWord,
        points: points,
        updatedPlayers: room.players
      });

      // 停止計時
      clearInterval(room.timerInterval);
      
      // 3秒後下一題
      room.currentRound++;
      setTimeout(() => startRound(roomCode), 3000);

    } else {
      // 猜錯了，回傳顏色提示給「該玩家」自己看
      const result = checkGuess(normalizedGuess, room.currentWord);
      socket.emit('guess_result', {
        guess: normalizedGuess,
        result: result
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // 簡單處理：如果有人斷線，房間可能會壞掉，這裡先不處理複雜斷線重連
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